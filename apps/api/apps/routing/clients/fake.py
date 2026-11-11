"""Offline stand-ins for HERE, for development without a key and for end-to-end tests.

Enabled with SKYRIG_PROVIDERS=fake. Routes are smooth curves between the two places: one direct,
two bowed to either side, at truck-like speeds. Geocoding only answers from the offline town list
(the geocode service asks the provider only for ZIPs and street addresses).
"""

from __future__ import annotations

import math
from datetime import datetime

from ..services.geometry import haversine_miles
from ..types import LngLat, RawRoute
from .here import GeocodeResult

# (bow as a share of the trip length, average mph); the first is the provider's "best" route.
SHAPES: tuple[tuple[float, float], ...] = ((0.0, 61.0), (0.16, 59.0), (-0.14, 57.0))
POINTS = 160
SPAN_POINTS = 8
ROAD_FACTOR = 1.18  # roads are longer than the straight line


def _curve(origin: LngLat, destination: LngLat, bow: float) -> list[LngLat]:
    scale = math.cos(math.radians((origin[1] + destination[1]) / 2)) or 1.0
    dx = (destination[0] - origin[0]) * scale
    dy = destination[1] - origin[1]
    nx, ny = -dy, dx  # left normal, not normalized: its length is the trip's length
    points: list[LngLat] = []
    for i in range(POINTS + 1):
        t = i / POINTS
        lift = math.sin(math.pi * t) * bow
        wiggle = math.sin(t * math.pi * 6) * 0.01
        x = origin[0] + (destination[0] - origin[0]) * t + (nx * (lift + wiggle)) / scale
        y = origin[1] + (destination[1] - origin[1]) * t + ny * (lift + wiggle)
        points.append((round(x, 5), round(y, 5)))
    return points


class FakeRouter:
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
        shapes = SHAPES[: alternatives + 1] if via is None else SHAPES[-1:]
        out: list[RawRoute] = []
        for bow, mph in shapes:
            points = _curve(origin, destination, bow)
            offsets, lengths, durations = [], [], []
            for start in range(0, len(points) - 1, SPAN_POINTS):
                end = min(start + SPAN_POINTS, len(points) - 1)
                miles = sum(haversine_miles(points[i], points[i + 1]) for i in range(start, end))
                road_miles = miles * ROAD_FACTOR
                offsets.append(start)
                lengths.append(road_miles * 1609.344)
                durations.append(road_miles / mph * 3600)
            out.append(
                RawRoute(
                    points=tuple(points),
                    span_offsets=tuple(offsets),
                    span_lengths_m=tuple(lengths),
                    span_durations_s=tuple(durations),
                    is_generated=via is not None,
                )
            )
        return out

    def geocode(self, query: str, *, limit: int) -> list[GeocodeResult]:
        return []
