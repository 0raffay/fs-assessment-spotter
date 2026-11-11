"""Which external providers to use: live (HERE, Open-Meteo) or offline fakes.

Set SKYRIG_PROVIDERS=fake for development without keys and for end-to-end tests. Views get their
providers from here, so tests can swap them with `override_settings` or by patching these.
"""

from __future__ import annotations

from django.conf import settings

from apps.routing.clients.fake import FakeRouter
from apps.routing.clients.here import HereClient
from apps.weather.clients.fake import FakeForecastClient
from apps.weather.clients.open_meteo import OpenMeteoClient
from apps.weather.services.forecast import ForecastService


def mode() -> str:
    return "fake" if using_fakes() else "live"


def using_fakes() -> bool:
    return settings.SKYRIG_PROVIDERS == "fake"


def router() -> HereClient | FakeRouter:
    return FakeRouter() if using_fakes() else HereClient(settings.HERE_API_KEY)


def geocoder() -> HereClient | FakeRouter:
    return router()


def forecasts() -> ForecastService:
    return ForecastService(FakeForecastClient() if using_fakes() else OpenMeteoClient())
