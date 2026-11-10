from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthView(APIView):
    """Liveness probe used by the frontend and the hosting platform."""

    def get(self, request: Request) -> Response:
        return Response({"status": "ok"})
