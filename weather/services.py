import requests


GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


class CityNotFoundError(Exception ):
    pass


def get_weather_for_city(city):
    location_response = requests.get(
        GEOCODING_URL,
        params={
            "name": city,
            "count": 1,
            "language": "en",
            "format": "json",
        },
        timeout=10,
    )
    location_response.raise_for_status()

    locations = location_response.json().get("results", [])

    if not locations:
        raise CityNotFoundError

    location = locations[0]

    forecast_response = requests.get(
        FORECAST_URL,
        params={
            "latitude": location["latitude"],
            "longitude": location["longitude"],
            "current": (
                "temperature_2m,relative_humidity_2m,"
                "apparent_temperature,weather_code,wind_speed_10m"
            ),
            "hourly": (
                "temperature_2m,precipitation_probability,weather_code"
            ),
            "daily": (
                "weather_code,temperature_2m_max,temperature_2m_min,"
                "precipitation_probability_max"
            ),
            "timezone": "auto",
            "forecast_days": 7,
        },
        timeout=10,
    )
    forecast_response.raise_for_status()

    forecast = forecast_response.json()

    return {
        "location": {
            "name": location["name"],
            "country": location.get("country", ""),
            "latitude": location["latitude"],
            "longitude": location["longitude"],
        },
        "timezone": forecast.get("timezone"),
        "current": forecast.get("current", {}),
        "hourly": forecast.get("hourly", {}),
        "daily": forecast.get("daily", {}),
    }
