import io
import uuid
from datetime import UTC, datetime, timedelta
from urllib.error import HTTPError

import pytest
from django.core.cache.backends.locmem import LocMemCache

from apps.core import http
from apps.core.http import ProviderBusy, ProviderError
from apps.weather.clients import open_meteo
from apps.weather.clients.open_meteo import OpenMeteoClient
from apps.weather.services.forecast import (
    BATCH_SIZE,
    ForecastService,
    forecast_horizon,
    nearest_hour,
    reading_at,
)
from apps.weather.tests.fakes import FakeForecastClient, make_series

START = datetime(2026, 11, 12, 13, tzinfo=UTC)


@pytest.fixture
def cache():
    return LocMemCache(f"weather-tests-{uuid.uuid4()}", {})


def test_client_parses_one_point_and_adds_showers_to_rain(monkeypatch):
    payload = {
        "hourly": {
            "time": ["2026-11-12T13:00", "2026-11-12T14:00"],
            "wind_speed_10m": [12.0, None],
            "wind_gusts_10m": [20.0, 22.0],
            "rain": [0.1, 0.0],
            "showers": [0.05, 0.2],
            "snowfall": [0.0, 0.4],
        }
    }
    seen = {}

    def fake_get_json(provider, url, params, *, timeout):
        seen.update(params)
        return payload

    monkeypatch.setattr(open_meteo, "get_json", fake_get_json)
    [series] = OpenMeteoClient().hourly([(-96.8, 32.78)], START, 1)

    assert seen["latitude"] == "32.7800" and seen["longitude"] == "-96.8000"
    assert seen["start_hour"] == "2026-11-12T13:00" and seen["end_hour"] == "2026-11-12T14:00"
    assert seen["wind_speed_unit"] == "mph" and seen["precipitation_unit"] == "inch"
    assert series.times == (START, START + timedelta(hours=1))
    assert series.wind_mph == (12.0, 0.0)  # null → 0
    assert series.rain_in_per_hr == (0.15, 0.2)
    assert series.snow_in_per_hr == (0.0, 0.4)


def test_client_rejects_a_location_count_mismatch(monkeypatch):
    monkeypatch.setattr(open_meteo, "get_json", lambda *a, **k: [{"hourly": {}}])
    with pytest.raises(ProviderError):
        OpenMeteoClient().hourly([(0, 0), (1, 1)], START, 1)


def test_service_batches_misses_and_caches_hits(cache):
    client = FakeForecastClient()
    service = ForecastService(client, cache)
    points = [(-100 + i * 0.1, 35.0) for i in range(BATCH_SIZE + 20)]

    first = service.series(points, START, 6)
    second = service.series(points[:10], START, 6)

    # Misses are fetched in two batches (in parallel, so in any order), then all are cache hits.
    assert sorted(client.calls) == [20, BATCH_SIZE]
    assert len(first) == len(points) and second == first[:10]


def test_service_floors_the_start_and_shares_nearby_points(cache):
    client = FakeForecastClient()
    service = ForecastService(client, cache)

    [a] = service.series([(-96.8001, 32.7801)], START + timedelta(minutes=40), 3)
    [b] = service.series([(-96.8004, 32.7799)], START, 3)

    assert a.start == START and a is not None and a == b
    assert client.calls == [1]


def test_reading_uses_the_nearest_hour_and_none_outside_the_series():
    series = make_series((0, 0), START, 3, lambda _p, h: (10.0 * h, 0.0, 0.0))

    assert reading_at(series, START + timedelta(minutes=29)).wind_mph == 0
    assert reading_at(series, START + timedelta(minutes=30)).wind_mph == 10
    assert reading_at(series, START + timedelta(hours=3)).wind_mph == 30
    assert reading_at(series, START + timedelta(hours=3, minutes=31)) is None
    assert reading_at(series, START - timedelta(hours=1)) is None


def test_nearest_hour_and_horizon():
    assert nearest_hour(START + timedelta(minutes=45)) == START + timedelta(hours=1)
    # 16 days from today's midnight UTC, last hour inclusive.
    assert forecast_horizon(START) == datetime(2026, 11, 27, 23, tzinfo=UTC)


def test_rate_limits_become_provider_busy(monkeypatch):
    body = b'{"error": true, "reason": "Minutely API request limit exceeded."}'

    def too_many(*args, **kwargs):
        raise HTTPError(
            "https://api.open-meteo.com", 429, "Too Many Requests", {}, io.BytesIO(body)
        )

    monkeypatch.setattr(http, "urlopen", too_many)
    with pytest.raises(ProviderBusy, match="Minutely API request limit"):
        OpenMeteoClient().hourly([(-96.8, 32.78)], START, 1)
