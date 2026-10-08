const searchForm = document.getElementById("search-form");
const cityInput = document.getElementById("city");
const statusMessage = document.getElementById("status");

const weatherDescriptions = [
    { codes: [0], label: "Clear sky", icon: "icon-sun", style: "sunny" },
    { codes: [1, 2], label: "Partly cloudy", icon: "icon-cloud-sun", style: "partly-cloudy" },
    { codes: [3], label: "Overcast", icon: "icon-cloud", style: "cloudy" },
    { codes: [45, 48], label: "Foggy", icon: "icon-cloud", style: "cloudy" },
    { codes: [51, 53, 55, 56, 57], label: "Drizzle", icon: "icon-cloud-rain", style: "rainy" },
    { codes: [61, 63, 65, 66, 67], label: "Rain", icon: "icon-cloud-rain", style: "rainy" },
    { codes: [71, 73, 75, 77], label: "Snow", icon: "icon-cloud", style: "cloudy" },
    { codes: [80, 81, 82], label: "Rain showers", icon: "icon-cloud-rain", style: "rainy" },
    { codes: [85, 86], label: "Snow showers", icon: "icon-cloud", style: "cloudy" },
    { codes: [95, 96, 99], label: "Thunderstorm", icon: "icon-cloud-rain", style: "rainy" }
];

function getWeatherDescription(code) {
    return weatherDescriptions.find(item => item.codes.includes(code)) || {
        label: "Weather conditions",
        icon: "icon-cloud",
        style: "cloudy"
    };
}

function makeWeatherIcon(symbolId, extraClass = "") {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg" );
    svg.setAttribute("class", `forecast-icon ${extraClass}`.trim());

    const use = document.createElementNS("http://www.w3.org/2000/svg", "use" );
    use.setAttribute("href", `#${symbolId}`);

    svg.appendChild(use);
    return svg;
}

function showHourlyForecast(hourly, currentTime) {
    const container = document.getElementById("hourly-details");
    container.replaceChildren();

    const times = hourly.time || [];
    let startIndex = times.findIndex(time => time >= currentTime);

    if (startIndex < 0) {
        startIndex = 0;
    }

    const endIndex = Math.min(startIndex + 6, times.length);

    for (let index = startIndex; index < endIndex; index += 1) {
        const item = document.createElement("article");
        item.className = "hour-item";

        const time = document.createElement("span");
        time.className = "hour-time";
        time.textContent = index === startIndex
            ? "Now"
            : times[index].slice(11, 16);

        const description = getWeatherDescription(hourly.weather_code[index]);
        const icon = makeWeatherIcon(description.icon, description.style);

        const temperature = document.createElement("strong");
        temperature.textContent = `${Math.round(hourly.temperature_2m[index])}°`;

        const rain = document.createElement("span");
        rain.className = "hour-rain";
        rain.textContent = `${hourly.precipitation_probability[index] ?? 0}%`;

        item.append(time, icon, temperature, rain);
        container.appendChild(item);
    }
}

function showDailyForecast(daily) {
    const container = document.getElementById("daily-details");
    container.replaceChildren();

    (daily.time || []).forEach((date, index) => {
        const row = document.createElement("article");
        row.className = "day-row";

        const dayName = document.createElement("span");
        dayName.className = "day-name";

        if (index === 0) {
            dayName.textContent = "Today";
        } else if (index === 1) {
            dayName.textContent = "Tomorrow";
        } else {
            dayName.textContent = new Intl.DateTimeFormat(undefined, {
                weekday: "long"
            }).format(new Date(`${date}T12:00:00`));
        }

        const description = getWeatherDescription(daily.weather_code[index]);
        const icon = makeWeatherIcon(description.icon, description.style);

        const condition = document.createElement("span");
        condition.className = "day-condition";
        condition.textContent = description.label;

        const rain = document.createElement("span");
        rain.className = "day-rain";
        rain.textContent = `${daily.precipitation_probability_max[index] ?? 0}%`;

        const range = document.createElement("span");
        range.className = "temperature-range";

        const low = document.createElement("span");
        low.textContent = `${Math.round(daily.temperature_2m_min[index])}°`;

        const high = document.createElement("strong");
        high.textContent = `${Math.round(daily.temperature_2m_max[index])}°`;

        range.append(low, high);
        row.append(dayName, icon, condition, rain, range);
        container.appendChild(row);
    });
}

function displayWeather(data) {
    const current = data.current;
    const today = data.daily;
    const description = getWeatherDescription(current.weather_code);

    document.getElementById("city-name").textContent =
        `${data.location.name}, ${data.location.country}`;

    document.getElementById("current-date").textContent =
        new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric"
        }).format(new Date(current.time));

    document.getElementById("temperature").textContent =
        `${Math.round(current.temperature_2m)}°`;

    document.getElementById("condition").textContent = description.label;

    document.querySelector(".condition-block use")
        .setAttribute("href", `#${description.icon}`);

    document.getElementById("high-low").textContent =
        `H: ${Math.round(today.temperature_2m_max[0])}° · L: ${Math.round(today.temperature_2m_min[0])}°`;

    document.getElementById("feels-like").textContent =
        `${Math.round(current.apparent_temperature)}°`;

    document.getElementById("humidity").textContent =
        `${current.relative_humidity_2m}%`;

    document.getElementById("wind").innerHTML =
        `${Math.round(current.wind_speed_10m)} <small>km/h</small>`;

    const firstHourIndex = Math.max(
        0,
        (data.hourly.time || []).findIndex(time => time >= current.time)
    );

    document.getElementById("precipitation").textContent =
        `${data.hourly.precipitation_probability[firstHourIndex] ?? 0}%`;

    document.getElementById("uv-index").textContent = "Not available";
    document.querySelector(".sun-icon + .metric-heading span:last-child");

    showHourlyForecast(data.hourly, current.time);
    showDailyForecast(data.daily);
}

async function loadWeather(city) {
    statusMessage.textContent = `Looking up weather for ${city}…`;

    try {
        const url = `/api/weather/?city=${encodeURIComponent(city)}`;
        const response = await fetch(url);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || "Could not load weather.");
        }

        displayWeather(data);
        statusMessage.textContent =
            `Live forecast for ${data.location.name}. Weather data by Open-Meteo.`;
    } catch (error) {
        statusMessage.textContent = error.message;
    }
}

searchForm.addEventListener("submit", event => {
    event.preventDefault();

    const city = cityInput.value.trim();

    if (!city) {
        statusMessage.textContent = "Please type a city name first.";
        return;
    }

    loadWeather(city);
});

loadWeather(cityInput.value.trim() || "Nairobi");
