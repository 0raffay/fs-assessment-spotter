from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("apps.core.api.urls")),
    path("api/", include("apps.routing.api.urls")),
    path("api/", include("apps.weather.api.urls")),
]
