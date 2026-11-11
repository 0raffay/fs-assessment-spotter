"""Domain objects → the contract's camelCase JSON (docs/api-contract.md, TripPlan)."""

from __future__ import annotations

from datetime import UTC, datetime
from typing import Any

from apps.risk.types import ReasonFact, RiskLevel

from ..types import Checkpoint, Place, PlannedRoute, TripPlan, TripRequest


def iso(moment: datetime) -> str:
    """UTC with a Z, to the second: what the frontend's schema expects."""
    return moment.astimezone(UTC).strftime("%Y-%m-%dT%H:%M:%SZ")


def place_json(place: Place) -> dict[str, Any]:
    return {
        "id": place.id,
        "name": place.name,
        "region": place.region,
        "coordinates": list(place.coordinates),
        "timeZone": place.time_zone,
    }


def request_json(request: TripRequest) -> dict[str, Any]:
    return {
        "origin": place_json(request.origin),
        "destination": place_json(request.destination),
        "departureAt": iso(request.departure_at),
        "loadWeightLb": request.load_weight_lb,
        "intervalMiles": request.interval_miles,
    }


def _risk_record(values: Any) -> dict[str, Any]:
    return {level.value: values[level] for level in RiskLevel}


def checkpoint_json(checkpoint: Checkpoint) -> dict[str, Any]:
    forecast: dict[str, Any] = {"status": "unavailable"}
    if checkpoint.forecast is not None:
        weather = checkpoint.forecast.weather
        result = checkpoint.forecast.classification
        forecast = {
            "status": "available",
            "forecastHour": iso(checkpoint.forecast.forecast_hour),
            "weather": {
                "wind": round(weather.wind_mph, 1),
                "rain": round(weather.rain_in_per_hr, 2),
                "snow": round(weather.snow_in_per_hr, 2),
            },
            "conditionLevels": {c.value: lvl.value for c, lvl in result.condition_levels.items()},
            "level": result.level.value,
            "decidedBy": result.decided_by.value,
            "loadRuleApplied": result.load_rule_applied,
        }
    return {
        "id": checkpoint.id,
        "index": checkpoint.index,
        "mile": checkpoint.mile,
        "segmentMiles": checkpoint.segment_miles,
        "coordinates": list(checkpoint.coordinates),
        "locationLabel": checkpoint.location_label,
        "eta": iso(checkpoint.eta),
        "timeZone": checkpoint.time_zone,
        "forecast": forecast,
    }


def route_json(route: PlannedRoute) -> dict[str, Any]:
    return {
        "id": route.id,
        "rank": route.rank,
        "name": route.name,
        "via": route.via,
        "distanceMiles": route.distance_miles,
        "durationMinutes": route.duration_minutes,
        "departureAt": iso(route.departure_at),
        "arrivalAt": iso(route.arrival_at),
        "geometry": [[round(lng, 5), round(lat, 5)] for lng, lat in route.geometry],
        "checkpoints": [checkpoint_json(c) for c in route.checkpoints],
        "riskMiles": _risk_record(route.risk_miles),
        "averageRisk": route.average_risk,
        "isRecommended": route.is_recommended,
        "isFastest": route.is_fastest,
        "isGenerated": route.is_generated,
    }


def reason_json(reason: ReasonFact) -> dict[str, Any]:
    match reason.kind:
        case "fewest_miles":
            return {
                "kind": reason.kind,
                "level": reason.level.value,
                "miles": reason.miles,
                "othersMiles": list(reason.others_miles),
            }
        case "lowest_average_risk":
            return {
                "kind": reason.kind,
                "value": reason.value,
                "othersValues": list(reason.others_values),
            }
        case "shortest_time":
            return {"kind": reason.kind, "minutes": reason.minutes}
        case _:
            return {"kind": reason.kind, "deltaMinutes": reason.delta_minutes}


def plan_json(plan: TripPlan) -> dict[str, Any]:
    return {
        "id": plan.id,
        "request": request_json(plan.request),
        "routes": [route_json(route) for route in plan.routes],
        "recommendedRouteId": plan.recommended_route_id,
        "reasons": [reason_json(reason) for reason in plan.reasons],
        "bbox": list(plan.bbox),
        "forecastIssuedAt": iso(plan.forecast_issued_at),
        "generatedAt": iso(plan.generated_at),
    }
