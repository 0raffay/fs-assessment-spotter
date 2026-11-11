"""HERE clients: Geocoding & Search v7 and Routing v8 (truck mode).

Docs: https://www.here.com/docs/bundle/geocoding-and-search-api-v7-api-reference and
https://www.here.com/docs/bundle/routing-api-v8-api-reference. The key stays on the server.
"""

from __future__ import annotations

from dataclasses import dataclass
from datetime import UTC, datetime
from typing import Any

from apps.core.http import ProviderError, get_json

from ..types import LngLat, RawRoute
from .flexpolyline import decode

PROVIDER = "HERE"
GEOCODE_URL = "https://geocode.search.hereapi.com/v1/geocode"
ROUTES_URL = "https://router.hereapi.com/v8/routes"
KG_PER_LB = 0.45359237


@dataclass(frozen=True)
class GeocodeResult:
    id: str
    name: str
    region: str
    coordinates: LngLat


def _place_id(here_id: str) -> str:
    return here_id if here_id.startswith("here:") else f"here:{here_id}"


def _name(item: dict[str, Any]) -> str:
    """A short display name: the street address for addresses, else the city (+ ZIP)."""
    address = item.get("address") or {}
    city = address.get("city") or address.get("county") or ""
    if item.get("resultType") in ("houseNumber", "street", "intersection"):
        street = " ".join(p for p in (address.get("houseNumber"), address.get("street")) if p)
        return ", ".join(p for p in (street, city) if p) or item.get("title", "")
    postal = address.get("postalCode") or ""
    if postal and (item.get("title") or "").startswith(postal):  # a ZIP search: "Dallas 75201"
        return f"{city} {postal}".strip()
    return city or item.get("title", "")


def _route(route: dict[str, Any], *, generated: bool) -> RawRoute:
    """Join a route's sections into one line, shifting each section's span offsets."""
    points: list[LngLat] = []
    offsets: list[int] = []
    lengths: list[float] = []
    durations: list[float] = []
    for section in route.get("sections", []):
        section_points = [(lng, lat) for lat, lng in decode(section["polyline"])]
        base = len(points) - 1 if points else 0  # sections share their joining point
        if points:
            section_points = section_points[1:]
        points.extend(section_points)
        spans = section.get("spans") or [
            {"offset": 0, **{k: section["summary"][k] for k in ("length", "duration")}}
        ]
        for span in spans:
            offsets.append(base + int(span["offset"]))
            lengths.append(float(span.get("length", 0)))
            durations.append(float(span.get("duration", 0)))
    return RawRoute(
        points=tuple(points),
        span_offsets=tuple(offsets),
        span_lengths_m=tuple(lengths),
        span_durations_s=tuple(durations),
        is_generated=generated,
    )


class HereClient:
    def __init__(self, api_key: str, *, timeout: float = 15.0) -> None:
        self.api_key = api_key
        self.timeout = timeout

    def _get(self, url: str, params: dict[str, Any]) -> Any:
        if not self.api_key:
            raise ProviderError(PROVIDER, "HERE_API_KEY is not configured")
        return get_json(PROVIDER, url, {**params, "apiKey": self.api_key}, timeout=self.timeout)

    def geocode(self, query: str, *, limit: int) -> list[GeocodeResult]:
        payload = self._get(GEOCODE_URL, {"q": query, "in": "countryCode:USA", "limit": limit})
        results: list[GeocodeResult] = []
        for item in payload.get("items", []):
            position = item.get("position") or {}
            if "lat" not in position or "lng" not in position:
                continue
            results.append(
                GeocodeResult(
                    # HERE ids already read "here:cm:…"; prefix only if one ever doesn't.
                    id=_place_id(str(item.get("id", ""))),
                    name=_name(item),
                    region=(item.get("address") or {}).get("stateCode", ""),
                    coordinates=(float(position["lng"]), float(position["lat"])),
                )
            )
        return results

    def routes(
        self,
        origin: LngLat,
        destination: LngLat,
        *,
        departure: datetime,
        gross_weight_lb: int,
        alternatives: int = 2,
        via: LngLat | None = None,
    ) -> list[RawRoute]:
        """Truck routes, best first. `via` forces a pass-through point (generated alternates)."""
        params: dict[str, Any] = {
            "transportMode": "truck",
            "origin": f"{origin[1]},{origin[0]}",
            "destination": f"{destination[1]},{destination[0]}",
            "return": "polyline,summary",
            # Spans split where the road name changes (~every few miles), each with HERE's own
            # length and drive time, so ETAs follow real speeds along the way.
            "spans": "names,length,duration",
            "alternatives": alternatives,
            "departureTime": departure.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "vehicle[grossWeight]": max(1, round(gross_weight_lb * KG_PER_LB)),
        }
        if via is not None:
            params["via"] = f"{via[1]},{via[0]}!passThrough=true"
        payload = self._get(ROUTES_URL, params)
        return [_route(route, generated=via is not None) for route in payload.get("routes", [])]
