from django.urls import path

from .views import GeocodeView, PlanRoutesView

app_name = "routing"

urlpatterns = [
    path("geocode/", GeocodeView.as_view(), name="geocode"),
    path("routes/plan/", PlanRoutesView.as_view(), name="plan"),
]
