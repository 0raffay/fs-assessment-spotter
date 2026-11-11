from django.apps import AppConfig


class RoutingConfig(AppConfig):
    """Location search, truck routes, checkpoints with ETAs, and the trip plan endpoint."""

    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.routing"
