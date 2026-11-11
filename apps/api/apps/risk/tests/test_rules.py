import pytest

from apps.risk.services.rules import classify, condition_level, load_band, wind_level_for_load
from apps.risk.types import Condition, RiskLevel, WeatherReading

LOW, MOD, HIGH, SEV, NT = (
    RiskLevel.LOW,
    RiskLevel.MODERATE,
    RiskLevel.HIGH,
    RiskLevel.SEVERE,
    RiskLevel.NO_TRAVEL,
)


@pytest.mark.parametrize(
    ("mph", "level"),
    [
        (0, LOW),
        (24.9, LOW),
        (25, MOD),
        (34.9, MOD),
        (35, HIGH),
        (44.9, HIGH),
        (45, SEV),
        (54.9, SEV),
        (55, NT),
        (80, NT),
    ],
)
def test_wind_bands_include_their_lower_bound(mph, level):
    assert condition_level(Condition.WIND, mph) is level


@pytest.mark.parametrize(
    ("inches", "level"),
    [(0, LOW), (0.09, LOW), (0.10, MOD), (0.25, HIGH), (0.50, SEV), (1.00, SEV), (1.01, NT)],
)
def test_rain_no_travel_is_strictly_over_one_inch(inches, level):
    assert condition_level(Condition.RAIN, inches) is level


@pytest.mark.parametrize(
    ("inches", "level"),
    [(0.4, LOW), (0.5, MOD), (1.0, HIGH), (2.0, SEV), (3.0, SEV), (3.1, NT)],
)
def test_snow_no_travel_is_strictly_over_three_inches(inches, level):
    assert condition_level(Condition.SNOW, inches) is level


@pytest.mark.parametrize(
    ("mph", "load", "level"),
    [
        # 45-54 mph: over 30,000 lb is No Travel, 30,000 exactly is not.
        (45, 30_001, NT),
        (54.9, 45_000, NT),
        (45, 30_000, SEV),
        # 35-44 mph: over 40,000 lb is raised to Severe.
        (35, 40_001, SEV),
        (44.9, 80_000, SEV),
        (35, 40_000, HIGH),
        # Outside those bands the load changes nothing.
        (34.9, 80_000, MOD),
        (55, 1_000, NT),
    ],
)
def test_load_rules(mph, load, level):
    assert wind_level_for_load(mph, load) is level


def test_classify_takes_the_worst_condition_and_names_it():
    result = classify(WeatherReading(wind_mph=20, rain_in_per_hr=0.3, snow_in_per_hr=1.2), 10_000)

    assert result.condition_levels == {
        Condition.WIND: LOW,
        Condition.RAIN: HIGH,
        Condition.SNOW: HIGH,
    }
    assert result.level is HIGH
    # Ties go to the first condition in wind → rain → snow order.
    assert result.decided_by is Condition.RAIN
    assert result.load_rule_applied is False


def test_classify_reports_when_the_load_rule_decides():
    result = classify(WeatherReading(wind_mph=47, rain_in_per_hr=0, snow_in_per_hr=0), 42_000)

    assert result.level is NT
    assert result.decided_by is Condition.WIND
    assert result.load_rule_applied is True


def test_load_rule_is_not_reported_when_it_changes_nothing():
    result = classify(WeatherReading(wind_mph=60, rain_in_per_hr=0, snow_in_per_hr=0), 79_000)

    assert result.level is NT
    assert result.load_rule_applied is False


def test_load_bands_follow_the_load_rule_thresholds():
    assert [load_band(lb) for lb in (1, 30_000, 30_001, 40_000, 40_001, 80_000)] == [
        0,
        0,
        1,
        1,
        2,
        2,
    ]
