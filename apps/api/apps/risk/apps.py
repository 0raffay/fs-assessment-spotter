from django.apps import AppConfig


class RiskConfig(AppConfig):
    """Weather risk rules and route ranking. Pure logic: no models, no HTTP."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.risk"
