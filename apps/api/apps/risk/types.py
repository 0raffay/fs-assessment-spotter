"""Value types for weather risk. Plain frozen dataclasses: no Django, no HTTP."""

from __future__ import annotations

from collections.abc import Mapping
from dataclasses import dataclass
from enum import StrEnum


class RiskLevel(StrEnum):
    """Ordered safest → worst. `index` is the compact 0-4 form the API also uses."""

    LOW = "low"
    MODERATE = "moderate"
    HIGH = "high"
    SEVERE = "severe"
    NO_TRAVEL = "no_travel"

    @property
    def index(self) -> int:
        return RISK_LEVELS.index(self)

    @classmethod
    def from_index(cls, index: int) -> RiskLevel:
        return RISK_LEVELS[max(0, min(index, len(RISK_LEVELS) - 1))]


RISK_LEVELS: tuple[RiskLevel, ...] = tuple(RiskLevel)


class Condition(StrEnum):
    WIND = "wind"
    RAIN = "rain"
    SNOW = "snow"


CONDITIONS: tuple[Condition, ...] = tuple(Condition)


@dataclass(frozen=True)
class WeatherReading:
    """Weather at one place and hour, in the PDF's units."""

    wind_mph: float
    rain_in_per_hr: float
    snow_in_per_hr: float

    def value(self, condition: Condition) -> float:
        return {
            Condition.WIND: self.wind_mph,
            Condition.RAIN: self.rain_in_per_hr,
            Condition.SNOW: self.snow_in_per_hr,
        }[condition]


@dataclass(frozen=True)
class Classification:
    """Risk at one checkpoint after the threshold table and the load rules."""

    condition_levels: Mapping[Condition, RiskLevel]
    level: RiskLevel
    decided_by: Condition
    load_rule_applied: bool


@dataclass(frozen=True)
class ScoredSegment:
    """A checkpoint's share of a route: the miles it covers and its level (None: no forecast)."""

    miles: float
    level: RiskLevel | None


@dataclass(frozen=True)
class RouteScore:
    """What ranking needs to know about a route."""

    route_id: str
    risk_miles: Mapping[RiskLevel, float]
    average_risk: float
    duration_minutes: int


@dataclass(frozen=True)
class FewestMiles:
    level: RiskLevel
    miles: float
    others_miles: tuple[float, ...]
    kind: str = "fewest_miles"


@dataclass(frozen=True)
class LowestAverageRisk:
    value: float
    others_values: tuple[float, ...]
    kind: str = "lowest_average_risk"


@dataclass(frozen=True)
class ShortestTime:
    minutes: int
    kind: str = "shortest_time"


@dataclass(frozen=True)
class TimeVsFastest:
    delta_minutes: int
    kind: str = "time_vs_fastest"


ReasonFact = FewestMiles | LowestAverageRisk | ShortestTime | TimeVsFastest
