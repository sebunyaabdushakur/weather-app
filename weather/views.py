import requests
from django.shortcuts import render
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .services import CityNotFoundError, get_weather_for_city


def home(request):
    return render(request, "weather/index.html")


@api_view(["GET"])
def weather_forecast(request):
    city = request.query_params.get("city", "").strip()

    if not city:
        return Response(
            {"detail": "Please provide a city name."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        weather = get_weather_for_city(city)
    except CityNotFoundError:
        return Response(
            {"detail": "We couldn't find that city."},
            status=status.HTTP_404_NOT_FOUND,
        )
    except requests.RequestException:
        return Response(
            {"detail": "The weather service is temporarily unavailable."},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    return Response(weather)
