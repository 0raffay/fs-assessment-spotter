from apps.risk.services.scoring import average_risk, rank_routes, reasons_for, risk_miles
from apps.risk.types import (
    FewestMiles,
    LowestAverageRisk,
    RiskLevel,
    RouteScore,
    ScoredSegment,
    ShortestTime,
    TimeVsFastest,
)


def score(route_id, *, no_travel=0, severe=0, high=0, average=0.0, minutes=600):
    miles = {level: 0.0 for level in RiskLevel}
    miles.update({RiskLevel.NO_TRAVEL: no_travel, RiskLevel.SEVERE: severe, RiskLevel.HIGH: high})
    return RouteScore(route_id, miles, average, minutes)


def test_risk_miles_and_average_skip_checkpoints_without_a_forecast():
    segments = [
        ScoredSegment(25, RiskLevel.LOW),
        ScoredSegment(25, RiskLevel.SEVERE),
        ScoredSegment(10, RiskLevel.SEVERE),
        ScoredSegment(25, None),
    ]

    assert risk_miles(segments)[RiskLevel.SEVERE] == 35
    assert sum(risk_miles(segments).values()) == 60
    assert average_risk(segments) == round((0 + 3 + 3) / 3, 2)
    assert average_risk([ScoredSegment(25, None)]) == 0


def test_no_travel_miles_outrank_everything_else():
    calm_but_closed = score("a", no_travel=25, minutes=300)
    stormy_but_open = score("b", severe=400, high=200, average=3, minutes=900)

    assert [s.route_id for s in rank_routes([calm_but_closed, stormy_but_open])] == ["b", "a"]


def test_then_severe_then_high_then_average_then_time():
    routes = [
        score("time", minutes=500),
        score("severe", severe=50),
        score("high", high=50),
        score("average", average=1.5),
        score("fastest", minutes=400),
    ]

    assert [s.route_id for s in rank_routes(routes)] == [
        "fastest",
        "time",
        "average",
        "high",
        "severe",
    ]


def test_exact_ties_keep_the_routing_api_order():
    assert [s.route_id for s in rank_routes([score("x"), score("y")])] == ["x", "y"]


def test_reason_names_the_first_level_that_separated_the_routes():
    winner = score("w", severe=25, minutes=700)
    others = [score("o1", severe=75, minutes=600), score("o2", severe=25, high=50, minutes=650)]

    assert reasons_for(winner, others) == [
        FewestMiles(RiskLevel.SEVERE, 25, (75, 25)),
        TimeVsFastest(100),
    ]


def test_reason_falls_back_to_average_then_time():
    assert reasons_for(score("w", average=0.4), [score("o", average=1.1)]) == [
        LowestAverageRisk(0.4, (1.1,))
    ]
    assert reasons_for(score("w", minutes=500), [score("o", minutes=520)]) == [ShortestTime(500)]
