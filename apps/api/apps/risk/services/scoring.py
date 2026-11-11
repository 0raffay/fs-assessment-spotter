"""Route scores and the recommendation, in the PDF's order.

Ranking: fewest No Travel miles, then Severe, then High; then the lowest average risk; then the
shortest drive time. No Travel ranks first because it is worse than Severe (an assumption the PDF
leaves open). The average is the mean RiskIndex (0-4) over checkpoints that have a forecast.
"""

from __future__ import annotations

from collections.abc import Iterable, Sequence

from ..types import (
    FewestMiles,
    LowestAverageRisk,
    ReasonFact,
    RiskLevel,
    RouteScore,
    ScoredSegment,
    ShortestTime,
    TimeVsFastest,
)

# Levels compared by miles, in order, before the average and the time.
RANKED_LEVELS: tuple[RiskLevel, ...] = (RiskLevel.NO_TRAVEL, RiskLevel.SEVERE, RiskLevel.HIGH)


def risk_miles(segments: Iterable[ScoredSegment]) -> dict[RiskLevel, float]:
    """Miles of road at each level (checkpoints without a forecast count nowhere)."""
    totals = {level: 0.0 for level in RiskLevel}
    for segment in segments:
        if segment.level is not None:
            totals[segment.level] += segment.miles
    return totals


def average_risk(segments: Iterable[ScoredSegment]) -> float:
    """Mean RiskIndex over checkpoints with a forecast, rounded to 2 places (0 if none)."""
    indexes = [segment.level.index for segment in segments if segment.level is not None]
    return round(sum(indexes) / len(indexes), 2) if indexes else 0.0


def sort_key(score: RouteScore) -> tuple[float, ...]:
    return (
        *(score.risk_miles[level] for level in RANKED_LEVELS),
        score.average_risk,
        score.duration_minutes,
    )


def rank_routes(scores: Sequence[RouteScore]) -> list[RouteScore]:
    """Best first. Python's sort is stable, so exact ties keep the routing API's order."""
    return sorted(scores, key=sort_key)


def reasons_for(winner: RouteScore, others: Sequence[RouteScore]) -> list[ReasonFact]:
    """Why the winner won: the first criterion that separated it, plus its time cost if any."""
    reasons: list[ReasonFact] = []
    decisive = next(
        (
            level
            for level in RANKED_LEVELS
            if any(other.risk_miles[level] != winner.risk_miles[level] for other in others)
        ),
        None,
    )
    if decisive is not None:
        reasons.append(
            FewestMiles(
                level=decisive,
                miles=winner.risk_miles[decisive],
                others_miles=tuple(other.risk_miles[decisive] for other in others),
            )
        )
    elif any(other.average_risk != winner.average_risk for other in others):
        reasons.append(
            LowestAverageRisk(
                value=winner.average_risk,
                others_values=tuple(other.average_risk for other in others),
            )
        )
    else:
        reasons.append(ShortestTime(minutes=winner.duration_minutes))

    fastest = min([winner.duration_minutes, *(other.duration_minutes for other in others)])
    if winner.duration_minutes > fastest:
        reasons.append(TimeVsFastest(delta_minutes=winner.duration_minutes - fastest))
    return reasons
