"""An offline forecast for development and end-to-end tests (SKYRIG_PROVIDERS=fake).

A fixed field of "storms" tiled across the US: every request sees the same weather at the same
place and hour, so the heatmap and the route checkpoints agree, with no network access.
"""

from __future__ import annotations

import math
from collections.abc import Sequence
from datetime import datetime, timedelta

from ..types import HourlySeries, LngLat

# Storm centers repeat every TILE_LNG x TILE_LAT degrees, alternating wind, rain and snow storms.
TILE_LNG, TILE_LAT = 7.0, 5.0
ORIGIN_LNG, ORIGIN_LAT = -125.0, 25.0
RADIUS = 2.0
# Peak values by storm kind: (wind mph, rain in/hr, snow in/hr).
KINDS = ((52.0, 0.1, 0.0), (28.0, 0.7, 0.0), (22.0, 0.0, 2.4))


def _storms_near(lng: float, lat: float) -> list[tuple[float, float, int, int]]:
    """(center lng, center lat, peak hour offset, kind) of the storm tiles around a point."""
    i0 = math.floor((lng - ORIGIN_LNG) / TILE_LNG)
    j0 = math.floor((lat - ORIGIN_LAT) / TILE_LAT)
    storms = []
    for i in (i0 - 1, i0, i0 + 1):
        for j in (j0 - 1, j0, j0 + 1):
            cx = ORIGIN_LNG + (i + 0.5) * TILE_LNG + (j % 2) * 2.0
            cy = ORIGIN_LAT + (j + 0.5) * TILE_LAT
            storms.append((cx, cy, (i * 7 + j * 11) % 36 + 8, (i + j) % 3))
    return storms


def weather_at(lng: float, lat: float, moment: datetime) -> tuple[float, float, float]:
    """(wind mph, rain in/hr, snow in/hr) at a place and UTC time. Storms build, peak and fade
    over a day and drift east."""
    day_hour = moment.hour + moment.day * 24  # a stable clock across days
    wind = 6.0 + 3.0 * math.sin(moment.hour / 24 * 2 * math.pi)
    rain = snow = 0.0
    for cx, cy, peak, kind in _storms_near(lng, lat):
        phase = (day_hour - peak) % 48 - 24  # -24 … +24 hours around the peak
        drift = phase * 0.06
        distance = math.hypot((lng - cx - drift) * math.cos(math.radians(lat)), lat - cy) / RADIUS
        strength = max(0.0, 1 - distance) * math.exp(-((phase / 9) ** 2))
        s_wind, s_rain, s_snow = KINDS[kind]
        wind = max(wind, s_wind * strength)
        rain = max(rain, s_rain * strength)
        snow = max(snow, s_snow * strength)
    return (round(max(0.0, wind), 1), round(rain, 2), round(snow, 2))


class FakeForecastClient:
    def hourly(self, points: Sequence[LngLat], start: datetime, hours: int) -> list[HourlySeries]:
        out: list[HourlySeries] = []
        for lng, lat in points:
            times = tuple(start + timedelta(hours=h) for h in range(hours + 1))
            values = [weather_at(lng, lat, t) for t in times]
            out.append(
                HourlySeries(
                    times=times,
                    wind_mph=tuple(v[0] for v in values),
                    gust_mph=tuple(round(v[0] * 1.35, 1) for v in values),
                    rain_in_per_hr=tuple(v[1] for v in values),
                    snow_in_per_hr=tuple(v[2] for v in values),
                )
            )
        return out
