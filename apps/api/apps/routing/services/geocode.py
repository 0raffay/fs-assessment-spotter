"""Location search: offline US places first (instant, no quota), HERE for addresses and ZIPs."""

from __future__ import annotations

from typing import Protocol

from ..clients.here import GeocodeResult
from ..types import Place
from .cities import City, city_index

MAX_RESULTS = 6


class Geocoder(Protocol):
    def geocode(self, query: str, *, limit: int) -> list[GeocodeResult]: ...


def place_from_city(city: City) -> Place:
    return Place(
        id=city.id,
        name=city.name,
        region=city.state,
        coordinates=city.coordinates,
        time_zone=city.time_zone,
    )


def place_from_result(result: GeocodeResult) -> Place:
    """A provider result, with the time zone of the nearest known town."""
    nearest = city_index().nearest(result.coordinates)
    time_zone = nearest[0].time_zone if nearest else "America/Chicago"
    return Place(
        id=result.id,
        name=result.name,
        region=result.region,
        coordinates=result.coordinates,
        time_zone=time_zone,
    )


def search_places(query: str, geocoder: Geocoder) -> list[Place]:
    """Town names are answered offline; anything with digits (ZIP, street address) or no local
    match goes to the geocoding provider."""
    text = query.strip()
    if not any(char.isdigit() for char in text):
        local = city_index().search(text, MAX_RESULTS)
        if local:
            return [place_from_city(city) for city in local]
    return [place_from_result(result) for result in geocoder.geocode(text, limit=MAX_RESULTS)]
