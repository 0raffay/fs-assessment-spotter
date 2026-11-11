"""Decoder for HERE's Flexible Polyline format (the `polyline` field of HERE Routing v8).

Spec: https://github.com/heremaps/flexible-polyline. Values are zigzag-encoded varints in a
URL-safe base64 alphabet: a version, a header (precision and optional third dimension), then
deltas of lat, lng (and the third dimension, which we skip).
"""

from __future__ import annotations

from collections.abc import Iterator

_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
_DECODE = {char: index for index, char in enumerate(_ALPHABET)}
FORMAT_VERSION = 1


def _unsigned_varints(encoded: str) -> Iterator[int]:
    value = shift = 0
    for char in encoded:
        try:
            chunk = _DECODE[char]
        except KeyError as error:
            raise ValueError(f"invalid polyline character {char!r}") from error
        value |= (chunk & 0x1F) << shift
        if chunk & 0x20:
            shift += 5
            continue
        yield value
        value = shift = 0
    if shift:
        raise ValueError("polyline ends in the middle of a value")


def _signed(value: int) -> int:
    return ~(value >> 1) if value & 1 else value >> 1


def decode(encoded: str) -> list[tuple[float, float]]:
    """Points as (lat, lng), in the order HERE returns them."""
    values = _unsigned_varints(encoded)
    if next(values, None) != FORMAT_VERSION:
        raise ValueError("unsupported polyline version")
    header = next(values)
    precision = header & 0x0F
    has_third_dimension = (header >> 4) & 0x07 != 0
    factor = 10**precision

    points: list[tuple[float, float]] = []
    lat = lng = 0
    for lat_delta in values:
        lat += _signed(lat_delta)
        lng += _signed(next(values))
        if has_third_dimension:
            next(values)
        points.append((lat / factor, lng / factor))
    return points
