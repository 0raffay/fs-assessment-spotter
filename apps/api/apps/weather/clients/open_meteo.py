"""Open-Meteo forecast client: free, no key, many points per request.

Docs: https://open-meteo.com/en/docs. Units are requested in mph and inches so values match the
PDF's thresholds directly. Rain is `rain + showers` (both are the hour's total, so in/hr).
"""

from __future__ import annotations

from collections.abc import Sequence
from datetime import UTC, datetime, timedelta
from typing import Any

from apps.core.http import ProviderError, get_json

from ..types import HourlySeries, LngLat

PROVIDER = "Open-Meteo"
DEFAULT_URL = "https://api.open-meteo.com/v1/forecast"
# The furthest ahead Open-Meteo forecasts (16 days); ETAs past this have no forecast.
MAX_FORECAST_DAYS = 16
HOURLY = "wind_speed_10m,wind_gusts_10m,rain,showers,snowfall"


def _hour_param(moment: datetime) -> str:
    return moment.astimezone(UTC).strftime("%Y-%m-%dT%H:%M")


def _floats(values: Sequence[Any] | None, length: int) -> tuple[float, ...]:
    """`length` floats: Open-Meteo sends null for missing values, which count as 0."""
    out = [float(v) if v is not None else 0.0 for v in list(values or [])[:length]]
    return tuple(out + [0.0] * (length - len(out)))


def _parse(item: dict[str, Any]) -> HourlySeries:
    hourly = item.get("hourly") or {}
    times = tuple(datetime.fromisoformat(t).replace(tzinfo=UTC) for t in hourly.get("time", []))
    n = len(times)
    rain = _floats(hourly.get("rain"), n)
    showers = _floats(hourly.get("showers"), n)
    return HourlySeries(
        times=times,
        wind_mph=_floats(hourly.get("wind_speed_10m"), n),
        gust_mph=_floats(hourly.get("wind_gusts_10m"), n),
        rain_in_per_hr=tuple(round(r + s, 3) for r, s in zip(rain, showers, strict=True)),
        snow_in_per_hr=_floats(hourly.get("snowfall"), n),
    )


class OpenMeteoClient:
    """Fetches hourly series for many points in one request."""

    def __init__(self, *, url: str = DEFAULT_URL, timeout: float = 15.0) -> None:
        self.url = url
        self.timeout = timeout

    def hourly(self, points: Sequence[LngLat], start: datetime, hours: int) -> list[HourlySeries]:
        """Series for `points` (same order) covering `start` … `start + hours` inclusive, in UTC."""
        if not points:
            return []
        end = start + timedelta(hours=hours)
        payload = get_json(
            PROVIDER,
            self.url,
            {
                "latitude": ",".join(f"{lat:.4f}" for _, lat in points),
                "longitude": ",".join(f"{lng:.4f}" for lng, _ in points),
                "hourly": HOURLY,
                "wind_speed_unit": "mph",
                "precipitation_unit": "inch",
                "timezone": "GMT",
                "start_hour": _hour_param(start),
                "end_hour": _hour_param(end),
            },
            timeout=self.timeout,
        )
        # One point answers with an object, several with a list.
        items = payload if isinstance(payload, list) else [payload]
        if isinstance(payload, dict) and payload.get("error"):
            raise ProviderError(PROVIDER, str(payload.get("reason", "error")))
        if len(items) != len(points):
            raise ProviderError(PROVIDER, f"expected {len(points)} locations, got {len(items)}")
        return [_parse(item) for item in items]
