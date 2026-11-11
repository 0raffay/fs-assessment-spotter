"""Settings for the pytest run."""

import os

os.environ.setdefault("DJANGO_SECRET_KEY", "test-secret-key")

from .base import *  # noqa: F403

DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
CACHES = {"default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}}
PASSWORD_HASHERS = ["django.contrib.auth.hashers.MD5PasswordHasher"]
# Serve static files from app dirs (no collectstatic needed in tests).
WHITENOISE_AUTOREFRESH = True
# Never call real providers from tests.
SKYRIG_PROVIDERS = "fake"
