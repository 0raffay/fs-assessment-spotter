"""One error shape for every failure: `{detail, code?, fieldErrors?}` (docs/api-contract.md).

`detail` is shown to people as-is, so it is always a plain sentence. Provider failures map to 502
(the provider failed) or 503 (it timed out).
"""

from __future__ import annotations

import logging
from typing import Any

from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from apps.core.http import ProviderBusy, ProviderError, ProviderTimeout

logger = logging.getLogger(__name__)


class DomainError(Exception):
    """A request we understood but can't serve (e.g. no road route). Maps to 400 by default."""

    status_code = status.HTTP_400_BAD_REQUEST
    code = "invalid_request"

    def __init__(self, detail: str, *, code: str | None = None) -> None:
        super().__init__(detail)
        self.detail = detail
        self.code = code or self.code


def _flatten(errors: Any, prefix: str = "") -> dict[str, list[str]]:
    """DRF's nested error dict → {"origin.coordinates": ["…"]}."""
    flat: dict[str, list[str]] = {}
    if isinstance(errors, dict):
        for key, value in errors.items():
            name = "detail" if key == "non_field_errors" else key
            flat.update(_flatten(value, f"{prefix}.{name}" if prefix else name))
    elif isinstance(errors, list):
        messages = [str(e) for e in errors if not isinstance(e, dict | list)]
        nested = [e for e in errors if isinstance(e, dict | list)]
        if messages:
            flat[prefix or "detail"] = messages
        for item in nested:
            flat.update(_flatten(item, prefix))
    else:
        flat[prefix or "detail"] = [str(errors)]
    return flat


def exception_handler(exc: Exception, context: dict[str, Any]) -> Response | None:
    if isinstance(exc, ProviderError):
        logger.warning("Provider failure: %s", exc)
    if isinstance(exc, ProviderBusy):
        return Response(
            {
                "detail": f"{exc.provider} is busy right now (free-tier limit). "
                "Please try again in a minute.",
                "code": "provider_busy",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    if isinstance(exc, ProviderTimeout):
        return Response(
            {
                "detail": f"{exc.provider} took too long to answer. Please try again.",
                "code": "provider_timeout",
            },
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    if isinstance(exc, ProviderError):
        return Response(
            {
                "detail": f"Could not get data from {exc.provider} right now. Please try again.",
                "code": "provider_error",
            },
            status=status.HTTP_502_BAD_GATEWAY,
        )
    if isinstance(exc, DomainError):
        return Response({"detail": exc.detail, "code": exc.code}, status=exc.status_code)
    if isinstance(exc, exceptions.ValidationError):
        field_errors = _flatten(exc.detail)
        first = next(iter(field_errors.values()), ["Check the request and try again."])[0]
        return Response(
            {"detail": first, "code": "invalid", "fieldErrors": field_errors},
            status=status.HTTP_400_BAD_REQUEST,
        )

    response = drf_exception_handler(exc, context)
    if response is not None:
        detail = response.data.get("detail") if isinstance(response.data, dict) else None
        code = getattr(detail, "code", None) or "error"
        response.data = {"detail": str(detail or "Request failed."), "code": str(code)}
    return response
