"""Value types for forecasts. Coordinates are (longitude, latitude), as in GeoJSON and the API."""

from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime

LngLat = tuple[float, float]


@dataclass(frozen=True)
class HourlySeries:
    """One place's hourly forecast. `times` are UTC hour starts, evenly spaced one hour apart."""

    times: tuple[datetime, ...]
    wind_mph: tuple[float, ...]
    gust_mph: tuple[float, ...]
    rain_in_per_hr: tuple[float, ...]
    snow_in_per_hr: tuple[float, ...]

    @property
    def start(self) -> datetime:
        return self.times[0]

    def __len__(self) -> int:
        return len(self.times)
