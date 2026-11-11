"""Route geometry: distances, positions and drive times along a route, and helpers for naming."""

from __future__ import annotations

import math
from bisect import bisect_right
from collections.abc import Sequence

from ..types import BBox, LngLat, RawRoute

EARTH_RADIUS_MILES = 3958.7613
METERS_PER_MILE = 1609.344


def haversine_miles(a: LngLat, b: LngLat) -> float:
    lng1, lat1 = map(math.radians, a)
    lng2, lat2 = map(math.radians, b)
    h = (
        math.sin((lat2 - lat1) / 2) ** 2
        + math.cos(lat1) * math.cos(lat2) * math.sin((lng2 - lng1) / 2) ** 2
    )
    return 2 * EARTH_RADIUS_MILES * math.asin(math.sqrt(h))


class RouteLine:
    """A route with the road miles and drive seconds reached at every vertex.

    Inside each provider span, its road length and duration are spread over the vertices in
    proportion to their straight-line distance, so positions and ETAs follow the provider's own
    speeds.
    """

    def __init__(self, route: RawRoute) -> None:
        points = route.points
        if len(points) < 2:
            raise ValueError("a route needs at least two points")
        self.points = points
        self.miles: list[float] = [0.0] * len(points)
        self.seconds: list[float] = [0.0] * len(points)

        offsets = [*route.span_offsets, len(points) - 1]
        road_miles = seconds = 0.0
        for span, start in enumerate(route.span_offsets):
            end = max(start, offsets[span + 1])
            geo = [haversine_miles(points[i], points[i + 1]) for i in range(start, end)]
            total = sum(geo)
            span_miles = route.span_lengths_m[span] / METERS_PER_MILE
            span_seconds = route.span_durations_s[span]
            done = 0.0
            for step, i in enumerate(range(start, end)):
                done += geo[step]
                share = done / total if total else 1.0
                self.miles[i + 1] = road_miles + span_miles * share
                self.seconds[i + 1] = seconds + span_seconds * share
            road_miles += span_miles
            seconds += span_seconds
        # Vertices after the last span (shouldn't happen) keep the last totals.
        for i in range(1, len(points)):
            self.miles[i] = max(self.miles[i], self.miles[i - 1])
            self.seconds[i] = max(self.seconds[i], self.seconds[i - 1])

    @property
    def total_miles(self) -> float:
        return self.miles[-1]

    @property
    def total_seconds(self) -> float:
        return self.seconds[-1]

    def at_mile(self, mile: float) -> tuple[LngLat, float]:
        """The point and the drive seconds from the start at `mile` along the road."""
        mile = min(max(mile, 0.0), self.total_miles)
        i = min(bisect_right(self.miles, mile), len(self.miles) - 1)
        if i == 0:
            return self.points[0], 0.0
        m0, m1 = self.miles[i - 1], self.miles[i]
        t = (mile - m0) / (m1 - m0) if m1 > m0 else 1.0
        (x0, y0), (x1, y1) = self.points[i - 1], self.points[i]
        point = (x0 + (x1 - x0) * t, y0 + (y1 - y0) * t)
        seconds = self.seconds[i - 1] + (self.seconds[i] - self.seconds[i - 1]) * t
        return point, seconds

    def at_fraction(self, fraction: float) -> LngLat:
        return self.at_mile(self.total_miles * fraction)[0]


def thin(points: Sequence[LngLat], min_miles: float = 0.3) -> tuple[LngLat, ...]:
    """Drop vertices closer than `min_miles` to the last kept one (keeps the ends) for drawing."""
    if len(points) <= 2:
        return tuple(points)
    kept = [points[0]]
    for point in points[1:-1]:
        if haversine_miles(kept[-1], point) >= min_miles:
            kept.append(point)
    kept.append(points[-1])
    return tuple(kept)


def padded_bbox(paths: Sequence[Sequence[LngLat]], padding: float = 1.0) -> BBox:
    """Bounding box of all paths, padded and snapped outward to the 0.5° heatmap grid."""
    lngs = [lng for path in paths for lng, _ in path]
    lats = [lat for path in paths for _, lat in path]
    return (
        math.floor((min(lngs) - padding) * 2) / 2,
        math.floor((min(lats) - padding) * 2) / 2,
        math.ceil((max(lngs) + padding) * 2) / 2,
        math.ceil((max(lats) + padding) * 2) / 2,
    )


def _local_xy(point: LngLat, origin: LngLat) -> tuple[float, float]:
    """Approximate flat coordinates (degrees of latitude) around `origin`."""
    scale = math.cos(math.radians(origin[1]))
    return ((point[0] - origin[0]) * scale, point[1] - origin[1])


def side_offset(line: RouteLine, origin: LngLat, destination: LngLat) -> float:
    """Mean signed distance (degrees) of the route from the straight origin → destination line.

    Positive is to the left of the direction of travel.
    """
    dx, dy = _local_xy(destination, origin)
    length = math.hypot(dx, dy) or 1.0
    samples = [line.at_fraction(f / 20) for f in range(1, 20)]
    total = 0.0
    for point in samples:
        px, py = _local_xy(point, origin)
        total += (dx * py - dy * px) / length  # cross product: + is left
    return total / len(samples)


def left_normal(origin: LngLat, destination: LngLat) -> tuple[float, float]:
    """Unit vector pointing left of the travel direction, in local (east, north) coordinates."""
    dx, dy = _local_xy(destination, origin)
    length = math.hypot(dx, dy) or 1.0
    return (-dy / length, dx / length)


def overlap(a: RouteLine, b: RouteLine, tolerance_miles: float = 3.0) -> float:
    """Share of route `a` (sampled every ~5 mi) that runs within `tolerance_miles` of route `b`."""
    steps = max(10, int(a.total_miles / 5))
    b_points = thin(b.points, 1.0)
    close = 0
    for step in range(steps + 1):
        point = a.at_mile(a.total_miles * step / steps)[0]
        if any(haversine_miles(point, q) <= tolerance_miles for q in b_points):
            close += 1
    return close / (steps + 1)
