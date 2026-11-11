"""HTTP layer for routing: validate, call one service, present. No business rules here."""

from __future__ import annotations

from django.utils import timezone
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core import providers
from apps.core.api.exceptions import DomainError
from apps.weather.services.heatmap import corridor_cells, remember_corridor

from ..services.geocode import search_places
from ..services.planner import NoRouteFound, plan_trip
from .presenters import place_json, plan_json
from .serializers import GeocodeQuerySerializer, TripRequestSerializer


class GeocodeView(APIView):
    """`GET /api/geocode/?q=` — places for the origin and destination fields."""

    def get(self, request: Request) -> Response:
        query = GeocodeQuerySerializer(data=request.query_params)
        query.is_valid(raise_exception=True)
        places = search_places(query.validated_data["q"], providers.geocoder())
        return Response({"results": [place_json(place) for place in places]})


class PlanRoutesView(APIView):
    """`POST /api/routes/plan/` — three routes scored for weather risk, best first."""

    def post(self, request: Request) -> Response:
        body = TripRequestSerializer(data=request.data)
        body.is_valid(raise_exception=True)
        try:
            plan = plan_trip(
                body.to_request(),
                router=providers.router(),
                forecasts=providers.forecasts(),
                now=timezone.now(),
            )
        except NoRouteFound as error:
            raise DomainError(
                "No truck route connects these places. Try a different origin or destination.",
                code="no_route",
            ) from error
        # The heatmap request for this plan fetches only the cells along its routes.
        remember_corridor(plan.id, corridor_cells(route.geometry for route in plan.routes))
        return Response(plan_json(plan))
