"""Offline US places (GeoNames, CC BY 4.0): nearest town and time zone, and place-name search.

The data file is built by `scripts/build_us_cities.py`: US places with 2,500+ people, biggest
first. Lookups use a 1-degree grid, so "nearest town" is fast for every checkpoint.
"""

from __future__ import annotations

import json
import math
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path

from .geometry import haversine_miles

DATA_FILE = Path(__file__).resolve().parent.parent / "data" / "us_cities.json"


@dataclass(frozen=True)
class City:
    id: str
    name: str
    state: str
    coordinates: tuple[float, float]  # (lng, lat)
    population: int
    time_zone: str


class CityIndex:
    def __init__(self, cities: list[City]) -> None:
        self.cities = cities  # biggest first
        self._grid: dict[tuple[int, int], list[City]] = {}
        for city in cities:
            self._grid.setdefault(self._cell(city.coordinates), []).append(city)

    @staticmethod
    def _cell(point: tuple[float, float]) -> tuple[int, int]:
        lng, lat = point
        return (math.floor(lng), math.floor(lat))

    def nearest(
        self, point: tuple[float, float], *, exclude: frozenset[str] = frozenset()
    ) -> tuple[City, float] | None:
        """The closest place (and its distance in miles), widening the search ring as needed."""
        cx, cy = self._cell(point)
        best: tuple[City, float] | None = None
        for radius in range(0, 6):
            for dx in range(-radius, radius + 1):
                for dy in range(-radius, radius + 1):
                    if max(abs(dx), abs(dy)) != radius:
                        continue  # only the new ring
                    for city in self._grid.get((cx + dx, cy + dy), ()):
                        if city.id in exclude:
                            continue
                        miles = haversine_miles(point, city.coordinates)
                        if best is None or miles < best[1]:
                            best = (city, miles)
            # The next ring is at least `radius` degrees away; a degree is 35+ mi in the US (the
            # shortest is a degree of longitude at the Canadian border).
            if best is not None and best[1] <= radius * 35:
                break
        return best

    def search(self, query: str, limit: int) -> list[City]:
        """Places whose name starts with the query, biggest first. "Dallas, TX" filters by state."""
        text = query.strip().lower()
        state: str | None = None
        if "," in text:
            text, _, rest = text.partition(",")
            state = rest.strip().upper() or None
        else:
            words = text.rsplit(" ", 1)
            if len(words) == 2 and len(words[1]) == 2 and words[1].isalpha():
                text, state = words[0], words[1].upper()
        text = text.strip()
        if len(text) < 2:
            return []
        matches: list[City] = []
        for city in self.cities:
            if city.name.lower().startswith(text) and (state is None or city.state == state):
                matches.append(city)
                if len(matches) == limit:
                    break
        return matches


@lru_cache(maxsize=1)
def city_index() -> CityIndex:
    rows = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    return CityIndex(
        [
            City(
                id=f"geonames:{name}-{state}-{lat:.2f},{lng:.2f}".lower().replace(" ", "-"),
                name=name,
                state=state,
                coordinates=(lng, lat),
                population=population,
                time_zone=time_zone,
            )
            for name, state, lng, lat, population, time_zone in rows
        ]
    )
