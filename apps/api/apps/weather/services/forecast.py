"""Forecasts for many points, batched and cached, and the reading at a given ETA."""

from __future__ import annotations

from collections.abc import Sequence
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime, timedelta
from typing import Protocol

from django.core.cache import cache as default_cache

from apps.risk.types import WeatherReading

from ..clients.open_meteo import MAX_FORECAST_DAYS
from ..types import HourlySeries, LngLat

# Points per provider request (keeps URLs short and responses quick), and how many requests run
# at once (a 400-cell heatmap is a few batches; fetching them together cuts the wait ~4x).
BATCH_SIZE = 100
MAX_PARALLEL_REQUESTS = 4
# Forecasts update hourly; a series stays fresh for 30 minutes.
CACHE_SECONDS = 30 * 60
# Coordinates are rounded for the cache key (~1 km), so nearby repeat lookups share a series.
CACHE_PRECISION = 2


class ForecastClient(Protocol):
    def hourly(
        self, points: Sequence[LngLat], start: datetime, hours: int
    ) -> list[HourlySeries]: ...


class Cache(Protocol):
    def get_many(self, keys: Sequence[str]) -> dict[str, object]: ...
    def set_many(self, data: dict[str, object], timeout: int | None = ...) -> object: ...


def floor_to_hour(moment: datetime) -> datetime:
    return moment.astimezone(UTC).replace(minute=0, second=0, microsecond=0)


def forecast_horizon(issued_at: datetime) -> datetime:
    """The last hour the provider forecasts (its 16-day window starts at today's midnight UTC)."""
    midnight = issued_at.astimezone(UTC).replace(hour=0, minute=0, second=0, microsecond=0)
    return midnight + timedelta(days=MAX_FORECAST_DAYS) - timedelta(hours=1)


def nearest_hour(moment: datetime) -> datetime:
    """The forecast hour used for an ETA: rounded to the nearest whole hour."""
    floored = floor_to_hour(moment)
    return floored + timedelta(hours=1) if moment - floored >= timedelta(minutes=30) else floored


def reading_at(series: HourlySeries, moment: datetime) -> WeatherReading | None:
    """The reading for the hour nearest `moment`, or None if the series doesn't cover it."""
    if not len(series):
        return None
    offset = int((nearest_hour(moment) - series.start).total_seconds() // 3600)
    if not 0 <= offset < len(series):
        return None
    return WeatherReading(
        wind_mph=series.wind_mph[offset],
        rain_in_per_hr=series.rain_in_per_hr[offset],
        snow_in_per_hr=series.snow_in_per_hr[offset],
    )


class ForecastService:
    """Hourly series for many points: cached per point, missing ones fetched in batches."""

    def __init__(self, client: ForecastClient, cache: Cache | None = None) -> None:
        self.client = client
        self.cache = cache if cache is not None else default_cache

    @staticmethod
    def _key(point: LngLat, start: datetime, hours: int) -> str:
        lng, lat = (round(v, CACHE_PRECISION) for v in point)
        return f"wx:{lng}:{lat}:{start:%Y%m%d%H}:{hours}"

    def series(self, points: Sequence[LngLat], start: datetime, hours: int) -> list[HourlySeries]:
        """Series for every point (same order) from `start` (an hour) for `hours` more hours."""
        start = floor_to_hour(start)
        keys = [self._key(point, start, hours) for point in points]
        cached = self.cache.get_many(list(dict.fromkeys(keys)))
        missing = list(dict.fromkeys(k for k in keys if k not in cached))
        if missing:
            point_for = dict(zip(keys, points, strict=True))
            batches = [missing[i : i + BATCH_SIZE] for i in range(0, len(missing), BATCH_SIZE)]

            def fetch(batch: list[str]) -> list[HourlySeries]:
                return self.client.hourly([point_for[k] for k in batch], start, hours)

            fetched: dict[str, object] = {}
            if len(batches) == 1:
                results = [fetch(batches[0])]
            else:
                with ThreadPoolExecutor(max_workers=MAX_PARALLEL_REQUESTS) as pool:
                    results = list(pool.map(fetch, batches))
            for batch, batch_results in zip(batches, results, strict=True):
                fetched.update(zip(batch, batch_results, strict=True))
            self.cache.set_many(fetched, CACHE_SECONDS)
            cached = {**cached, **fetched}
        return [cached[key] for key in keys]  # type: ignore[misc]
