from django.apps import AppConfig


class WeatherConfig(AppConfig):
    """Open-Meteo forecasts (batched, cached), readings at ETAs, and the corridor heatmap."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.weather"
