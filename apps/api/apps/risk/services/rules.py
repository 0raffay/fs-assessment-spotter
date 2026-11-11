"""The PDF's risk rules: the threshold table, then the load-weight rules for wind.

Boundaries: a value on a band's lower bound belongs to that (higher) band. The PDF's top bands
read "≥55 mph" for wind but ">1.00 in/hr" for rain and ">3.0 in/hr" for snow, so wind's No Travel
bound is inclusive and rain/snow's are exclusive.
"""

from __future__ import annotations

from ..types import CONDITIONS, Classification, Condition, RiskLevel, WeatherReading

# Lower bound of Moderate, High, Severe and No Travel for each condition.
THRESHOLDS: dict[Condition, tuple[float, float, float, float]] = {
    Condition.WIND: (25, 35, 45, 55),  # mph, sustained
    Condition.RAIN: (0.10, 0.25, 0.50, 1.00),  # in/hr
    Condition.SNOW: (0.5, 1.0, 2.0, 3.0),  # in/hr
}

# Load rules (pounds of load, compared with ">" as in the PDF).
NO_TRAVEL_WIND_MPH = (45, 55)  # 45-54 mph …
NO_TRAVEL_LOAD_LB = 30_000  # … with a load over 30,000 lb is No Travel
SEVERE_WIND_MPH = (35, 45)  # 35-44 mph …
SEVERE_LOAD_LB = 40_000  # … with a load over 40,000 lb is at least Severe


def load_band(load_weight_lb: float) -> int:
    """0, 1 or 2: which load rules can apply. Loads in the same band always classify alike, so
    results (e.g. a heatmap) can be shared between them."""
    return int(load_weight_lb > NO_TRAVEL_LOAD_LB) + int(load_weight_lb > SEVERE_LOAD_LB)


def condition_level(condition: Condition, value: float) -> RiskLevel:
    """One condition's level from the threshold table."""
    moderate, high, severe, no_travel = THRESHOLDS[condition]
    is_no_travel = value >= no_travel if condition is Condition.WIND else value > no_travel
    if is_no_travel:
        return RiskLevel.NO_TRAVEL
    if value >= severe:
        return RiskLevel.SEVERE
    if value >= high:
        return RiskLevel.HIGH
    if value >= moderate:
        return RiskLevel.MODERATE
    return RiskLevel.LOW


def wind_level_for_load(wind_mph: float, load_weight_lb: float) -> RiskLevel:
    """Wind level after the load rules (heavier loads tolerate less wind)."""
    level = condition_level(Condition.WIND, wind_mph)
    low, high = NO_TRAVEL_WIND_MPH
    if low <= wind_mph < high and load_weight_lb > NO_TRAVEL_LOAD_LB:
        return RiskLevel.NO_TRAVEL
    low, high = SEVERE_WIND_MPH
    if low <= wind_mph < high and load_weight_lb > SEVERE_LOAD_LB:
        return max(level, RiskLevel.SEVERE, key=lambda lvl: lvl.index)
    return level


def classify(weather: WeatherReading, load_weight_lb: float) -> Classification:
    """A checkpoint's overall level: the worst condition after load rules, and which one decided."""
    base = {c: condition_level(c, weather.value(c)) for c in CONDITIONS}
    levels = {**base, Condition.WIND: wind_level_for_load(weather.wind_mph, load_weight_lb)}
    level = max(levels.values(), key=lambda lvl: lvl.index)
    # Ties go to the first condition in wind, rain, snow order (stable, matches the UI's order).
    decided_by = next(condition for condition in CONDITIONS if levels[condition] is level)
    return Classification(
        condition_levels=levels,
        level=level,
        decided_by=decided_by,
        load_rule_applied=levels[Condition.WIND] is not base[Condition.WIND],
    )
