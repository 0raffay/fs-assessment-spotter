"""Test doubles for the forecast provider."""

from __future__ import annotations

from collections.abc import Callable, Sequence
from datetime import datetime, timedelta

from apps.weather.types import HourlySeries, LngLat

# (point, hour offset from start) -> (wind mph, rain in/hr, snow in/hr)
WeatherFn = Callable[[LngLat, int], tuple[float, float, float]]


def calm(_point: LngLat, _hour: int) -> tuple[float, float, float]:
    return (5.0, 0.0, 0.0)


def make_series(point: LngLat, start: datetime, hours: int, weather: WeatherFn) -> HourlySeries:
    values = [weather(point, h) for h in range(hours + 1)]
    return HourlySeries(
        times=tuple(start + timedelta(hours=h) for h in range(hours + 1)),
        wind_mph=tuple(v[0] for v in values),
        gust_mph=tuple(v[0] * 1.3 for v in values),
        rain_in_per_hr=tuple(v[1] for v in values),
        snow_in_per_hr=tuple(v[2] for v in values),
    )


class FakeForecastClient:
    """Answers from a function and records each request (for batching/caching assertions)."""

    def __init__(self, weather: WeatherFn = calm) -> None:
        self.weather = weather
        self.calls: list[int] = []

    def hourly(self, points: Sequence[LngLat], start: datetime, hours: int) -> list[HourlySeries]:
        self.calls.append(len(points))
        return [make_series(point, start, hours, self.weather) for point in points]
