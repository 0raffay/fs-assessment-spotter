import pytest

from apps.routing.services.geometry import (
    METERS_PER_MILE,
    RouteLine,
    haversine_miles,
    padded_bbox,
    thin,
)
from apps.routing.types import RawRoute


def straight_route(spans):
    """A route due east along the equator; `spans` is [(miles, minutes), ...] per stretch."""
    total = sum(miles for miles, _ in spans)
    degrees_per_mile = 1 / 69.17
    points, offsets = [(0.0, 0.0)], []
    for miles, _ in spans:
        offsets.append(len(points) - 1)
        x0 = points[-1][0]
        for step in range(1, 11):
            points.append((x0 + miles * degrees_per_mile * step / 10, 0.0))
    assert total
    return RawRoute(
        points=tuple(points),
        span_offsets=tuple(offsets),
        span_lengths_m=tuple(miles * METERS_PER_MILE for miles, _ in spans),
        span_durations_s=tuple(minutes * 60 for _, minutes in spans),
    )


def test_haversine_one_degree_of_latitude():
    assert haversine_miles((0, 0), (0, 1)) == pytest.approx(69.09, abs=0.1)


def test_route_line_eta_follows_each_spans_speed():
    # 60 mi at 60 mph, then 60 mi at 30 mph.
    line = RouteLine(straight_route([(60, 60), (60, 120)]))

    assert line.total_miles == pytest.approx(120)
    assert line.total_seconds == pytest.approx(180 * 60)
    assert line.at_mile(30)[1] == pytest.approx(30 * 60, rel=0.01)
    assert line.at_mile(90)[1] == pytest.approx((60 + 60) * 60, rel=0.01)
    point, _ = line.at_mile(60)
    assert point[0] == pytest.approx(60 / 69.17, rel=0.01)


def test_route_line_clamps_beyond_the_ends():
    line = RouteLine(straight_route([(10, 10)]))
    assert line.at_mile(-5) == (line.points[0], 0.0)
    assert line.at_mile(500)[1] == pytest.approx(line.total_seconds)


def test_thin_keeps_ends_and_drops_close_points():
    points = [(i * 0.001, 0.0) for i in range(100)]  # ~0.07 mi apart
    thinned = thin(points, min_miles=1.0)
    assert thinned[0] == points[0] and thinned[-1] == points[-1]
    assert len(thinned) < 10


def test_padded_bbox_snaps_outward_to_half_degrees():
    assert padded_bbox([[(-96.8, 32.78), (-104.99, 39.74)]]) == (-106.0, 31.5, -95.5, 41.0)
