from django.urls import path

from .views import HeatmapView

app_name = "weather"

urlpatterns = [
    path("weather/heatmap/", HeatmapView.as_view(), name="heatmap"),
]
