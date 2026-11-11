from datetime import UTC, datetime

import pytest

from apps.core.http import ProviderError
from apps.routing.clients import here
from apps.routing.clients.here import HereClient

# Encodes [(50.10228, 8.69821), (50.10201, 8.69567), (50.10063, 8.6915), (50.09878, 8.68752)].
POLYLINE = "BFoz5xJ67i1B1B7PzIhaxL7Y"


def section(spans):
    return {"polyline": POLYLINE, "summary": {"length": 1000, "duration": 60}, "spans": spans}


def test_routes_join_sections_and_shift_span_offsets(monkeypatch):
    payload = {
        "routes": [
            {
                "sections": [
                    section([{"offset": 0, "length": 400, "duration": 20}]),
                    section(
                        [
                            {"offset": 0, "length": 300, "duration": 25},
                            {"offset": 2, "length": 300, "duration": 15},
                        ]
                    ),
                ]
            }
        ]
    }
    seen = {}

    def fake_get_json(provider, url, params, *, timeout):
        seen.update(params)
        return payload

    monkeypatch.setattr(here, "get_json", fake_get_json)
    [route] = HereClient("key").routes(
        (-96.8, 32.78),
        (-104.99, 39.74),
        departure=datetime(2026, 11, 13, 12, tzinfo=UTC),
        gross_weight_lb=42_000,
    )

    # HERE wants lat,lng; the load goes in as gross weight, in kilograms.
    assert seen["origin"] == "32.78,-96.8" and seen["destination"] == "39.74,-104.99"
    assert seen["vehicle[grossWeight]"] == 19051
    assert seen["transportMode"] == "truck" and seen["alternatives"] == 2
    assert seen["departureTime"] == "2026-11-13T12:00:00Z"
    assert "via" not in seen
    # Points are (lng, lat); the second section drops its first (shared) point.
    assert route.points[0] == (8.69821, 50.10228)
    assert len(route.points) == 4 + 3
    assert route.span_offsets == (0, 3, 5)
    assert route.length_m == 1000 and route.duration_s == 60
    assert route.is_generated is False


def test_via_point_marks_the_route_generated(monkeypatch):
    seen = {}
    monkeypatch.setattr(
        here,
        "get_json",
        lambda p, u, params, timeout: (
            seen.update(params) or {"routes": [{"sections": [section([])]}]}
        ),
    )
    [route] = HereClient("key").routes(
        (0, 0),
        (1, 1),
        departure=datetime(2026, 1, 1, tzinfo=UTC),
        gross_weight_lb=1,
        via=(2.5, 3.5),
    )
    assert seen["via"] == "3.5,2.5!passThrough=true"
    assert route.is_generated is True
    # Without spans, the whole section is one span.
    assert route.span_lengths_m == (1000.0,)


def test_missing_key_is_a_provider_error():
    with pytest.raises(ProviderError):
        HereClient("").geocode("dallas", limit=1)
