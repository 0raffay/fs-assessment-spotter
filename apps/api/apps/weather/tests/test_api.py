from datetime import timedelta

import pytest
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient


@pytest.fixture(autouse=True)
def fake_providers():
    cache.clear()
    with override_settings(SKYRIG_PROVIDERS="fake"):
        yield


def heatmap(**params):
    query = {"west": -106, "south": 31.5, "east": -95.5, "north": 41, "loadWeightLb": 42_000}
    return APIClient().get(reverse("weather:heatmap"), {**query, **params})


def test_heatmap_matches_the_contract():
    response = heatmap(hours=12)

    assert response.status_code == 200
    data = response.json()
    assert set(data) == {"bbox", "cellSizeDegrees", "startsAt", "hours", "cells", "worstByHour"}
    assert data["hours"] == 12 and data["cellSizeDegrees"] == 0.5
    assert len(data["worstByHour"]) == 13
    assert len(data["cells"]) == 21 * 19
    cell = data["cells"][0]
    assert cell["bounds"] == [-106.0, 31.5, -105.5, 32.0]
    assert set(cell["levels"]) == {"risk", "wind", "rain", "snow"}
    assert all(len(values) == 13 for values in cell["levels"].values())


def test_heatmap_defaults_to_48_hours():
    assert heatmap().json()["hours"] == 48


@pytest.mark.parametrize(
    ("params", "code"),
    [
        ({"west": -90}, "invalid"),  # west > east
        ({"hours": 49}, "invalid"),
        ({"loadWeightLb": 0}, "invalid"),
        ({"west": -130, "south": 10, "east": -60, "north": 60}, "area_too_large"),
    ],
)
def test_heatmap_rejects_bad_areas(params, code):
    response = heatmap(**params)

    assert response.status_code == 400
    assert response.json()["code"] == code


def test_heatmap_for_a_plan_fetches_only_its_corridor():
    place = {"region": "TX", "timeZone": "America/Chicago"}
    body = {
        "origin": {**place, "id": "a", "name": "Dallas", "coordinates": [-96.807, 32.783]},
        "destination": {**place, "id": "b", "name": "Amarillo", "coordinates": [-101.83, 35.22]},
        "departureAt": (timezone.now() + timedelta(hours=2)).isoformat(),
        "loadWeightLb": 42_000,
        "intervalMiles": 50,
    }
    plan = APIClient().post(reverse("routing:plan"), body, format="json").json()
    west, south, east, north = plan["bbox"]
    area = {"west": west, "south": south, "east": east, "north": north}

    everything = heatmap(**area, hours=2).json()["cells"]
    corridor = heatmap(**area, hours=2, planId=plan["id"]).json()["cells"]
    unknown_plan = heatmap(**area, hours=2, planId="plan-unknown").json()["cells"]

    assert 0 < len(corridor) < len(everything)
    assert len(unknown_plan) == len(everything)  # falls back to the whole area
