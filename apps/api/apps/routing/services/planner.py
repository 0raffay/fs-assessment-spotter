"""Plan a trip: three truck routes, checkpoints with ETAs, weather risk at each ETA, ranking.

The routing provider finds roads; this module decides between them. Steps:
1. Ask for up to three routes; if fewer come back, generate alternates through an offset
   waypoint (marked `is_generated`).
2. Cut each route into checkpoints every N miles. Each ETA is the departure plus the provider's
   own drive time to that point.
3. Look up the forecast hour nearest each ETA (one batched, cached request for all points).
4. Classify each checkpoint with the PDF rules; total miles per level; rank; explain the winner.
"""

from __future__ import annotations

import math
import uuid
from collections.abc import Sequence
from dataclasses import dataclass, replace
from datetime import datetime, timedelta
from typing import Protocol

from apps.risk.services.rules import classify
from apps.risk.services.scoring import average_risk, rank_routes, reasons_for, risk_miles
from apps.risk.types import RouteScore, ScoredSegment
from apps.weather.services.forecast import (
    ForecastService,
    floor_to_hour,
    forecast_horizon,
    nearest_hour,
    reading_at,
)

from ..types import (
    Checkpoint,
    CheckpointForecast,
    LngLat,
    PlannedRoute,
    RawRoute,
    TripPlan,
    TripRequest,
)
from .cities import city_index
from .geometry import (
    RouteLine,
    left_normal,
    overlap,
    padded_bbox,
    side_offset,
    thin,
)

ROUTE_COUNT = 3
# Generated alternates: waypoint offsets (as a share of the trip's straight-line length).
ALTERNATE_OFFSETS = (0.18, -0.18)
# A generated alternate must differ from the existing routes and not be absurdly slow.
MAX_OVERLAP = 0.75
MAX_SLOWDOWN = 1.6
# A checkpoint closer than this to a town is labeled "Salina, KS", otherwise "near Salina, KS".
AT_TOWN_MILES = 12


class NoRouteFound(Exception):
    """The routing provider found no road route between the two places."""


class Router(Protocol):
    def routes(
        self,
        origin: LngLat,
        destination: LngLat,
        *,
        departure: datetime,
        gross_weight_lb: int,
        alternatives: int = ...,
        via: LngLat | None = ...,
    ) -> list[RawRoute]: ...


@dataclass(frozen=True)
class _Sample:
    """A checkpoint before its weather is known."""

    index: int
    mile: float
    segment_miles: float
    coordinates: LngLat
    eta: datetime


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


def _offset_point(origin: LngLat, destination: LngLat, share: float) -> LngLat:
    """The trip's midpoint pushed sideways by `share` of the straight-line length."""
    mid = ((origin[0] + destination[0]) / 2, (origin[1] + destination[1]) / 2)
    nx, ny = left_normal(origin, destination)
    scale = math.cos(math.radians(mid[1])) or 1.0
    dx = (destination[0] - origin[0]) * scale
    dy = destination[1] - origin[1]
    length = math.hypot(dx, dy)
    return (mid[0] + nx * length * share / scale, mid[1] + ny * length * share)


def fetch_routes(router: Router, request: TripRequest) -> list[RawRoute]:
    """Up to three distinct routes: the provider's own, topped up with generated alternates."""
    origin, destination = request.origin.coordinates, request.destination.coordinates
    routes = router.routes(
        origin,
        destination,
        departure=request.departure_at,
        gross_weight_lb=request.load_weight_lb,
        alternatives=ROUTE_COUNT - 1,
    )[:ROUTE_COUNT]
    if not routes:
        raise NoRouteFound
    lines = [RouteLine(route) for route in routes]
    fastest = min(line.total_seconds for line in lines)

    for share in ALTERNATE_OFFSETS:
        if len(routes) >= ROUTE_COUNT:
            break
        candidates = router.routes(
            origin,
            destination,
            departure=request.departure_at,
            gross_weight_lb=request.load_weight_lb,
            alternatives=0,
            via=_offset_point(origin, destination, share),
        )
        for candidate in candidates[:1]:
            line = RouteLine(candidate)
            distinct = all(overlap(line, other) < MAX_OVERLAP for other in lines)
            if distinct and line.total_seconds <= fastest * MAX_SLOWDOWN:
                routes.append(replace(candidate, is_generated=True))
                lines.append(line)
    return routes


def route_names(lines: Sequence[RouteLine], origin: LngLat, destination: LngLat) -> list[str]:
    """ "Direct route" for the one closest to the straight line; the others by the side they bow
    to ("Northern route"), with "Outer" for a second route further out on the same side."""
    offsets = [side_offset(line, origin, destination) for line in lines]
    direct = min(range(len(lines)), key=lambda i: abs(offsets[i]))
    nx, ny = left_normal(origin, destination)
    names = [""] * len(lines)
    names[direct] = "Direct route"
    used: dict[str, int] = {}
    others = sorted((i for i in range(len(lines)) if i != direct), key=lambda i: abs(offsets[i]))
    for i in others:
        sign = 1 if offsets[i] >= 0 else -1
        ex, ey = nx * sign, ny * sign
        if abs(ey) >= abs(ex):
            side = "Northern" if ey > 0 else "Southern"
        else:
            side = "Eastern" if ex > 0 else "Western"
        names[i] = f"{side} route" if side not in used else f"Outer {side.lower()} route"
        used[side] = i
    return names


def via_label(line: RouteLine, request: TripRequest) -> str:
    """ "via Amarillo, Raton": the towns nearest a third and two thirds of the way."""
    index = city_index()
    exclude = {
        hit[0].id
        for hit in (
            index.nearest(request.origin.coordinates),
            index.nearest(request.destination.coordinates),
        )
        if hit
    }
    names: list[str] = []
    for fraction in (0.35, 0.68):
        hit = index.nearest(line.at_fraction(fraction), exclude=frozenset(exclude))
        if hit:
            exclude.add(hit[0].id)
            names.append(hit[0].name)
    return f"via {', '.join(names)}" if names else "via the most direct roads"


# ---------------------------------------------------------------------------
# Checkpoints and weather
# ---------------------------------------------------------------------------


def sample_checkpoints(line: RouteLine, departure: datetime, interval_miles: int) -> list[_Sample]:
    """A checkpoint at mile 0 and every `interval_miles` after; each stands for the road up to
    the next one (the last one up to the destination)."""
    total = line.total_miles
    samples: list[_Sample] = []
    mile = 0.0
    while mile < total or not samples:
        point, seconds = line.at_mile(mile)
        samples.append(
            _Sample(
                index=len(samples),
                mile=round(mile, 1),
                # Positive by contract, even when the route ends just past an interval mark.
                segment_miles=max(0.01, round(min(interval_miles, total - mile), 2)),
                coordinates=(round(point[0], 5), round(point[1], 5)),
                eta=departure + timedelta(seconds=seconds),
            )
        )
        mile += interval_miles
    return samples


def location_label(point: LngLat) -> tuple[str, str]:
    """("near Salina, KS", "America/Chicago") from the nearest town."""
    hit = city_index().nearest(point)
    if hit is None:
        return ("Open road", "America/Chicago")
    city, miles = hit
    near = "" if miles < AT_TOWN_MILES else "near "
    return (f"{near}{city.name}, {city.state}", city.time_zone)


# ---------------------------------------------------------------------------
# Plan
# ---------------------------------------------------------------------------


def plan_trip(
    request: TripRequest,
    *,
    router: Router,
    forecasts: ForecastService,
    now: datetime,
) -> TripPlan:
    issued_at = floor_to_hour(now)
    horizon = forecast_horizon(issued_at)
    plan_id = f"plan-{uuid.uuid4().hex[:12]}"

    raw_routes = fetch_routes(router, request)
    lines = [RouteLine(route) for route in raw_routes]
    samples = [
        sample_checkpoints(line, request.departure_at, request.interval_miles) for line in lines
    ]

    # One forecast request for every checkpoint the forecast can reach.
    in_range = [
        s for route in samples for s in route if issued_at <= nearest_hour(s.eta) <= horizon
    ]
    series_by_point = {}
    if in_range:
        last = max(nearest_hour(s.eta) for s in in_range)
        hours = max(1, int((last - issued_at).total_seconds() // 3600))
        points = list(dict.fromkeys(s.coordinates for s in in_range))
        series_by_point = dict(zip(points, forecasts.series(points, issued_at, hours), strict=True))

    origin, destination = request.origin.coordinates, request.destination.coordinates
    names = route_names(lines, origin, destination)
    built: list[PlannedRoute] = []
    scores: list[RouteScore] = []

    for number, (raw, line, route_samples) in enumerate(
        zip(raw_routes, lines, samples, strict=True)
    ):
        route_id = f"{plan_id}-r{number + 1}"
        checkpoints: list[Checkpoint] = []
        for sample in route_samples:
            label, time_zone = location_label(sample.coordinates)
            forecast = None
            series = series_by_point.get(sample.coordinates)
            reading = reading_at(series, sample.eta) if series is not None else None
            if reading is not None:
                forecast = CheckpointForecast(
                    forecast_hour=nearest_hour(sample.eta),
                    weather=reading,
                    classification=classify(reading, request.load_weight_lb),
                )
            checkpoints.append(
                Checkpoint(
                    id=f"{route_id}-c{sample.index}",
                    index=sample.index,
                    mile=sample.mile,
                    segment_miles=sample.segment_miles,
                    coordinates=sample.coordinates,
                    location_label=label,
                    eta=sample.eta,
                    time_zone=time_zone,
                    forecast=forecast,
                )
            )

        segments = [
            ScoredSegment(c.segment_miles, c.forecast.classification.level if c.forecast else None)
            for c in checkpoints
        ]
        miles = {level: round(value, 1) for level, value in risk_miles(segments).items()}
        average = average_risk(segments)
        duration_minutes = max(1, round(line.total_seconds / 60))
        scores.append(RouteScore(route_id, miles, average, duration_minutes))
        built.append(
            PlannedRoute(
                id=route_id,
                rank=0,
                name=names[number],
                via=via_label(line, request),
                distance_miles=max(1, round(line.total_miles)),
                duration_minutes=duration_minutes,
                departure_at=request.departure_at,
                arrival_at=request.departure_at + timedelta(seconds=line.total_seconds),
                geometry=thin(line.points),
                checkpoints=tuple(checkpoints),
                risk_miles=miles,
                average_risk=average,
                is_recommended=False,
                is_fastest=False,
                is_generated=raw.is_generated,
            )
        )

    ranked = rank_routes(scores)
    by_id = {route.id: route for route in built}
    fastest = min(route.duration_minutes for route in built)
    routes = tuple(
        replace(
            by_id[score.route_id],
            rank=rank,
            is_recommended=rank == 1,
            is_fastest=by_id[score.route_id].duration_minutes == fastest,
        )
        for rank, score in enumerate(ranked, start=1)
    )
    winner, *others = ranked

    return TripPlan(
        id=plan_id,
        request=request,
        routes=routes,
        recommended_route_id=winner.route_id,
        reasons=tuple(reasons_for(winner, others)),
        bbox=padded_bbox([route.geometry for route in routes]),
        forecast_issued_at=issued_at,
        generated_at=now,
    )
