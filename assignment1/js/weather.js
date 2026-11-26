/* ============================================================
 *  weather.js  —  Open-Meteo Forecast API
 *  Owner: Student 1 (Destination & Weather)
 * ============================================================
 *  REST resource:
 *    GET https://api.open-meteo.com/v1/forecast
 *        ?latitude=41.01&longitude=28.95
 *        &daily=weather_code,temperature_2m_max,temperature_2m_min,
 *               precipitation_probability_max,wind_speed_10m_max
 *        &timezone=auto&forecast_days=16
 *  Representation: JSON (no API key needed)
 * ============================================================ */

// WMO weather codes -> text + icon
const WEATHER_CODES = {
  0: ["Clear sky", "☀️"],
  1: ["Mainly clear", "🌤️"],
  2: ["Partly cloudy", "⛅"],
  3: ["Overcast", "☁️"],
  45: ["Fog", "🌫️"],
  48: ["Rime fog", "🌫️"],
  51: ["Light drizzle", "🌦️"],
  53: ["Drizzle", "🌦️"],
  55: ["Dense drizzle", "🌧️"],
  56: ["Freezing drizzle", "🌧️"],
  57: ["Freezing drizzle", "🌧️"],
  61: ["Light rain", "🌦️"],
  63: ["Rain", "🌧️"],
  65: ["Heavy rain", "🌧️"],
  66: ["Freezing rain", "🌧️"],
  67: ["Freezing rain", "🌧️"],
  71: ["Light snow", "🌨️"],
  73: ["Snow", "🌨️"],
  75: ["Heavy snow", "❄️"],
  77: ["Snow grains", "🌨️"],
  80: ["Rain showers", "🌦️"],
  81: ["Rain showers", "🌧️"],
  82: ["Violent showers", "⛈️"],
  85: ["Snow showers", "🌨️"],
  86: ["Heavy snow showers", "❄️"],
  95: ["Thunderstorm", "⛈️"],
  96: ["Thunderstorm with hail", "⛈️"],
  99: ["Thunderstorm with hail", "⛈️"]
};

function describeWeatherCode(code) {
  const [condition, icon] = WEATHER_CODES[code] || ["Unknown", "❔"];
  return { condition, icon };
}

/* Returns "YYYY-MM-DD" for today + n days (local time). */
function addDaysISO(n, from = new Date()) {
  const d = new Date(from.getFullYear(), from.getMonth(), from.getDate() + n);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/* Allowed travel-date range for the date input (today .. today+15). */
function getForecastDateRange() {
  return { min: addDaysISO(0), max: addDaysISO(CONFIG.MAX_FORECAST_DAYS - 1) };
}

/**
 * Fetch the daily forecast (16 days) for a location.
 * @returns {Promise<Array<{date,min,max,rainProbability,windSpeed,weatherCode,condition,icon}>>}
 */
async function fetchDailyForecast(latitude, longitude) {
  const url = new URL(CONFIG.FORECAST_BASE);
  url.search = new URLSearchParams({
    latitude,
    longitude,
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max",
    timezone: "auto",
    forecast_days: CONFIG.MAX_FORECAST_DAYS
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Weather service error (HTTP ${response.status})`);
  }
  const data = await response.json();
  const d = data.daily;
  if (!d || !Array.isArray(d.time)) {
    throw new Error("Weather service returned an unexpected response");
  }

  return d.time.map((date, i) => {
    const code = d.weather_code[i];
    const { condition, icon } = describeWeatherCode(code);
    return {
      date,
      min: d.temperature_2m_min[i] == null ? null : Math.round(d.temperature_2m_min[i]),
      max: d.temperature_2m_max[i] == null ? null : Math.round(d.temperature_2m_max[i]),
      rainProbability: d.precipitation_probability_max[i],
      windSpeed: d.wind_speed_10m_max[i] == null ? null : Math.round(d.wind_speed_10m_max[i]),
      weatherCode: code,
      condition,
      icon
    };
  });
}

/* Simple rule: good for outdoor activities? (used by Student 3) */
function isOutdoorFriendly(day) {
  if (!day || day.max == null) return false;
  const badCodes = day.weatherCode >= 51; // drizzle, rain, snow, storms
  const rainy = (day.rainProbability ?? 0) >= 50;
  const tooCold = day.max < 5;
  const tooHot = day.max > 38;
  return !badCodes && !rainy && !tooCold && !tooHot;
}

/**
 * Weather for a specific travel date.
 * @returns {Promise<{weather: object|null, forecast: Array, forecastAvailable: boolean}>}
 */
async function getWeatherForDate(latitude, longitude, travelDate) {
  const forecast = await fetchDailyForecast(latitude, longitude);
  const day = forecast.find(f => f.date === travelDate);

  // Date outside the 16-day window, or the last day with missing values
  if (!day || day.max == null) {
    return { weather: null, forecast, forecastAvailable: false };
  }

  return {
    forecast,
    forecastAvailable: true,
    weather: {
      temperature: day.max,
      rainProbability: day.rainProbability,
      condition: day.condition,
      minTemperature: day.min,
      maxTemperature: day.max,
      windSpeed: day.windSpeed,
      weatherCode: day.weatherCode,
      icon: day.icon,
      isOutdoorFriendly: isOutdoorFriendly(day)
    }
  };
}

/* ---------------- UI ---------------- */

/** Render the weather card + forecast strip into a container element. */
function renderWeather(data, container) {
  if (!container) return;

  if (!data.forecastAvailable) {
    container.innerHTML = `
      <div class="dw-card dw-warning">
        <h3>Weather</h3>
        <p>No forecast is available for <b>${data.travelDate}</b>.
        Open-Meteo forecasts only the next ${CONFIG.MAX_FORECAST_DAYS} days.</p>
      </div>`;
    return;
  }

  const w = data.weather;
  const strip = data.forecast
    .filter(f => f.max != null)
    .map(f => `
      <div class="dw-day ${f.date === data.travelDate ? "dw-day-selected" : ""}" title="${f.condition}">
        <span class="dw-day-date">${formatShortDate(f.date)}</span>
        <span class="dw-day-icon">${f.icon}</span>
        <span class="dw-day-temp">${f.max}° / ${f.min}°</span>
        <span class="dw-day-rain">💧 ${f.rainProbability ?? "-"}%</span>
      </div>`)
    .join("");

  container.innerHTML = `
    <div class="dw-card">
      <h3>Weather on ${formatLongDate(data.travelDate)}</h3>
      <div class="dw-weather-main">
        <span class="dw-weather-icon">${w.icon}</span>
        <div>
          <div class="dw-weather-temp">${w.maxTemperature}°C <small>/ ${w.minTemperature}°C</small></div>
          <div class="dw-weather-cond">${w.condition}</div>
        </div>
      </div>
      <ul class="dw-facts">
        <li>💧 Rain probability: <b>${w.rainProbability ?? "-"}%</b></li>
        <li>💨 Max wind: <b>${w.windSpeed ?? "-"} km/h</b></li>
        <li>${w.isOutdoorFriendly ? "✅ Good day for outdoor activities" : "☔ Better plan indoor activities"}</li>
      </ul>
      <h4>Next ${CONFIG.MAX_FORECAST_DAYS} days</h4>
      <div class="dw-strip">${strip}</div>
    </div>`;
}

function formatShortDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

function formatLongDate(iso) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
}
