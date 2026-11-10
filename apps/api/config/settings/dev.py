"""Local development settings. Works with no `.env` file."""

import os

os.environ.setdefault("DJANGO_SECRET_KEY", "dev-insecure-secret-key-change-me")
os.environ.setdefault("DJANGO_DEBUG", "true")

from .base import *  # noqa: F403
from .base import REST_FRAMEWORK, env

ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=["localhost", "127.0.0.1"])
CORS_ALLOWED_ORIGINS = env.list("CORS_ALLOWED_ORIGINS", default=["http://localhost:5173"])

# Browsable API is handy while developing.
REST_FRAMEWORK = {
    **REST_FRAMEWORK,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}
