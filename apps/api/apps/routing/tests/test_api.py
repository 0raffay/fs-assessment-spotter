import re
from datetime import timedelta

import pytest
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from apps.core import providers
from apps.core.http import ProviderBusy, ProviderError, ProviderTimeout

DALLAS = {
    "id": "geonames:dallas",
    "name": "Dallas",
    "region": "TX",
    "coordinates": [-96.807, 32.783],
    "timeZone": "America/Chicago",
}
DENVER = {
    "id": "geonames:denver",
    "name": "Denver",
    "region": "CO",
    "coordinates": [-104.985, 39.739],
    "timeZone": "America/Denver",
}
ISO_Z = r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$"


@pytest.fixture(autouse=True)
def fake_providers():
    cache.clear()
    with override_settings(SKYRIG_PROVIDERS="fake"):
        yield


def body(**overrides):
    departure = (timezone.now() + timedelta(hours=3)).isoformat()
    return {
        "origin": DALLAS,
        "destination": DENVER,
        "departureAt": departure,
        "loadWeightLb": 42_000,
        "intervalMiles": 25,
        **overrides,
    }


def plan(**overrides):
    return APIClient().post(reverse("routing:plan"), body(**overrides), format="json")


def test_geocode_returns_places():
    response = APIClient().get(reverse("routing:geocode"), {"q": "Amaril"})

    assert response.status_code == 200
    [first, *_] = response.json()["results"]
    assert first["name"] == "Amarillo" and first["region"] == "TX"
    assert first["timeZone"] == "America/Chicago"
    assert len(first["coordinates"]) == 2


def test_geocode_validates_the_query():
    response = APIClient().get(reverse("routing:geocode"), {"q": "a"})

    assert response.status_code == 400
    assert response.json()["code"] == "invalid"
    assert "q" in response.json()["fieldErrors"]


def test_plan_matches_the_contract():
    response = plan()

    assert response.status_code == 200
    data = response.json()
    assert set(data) == {
        "id",
        "request",
        "routes",
        "recommendedRouteId",
        "reasons",
        "bbox",
        "forecastIssuedAt",
        "generatedAt",
    }
    assert data["request"]["origin"] == DALLAS and data["request"]["intervalMiles"] == 25
    assert len(data["routes"]) == 3 and len(data["bbox"]) == 4
    assert data["recommendedRouteId"] == data["routes"][0]["id"]
    route = data["routes"][0]
    assert set(route) == {
        "id",
        "rank",
        "name",
        "via",
        "distanceMiles",
        "durationMinutes",
        "departureAt",
        "arrivalAt",
        "geometry",
        "checkpoints",
        "riskMiles",
        "averageRisk",
        "isRecommended",
        "isFastest",
        "isGenerated",
    }
    assert set(route["riskMiles"]) == {"low", "moderate", "high", "severe", "no_travel"}
    checkpoint = route["checkpoints"][0]
    assert set(checkpoint) == {
        "id",
        "index",
        "mile",
        "segmentMiles",
        "coordinates",
        "locationLabel",
        "eta",
        "timeZone",
        "forecast",
    }
    forecast = checkpoint["forecast"]
    assert forecast["status"] == "available"
    assert set(forecast) == {
        "status",
        "forecastHour",
        "weather",
        "conditionLevels",
        "level",
        "decidedBy",
        "loadRuleApplied",
    }
    assert set(forecast["weather"]) == {"wind", "rain", "snow"}
    for value in (data["forecastIssuedAt"], route["arrivalAt"], checkpoint["eta"]):
        assert re.match(ISO_Z, value)
    assert data["reasons"] and "kind" in data["reasons"][0]


@pytest.mark.parametrize(
    ("overrides", "field", "message"),
    [
        ({"destination": DALLAS}, "destination", "Destination must differ from the origin."),
        (
            {"departureAt": (timezone.now() - timedelta(days=1)).isoformat()},
            "departureAt",
            "Departure is in the past.",
        ),
        ({"intervalMiles": 30}, "intervalMiles", None),
        ({"loadWeightLb": 90_000}, "loadWeightLb", None),
    ],
)
def test_plan_validation_errors_use_the_contract_shape(overrides, field, message):
    response = plan(**overrides)

    assert response.status_code == 400
    data = response.json()
    assert data["code"] == "invalid" and field in data["fieldErrors"]
    if message:
        assert data["detail"] == message


@pytest.mark.parametrize(
    ("error", "status", "code"),
    [
        (ProviderError("HERE", "HTTP 500"), 502, "provider_error"),
        (ProviderTimeout("HERE", "timed out"), 503, "provider_timeout"),
        (ProviderBusy("HERE", "rate limited", status=429), 503, "provider_busy"),
    ],
)
def test_provider_failures_map_to_502_and_503(monkeypatch, error, status, code):
    class Failing:
        def routes(self, *args, **kwargs):
            raise error

    monkeypatch.setattr(providers, "router", Failing)
    response = plan()

    assert response.status_code == status
    assert response.json()["code"] == code
    assert "HERE" in response.json()["detail"]


def test_no_route_is_a_readable_400(monkeypatch):
    class Empty:
        def routes(self, *args, **kwargs):
            return []

    monkeypatch.setattr(providers, "router", Empty)
    response = plan()

    assert response.status_code == 400
    assert response.json()["code"] == "no_route"
