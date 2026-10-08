from django.urls import path
from .views import home, weather_forecast

urlpatterns = [
    path("", home, name="home"),
    path("api/weather/", weather_forecast, name="weather-forecast"),
]
