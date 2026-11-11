"""Request validation. Field names are camelCase, as in the API contract."""

from __future__ import annotations

from datetime import timedelta
from typing import Any

from django.utils import timezone
from rest_framework import serializers

from ..types import Place, TripRequest

MAX_LOAD_WEIGHT_LB = 80_000
INTERVALS = (10, 25, 50)
# A departure this far in the past is still accepted (the form defaults to "now").
PAST_GRACE = timedelta(minutes=15)


class GeocodeQuerySerializer(serializers.Serializer):
    q = serializers.CharField(min_length=2, max_length=100, trim_whitespace=True)


class PlaceSerializer(serializers.Serializer):
    id = serializers.CharField(min_length=1)
    name = serializers.CharField(min_length=1)
    region = serializers.CharField(allow_blank=True)
    coordinates = serializers.ListField(child=serializers.FloatField(), min_length=2, max_length=2)
    timeZone = serializers.CharField(min_length=1)

    def validate_coordinates(self, value: list[float]) -> list[float]:
        lng, lat = value
        if not (-180 <= lng <= 180 and -90 <= lat <= 90):
            raise serializers.ValidationError("Coordinates are out of range.")
        return value

    def to_place(self, data: dict[str, Any]) -> Place:
        lng, lat = data["coordinates"]
        return Place(
            id=data["id"],
            name=data["name"],
            region=data["region"],
            coordinates=(lng, lat),
            time_zone=data["timeZone"],
        )


class TripRequestSerializer(serializers.Serializer):
    origin = PlaceSerializer()
    destination = PlaceSerializer()
    departureAt = serializers.DateTimeField()
    loadWeightLb = serializers.IntegerField(min_value=1, max_value=MAX_LOAD_WEIGHT_LB)
    intervalMiles = serializers.ChoiceField(choices=INTERVALS)

    def validate_departureAt(self, value):
        if value < timezone.now() - PAST_GRACE:
            raise serializers.ValidationError("Departure is in the past.")
        return value

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        origin, destination = attrs["origin"], attrs["destination"]
        if origin["id"] == destination["id"] or origin["coordinates"] == destination["coordinates"]:
            raise serializers.ValidationError(
                {"destination": ["Destination must differ from the origin."]}
            )
        return attrs

    def to_request(self) -> TripRequest:
        data = self.validated_data
        place = PlaceSerializer()
        return TripRequest(
            origin=place.to_place(data["origin"]),
            destination=place.to_place(data["destination"]),
            departure_at=data["departureAt"],
            load_weight_lb=data["loadWeightLb"],
            interval_miles=int(data["intervalMiles"]),
        )
