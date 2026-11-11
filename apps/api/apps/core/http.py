"""A tiny JSON-over-HTTP helper for provider clients (stdlib only, so no extra dependency)."""

from __future__ import annotations

import json
import socket
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen

USER_AGENT = "SkyRig/0.1 (weather-aware truck routing)"


class ProviderError(Exception):
    """An external provider failed or answered with an error (the API maps this to 502)."""

    def __init__(self, provider: str, message: str, *, status: int | None = None) -> None:
        super().__init__(f"{provider}: {message}")
        self.provider = provider
        self.status = status


class ProviderTimeout(ProviderError):
    """An external provider took too long (the API maps this to 503)."""


class ProviderBusy(ProviderError):
    """The provider's rate limit was hit, e.g. Open-Meteo's free tier (the API maps this to 503)."""


def _error_reason(error: HTTPError) -> str:
    """The provider's own explanation, if its error body says one (for logs, never for users)."""
    try:
        body = json.loads(error.read().decode("utf-8") or "{}")
    except (ValueError, OSError):
        return ""
    if isinstance(body, dict):
        return str(body.get("reason") or body.get("title") or body.get("error_description") or "")
    return ""


def get_json(provider: str, url: str, params: dict[str, Any], *, timeout: float) -> Any:
    """GET `url?params` and decode JSON, turning network trouble into Provider* errors."""
    request = Request(
        f"{url}?{urlencode(params, safe=',:')}",
        headers={"Accept": "application/json", "User-Agent": USER_AGENT},
    )
    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        reason = _error_reason(error)
        if error.code == 429:
            raise ProviderBusy(provider, reason or "rate limited", status=429) from error
        raise ProviderError(
            provider, f"HTTP {error.code} {reason}".strip(), status=error.code
        ) from error
    except TimeoutError as error:
        raise ProviderTimeout(provider, "timed out") from error
    except URLError as error:
        if isinstance(error.reason, TimeoutError | socket.timeout):
            raise ProviderTimeout(provider, "timed out") from error
        raise ProviderError(provider, f"unreachable ({error.reason})") from error
    except json.JSONDecodeError as error:
        raise ProviderError(provider, "returned invalid JSON") from error
