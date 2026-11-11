"""`GET /api/weather/heatmap/` — the corridor risk grid for hours 0-48."""

from __future__ import annotations

from typing import Any

from django.core.cache import cache
from django.utils import timezone
from rest_framework import serializers
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core import providers
from apps.core.api.exceptions import DomainError
from apps.risk.services.rules import load_band
from apps.routing.api.presenters import iso

from ..services.forecast import CACHE_SECONDS, floor_to_hour
from ..services.heatmap import (
    MAX_HOURS,
    Heatmap,
    HeatmapTooLarge,
    build_heatmap,
    corridor_for,
)


class HeatmapQuerySerializer(serializers.Serializer):
    west = serializers.FloatField(min_value=-180, max_value=180)
    south = serializers.FloatField(min_value=-90, max_value=90)
    east = serializers.FloatField(min_value=-180, max_value=180)
    north = serializers.FloatField(min_value=-90, max_value=90)
    hours = serializers.IntegerField(min_value=1, max_value=MAX_HOURS, default=MAX_HOURS)
    loadWeightLb = serializers.IntegerField(min_value=1, max_value=80_000)
    # Optional: the plan this heatmap is for, so only the cells along its routes are fetched.
    planId = serializers.CharField(required=False, max_length=64)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if attrs["west"] >= attrs["east"] or attrs["south"] >= attrs["north"]:
            raise serializers.ValidationError("The area must have west < east and south < north.")
        return attrs


def heatmap_json(heatmap: Heatmap) -> dict[str, Any]:
    return {
        "bbox": list(heatmap.bbox),
        "cellSizeDegrees": heatmap.cell_size_degrees,
        "startsAt": iso(heatmap.starts_at),
        "hours": heatmap.hours,
        "cells": [
            {"id": cell.id, "bounds": list(cell.bounds), "levels": cell.levels}
            for cell in heatmap.cells
        ],
        "worstByHour": heatmap.worst_by_hour,
    }


class HeatmapView(APIView):
    def get(self, request: Request) -> Response:
        query = HeatmapQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        data = query.validated_data
        now = timezone.now()
        bbox = (data["west"], data["south"], data["east"], data["north"])
        # Only the plan's corridor when we know it (else the whole area, as the contract allows).
        corridor = corridor_for(data["planId"]) if data.get("planId") else None
        area = data["planId"] if corridor is not None else "all"
        # The finished grid is shared by every load in the same load-rule band, for this hour.
        key = (
            f"heatmap:{providers.mode()}:{','.join(f'{v:g}' for v in bbox)}:{data['hours']}:"
            f"{load_band(data['loadWeightLb'])}:{floor_to_hour(now):%Y%m%d%H}:{area}"
        )
        body = cache.get(key)
        if body is None:
            try:
                heatmap = build_heatmap(
                    providers.forecasts(),
                    bbox,
                    hours=data["hours"],
                    load_weight_lb=data["loadWeightLb"],
                    now=now,
                    only=corridor,
                )
            except HeatmapTooLarge as error:
                raise DomainError(
                    "That area is too large for the heatmap.", code="area_too_large"
                ) from error
            body = heatmap_json(heatmap)
            cache.set(key, body, CACHE_SECONDS)
        return Response(body)
