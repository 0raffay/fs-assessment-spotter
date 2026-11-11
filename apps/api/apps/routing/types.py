"""Value types for trip planning. Coordinates are (longitude, latitude) everywhere."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from datetime import datetime

from apps.risk.types import Classification, ReasonFact, RiskLevel, WeatherReading

LngLat = tuple[float, float]
BBox = tuple[float, float, float, float]


@dataclass(frozen=True)
class Place:
    id: str
    name: str
    region: str
    coordinates: LngLat
    time_zone: str


@dataclass(frozen=True)
class TripRequest:
    origin: Place
    destination: Place
    departure_at: datetime
    load_weight_lb: int
    interval_miles: int


@dataclass(frozen=True)
class RawRoute:
    """A route as the routing provider returned it.

    `spans` cut `points` into stretches with the provider's own road length and drive time, so
    ETAs follow real speeds (not distance divided by an average speed).
    """

    points: tuple[LngLat, ...]
    span_offsets: tuple[int, ...]
    span_lengths_m: tuple[float, ...]
    span_durations_s: tuple[float, ...]
    is_generated: bool = False

    @property
    def length_m(self) -> float:
        return sum(self.span_lengths_m)

    @property
    def duration_s(self) -> float:
        return sum(self.span_durations_s)


@dataclass(frozen=True)
class CheckpointForecast:
    forecast_hour: datetime
    weather: WeatherReading
    classification: Classification


@dataclass(frozen=True)
class Checkpoint:
    id: str
    index: int
    mile: float
    segment_miles: float
    coordinates: LngLat
    location_label: str
    eta: datetime
    time_zone: str
    forecast: CheckpointForecast | None  # None: the ETA is beyond the forecast range


@dataclass(frozen=True)
class PlannedRoute:
    id: str
    rank: int
    name: str
    via: str
    distance_miles: int
    duration_minutes: int
    departure_at: datetime
    arrival_at: datetime
    geometry: tuple[LngLat, ...]
    checkpoints: tuple[Checkpoint, ...]
    risk_miles: Mapping[RiskLevel, float]
    average_risk: float
    is_recommended: bool
    is_fastest: bool
    is_generated: bool


@dataclass(frozen=True)
class TripPlan:
    id: str
    request: TripRequest
    routes: tuple[PlannedRoute, ...]
    recommended_route_id: str
    reasons: tuple[ReasonFact, ...]
    bbox: BBox
    forecast_issued_at: datetime
    generated_at: datetime
