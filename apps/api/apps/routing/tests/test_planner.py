import itertools
import uuid
from datetime import UTC, datetime, timedelta

import pytest
from django.core.cache.backends.locmem import LocMemCache

from apps.risk.types import RiskLevel
from apps.routing.clients.fake import FakeRouter
from apps.routing.services.cities import city_index
from apps.routing.services.geocode import place_from_city
from apps.routing.services.geometry import RouteLine
from apps.routing.services.planner import NoRouteFound, plan_trip, route_names
from apps.routing.types import TripRequest
from apps.weather.services.forecast import ForecastService
from apps.weather.tests.fakes import FakeForecastClient

NOW = datetime(2026, 11, 12, 13, 40, tzinfo=UTC)


def place(name, state):
    [city] = city_index().search(f"{name}, {state}", 1)
    return place_from_city(city)


def request(departure=NOW + timedelta(hours=2), interval=25, load=42_000):
    return TripRequest(
        origin=place("Dallas", "TX"),
        destination=place("Denver", "CO"),
        departure_at=departure,
        load_weight_lb=load,
        interval_miles=interval,
    )


def forecasts(weather=None):
    client = FakeForecastClient(weather) if weather else FakeForecastClient()
    return ForecastService(client, LocMemCache(f"planner-tests-{uuid.uuid4()}", {}))


class CountingRouter(FakeRouter):
    """The fake router, limited to `count` routes per request (to exercise generated ones)."""

    def __init__(self, count):
        self.count = count
        self.via_requests = 0

    def routes(self, origin, destination, *, alternatives=2, via=None, **kwargs):
        if via is not None:
            self.via_requests += 1
        routes = super().routes(origin, destination, alternatives=alternatives, via=via, **kwargs)
        return routes[: self.count]


def test_plan_has_three_ranked_routes_with_checkpoints_every_interval():
    plan = plan_trip(request(), router=FakeRouter(), forecasts=forecasts(), now=NOW)

    assert len(plan.routes) == 3
    assert [r.rank for r in plan.routes] == [1, 2, 3]
    assert plan.routes[0].is_recommended and plan.recommended_route_id == plan.routes[0].id
    assert plan.forecast_issued_at == datetime(2026, 11, 12, 13, tzinfo=UTC)
    assert sum(r.is_fastest for r in plan.routes) >= 1
    for route in plan.routes:
        miles = [c.mile for c in route.checkpoints]
        assert miles[0] == 0 and all(b - a == 25 for a, b in itertools.pairwise(miles))
        assert sum(c.segment_miles for c in route.checkpoints) == pytest.approx(
            route.distance_miles, abs=1
        )
        etas = [c.eta for c in route.checkpoints]
        assert etas[0] == route.departure_at and etas == sorted(etas)
        assert route.arrival_at > etas[-1]
        assert sum(route.risk_miles.values()) == pytest.approx(route.distance_miles, abs=1)
    # The bbox covers every route, snapped to the 0.5° grid.
    west, south, east, north = plan.bbox
    assert west <= -105.99 and east >= -95.8 and south <= 31.78 and north >= 40.74


def test_checkpoints_get_labels_time_zones_and_the_nearest_forecast_hour():
    plan = plan_trip(request(), router=FakeRouter(), forecasts=forecasts(), now=NOW)
    first = plan.routes[0].checkpoints[0]

    assert first.location_label == "Dallas, TX" and first.time_zone == "America/Chicago"
    assert first.forecast is not None
    assert first.forecast.forecast_hour == datetime(2026, 11, 12, 16, tzinfo=UTC)  # 15:40 → 16:00
    last = plan.routes[0].checkpoints[-1]
    assert last.time_zone == "America/Denver"


def test_etas_past_the_forecast_range_have_no_forecast():
    # The forecast ends at 23:00 UTC on 27 Nov (16 days from today's midnight): a trip leaving at
    # 14:00 that day starts inside it and ends outside it.
    far = datetime(2026, 11, 27, 14, tzinfo=UTC)
    plan = plan_trip(request(departure=far), router=FakeRouter(), forecasts=forecasts(), now=NOW)

    checkpoints = plan.routes[0].checkpoints
    assert checkpoints[0].forecast is not None
    assert checkpoints[-1].forecast is None
    covered = sum(c.segment_miles for c in checkpoints if c.forecast is not None)
    assert sum(plan.routes[0].risk_miles.values()) == pytest.approx(covered, abs=0.5)


def test_storm_on_one_route_makes_another_route_win():
    # A No Travel wind storm over the trip's midpoint: only the direct route passes through it
    # (the fake's other two routes bow well away from the straight line there).
    origin, destination = request().origin.coordinates, request().destination.coordinates
    mid = ((origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2)

    def storm(point, hour):
        near_mid = abs(point[0] - mid[0]) < 0.6 and abs(point[1] - mid[1]) < 0.6
        return (60.0 if near_mid else 8.0, 0.0, 0.0)

    plan = plan_trip(request(), router=FakeRouter(), forecasts=forecasts(storm), now=NOW)

    winner = plan.routes[0]
    assert winner.name != "Direct route"
    assert winner.risk_miles[RiskLevel.NO_TRAVEL] == 0
    [reason, *_] = plan.reasons
    assert reason.kind == "fewest_miles" and reason.level is RiskLevel.NO_TRAVEL


def test_fewer_routes_from_the_provider_are_topped_up_with_generated_ones():
    router = CountingRouter(count=1)
    plan = plan_trip(request(), router=router, forecasts=forecasts(), now=NOW)

    assert router.via_requests == 2
    assert sum(r.is_generated for r in plan.routes) == len(plan.routes) - 1


def test_no_route_raises():
    with pytest.raises(NoRouteFound):
        plan_trip(request(), router=CountingRouter(count=0), forecasts=forecasts(), now=NOW)


def test_route_names_by_side_of_the_straight_line():
    router = FakeRouter()
    origin, destination = place("Dallas", "TX"), place("Denver", "CO")
    lines = [
        RouteLine(r)
        for r in router.routes(
            origin.coordinates, destination.coordinates, departure=NOW, gross_weight_lb=1
        )
    ]
    # Dallas → Denver runs north-west, so the left bow is south-west (mostly west) and the right
    # bow north-east (mostly east).
    assert route_names(lines, origin.coordinates, destination.coordinates) == [
        "Direct route",
        "Western route",
        "Eastern route",
    ]
