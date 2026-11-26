/* ============================================================
 *  destination.js  —  City search + country information
 *  Owner: Student 1 (Destination & Weather)
 * ============================================================
 *  APIs:
 *   1) Open-Meteo Geocoding  (no key)
 *      GET https://geocoding-api.open-meteo.com/v1/search?name=Istanbul&count=5&language=en
 *   2) REST Countries v5     (free key, see config.js)
 *      GET https://api.restcountries.com/countries/v5/codes.alpha_2/TR
 *          Header: Authorization: Bearer <API_KEY>
 *
 *  MAIN FUNCTION FOR THE TEAM:
 *      const data = await getDestinationData("Istanbul", "2026-11-28");
 *  Returns the object described in mockData.js (the data contract).
 *  Depends on: config.js, weather.js  (load them before this file)
 * ============================================================ */

/* Last result, so other parts can read it without calling the APIs again */
let currentDestination = null;

/**
 * Search cities by name (Open-Meteo Geocoding).
 * @returns {Promise<Array<{name, country, countryCode, region, latitude, longitude, timezone, population, label}>>}
 */
async function searchCities(name, count = 5) {
  const query = (name || "").trim();
  if (query.length < 2) return [];

  const url = new URL(CONFIG.GEOCODING_BASE);
  url.search = new URLSearchParams({ name: query, count, language: "en", format: "json" });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`City search failed (HTTP ${response.status})`);
  }
  const data = await response.json();
  // Open-Meteo returns no "results" key when nothing matches
  return (data.results || []).map(r => ({
    name: r.name,
    country: r.country,
    countryCode: r.country_code,
    region: r.admin1 || "",
    latitude: r.latitude,
    longitude: r.longitude,
    timezone: r.timezone,
    population: r.population || 0,
    label: [r.name, r.admin1, r.country].filter(Boolean).join(", ")
  }));
}

/**
 * Country details from REST Countries v5.
 * @returns {Promise<object>} normalized country info
 */
async function getCountryInfo(countryCode) {
  if (!CONFIG.REST_COUNTRIES_API_KEY) {
    throw new Error("REST Countries API key is missing (see js/config.js)");
  }

  const fields = "names,codes,capitals,currencies,languages,flag,population,region,subregion,continents";
  const url = `${CONFIG.REST_COUNTRIES_BASE}/codes.alpha_2/${encodeURIComponent(countryCode)}?response_fields=${fields}`;

  // Key sent as a query parameter (api-key=...) so the browser makes a
  // simple GET without a CORS preflight. In Postman we use the
  // "Authorization: Bearer" header instead — both are accepted.
  const response = await fetch(`${url}&api-key=${encodeURIComponent(CONFIG.REST_COUNTRIES_API_KEY)}`);
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const reason = body?.errors?.[0]?.message || `HTTP ${response.status}`;
    throw new Error(`Country service error: ${reason}`);
  }

  const c = body?.data?.objects?.[0];
  if (!c) throw new Error("Country not found");

  // Demo keys return a sample country (Canada), not the requested one
  if (body.data._demo || c.codes?.alpha_2 !== countryCode.toUpperCase()) {
    throw new Error("REST Countries returned demo data; use a real API key");
  }

  const currency = (c.currencies || [])[0] || {};
  return {
    country: c.names?.common,
    officialName: c.names?.official,
    capital: c.capitals?.[0]?.name || "",
    currency: currency.code || "",
    currencyName: currency.name || "",
    currencySymbol: currency.symbol || "",
    languages: (c.languages || []).map(l => l.name),
    population: c.population || 0,
    continent: c.continents?.[0] || c.region || "",
    flagUrl: c.flag?.url_png || "",
    flagEmoji: c.flag?.emoji || flagEmojiFromCode(countryCode)
  };
}

/* ---------- Fallback (used only if REST Countries is unavailable) ---------- */

function flagEmojiFromCode(code) {
  return code
    .toUpperCase()
    .replace(/./g, ch => String.fromCodePoint(127397 + ch.charCodeAt(0)));
}

// Common travel destinations -> currency code (fallback only)
const FALLBACK_CURRENCIES = {
  TR: "TRY", FR: "EUR", DE: "EUR", IT: "EUR", ES: "EUR", NL: "EUR", GR: "EUR", PT: "EUR",
  AT: "EUR", BE: "EUR", IE: "EUR", FI: "EUR", GB: "GBP", CH: "CHF", SE: "SEK", NO: "NOK",
  DK: "DKK", PL: "PLN", CZ: "CZK", HU: "HUF", RO: "RON", US: "USD", CA: "CAD", MX: "MXN",
  BR: "BRL", AR: "ARS", JP: "JPY", CN: "CNY", KR: "KRW", IN: "INR", TH: "THB", MY: "MYR",
  SG: "SGD", ID: "IDR", PH: "PHP", AU: "AUD", NZ: "NZD", AE: "AED", SA: "SAR", QA: "QAR",
  JO: "JOD", EG: "EGP", MA: "MAD", TN: "TND", PS: "ILS", IL: "ILS", LB: "LBP", ZA: "ZAR",
  RU: "RUB", GE: "GEL", AZ: "AZN", HK: "HKD"
};

function fallbackCountryInfo(city) {
  return {
    country: city.country,
    officialName: city.country,
    capital: "",
    currency: FALLBACK_CURRENCIES[city.countryCode] || "",
    currencyName: "",
    currencySymbol: "",
    languages: [],
    population: 0,
    continent: (city.timezone || "").split("/")[0],
    // Free flag CDN (no key needed). Windows can't show flag emojis.
    flagUrl: `https://flags.restcountries.com/v5/w640/${city.countryCode.toLowerCase()}.png`,
    flagEmoji: flagEmojiFromCode(city.countryCode)
  };
}

/* ---------- Main function (data contract) ---------- */

/**
 * Collect everything about the destination for a travel date.
 * @param {string|object} city  city name ("Istanbul") or an object returned by searchCities()
 * @param {string} travelDate   "YYYY-MM-DD"
 * @returns {Promise<object>}   see mockData.js for the exact shape
 * @throws  Error with a user-friendly message (city not found, invalid date, service down)
 */
async function getDestinationData(city, travelDate) {
  if (CONFIG.USE_MOCK_DATA) {
    currentDestination = { ...mockDestinationData };
    return currentDestination;
  }

  // 1) Validate input
  if (!city || (typeof city === "string" && city.trim().length < 2)) {
    throw new Error("Please enter a destination city.");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(travelDate || "")) {
    throw new Error("Please choose a valid travel date.");
  }
  const { min } = getForecastDateRange();
  if (travelDate < min) {
    throw new Error("The travel date cannot be in the past.");
  }

  // 2) City -> coordinates + country code (Open-Meteo Geocoding)
  let place = city;
  if (typeof city === "string") {
    const results = await searchCities(city, 1);
    if (results.length === 0) {
      throw new Error(`City "${city}" was not found. Check the spelling and try again.`);
    }
    place = results[0];
  }

  // 3) Country info (REST Countries) and weather (Open-Meteo) in parallel
  const [countryResult, weatherResult] = await Promise.allSettled([
    getCountryInfo(place.countryCode),
    getWeatherForDate(place.latitude, place.longitude, travelDate)
  ]);

  let countryInfo;
  let countrySource = "restcountries";
  let countryError = null;
  if (countryResult.status === "fulfilled") {
    countryInfo = countryResult.value;
  } else {
    console.warn("[destination] REST Countries failed:", countryResult.reason.message);
    countryInfo = fallbackCountryInfo(place);
    countrySource = "fallback";
    countryError = countryResult.reason.message;
  }

  if (weatherResult.status === "rejected") {
    throw new Error("The weather service is not responding right now. Please try again.");
  }
  const { weather, forecast, forecastAvailable } = weatherResult.value;

  // 4) Build the shared object (DATA CONTRACT)
  currentDestination = {
    city: place.name,
    country: countryInfo.country,
    countryCode: place.countryCode,
    latitude: place.latitude,
    longitude: place.longitude,
    currency: countryInfo.currency,
    travelDate,
    weather, // null when forecastAvailable === false

    region: place.region,
    timezone: place.timezone,
    capital: countryInfo.capital,
    currencyName: countryInfo.currencyName,
    currencySymbol: countryInfo.currencySymbol,
    languages: countryInfo.languages,
    population: countryInfo.population,
    continent: countryInfo.continent,
    flagUrl: countryInfo.flagUrl,
    flagEmoji: countryInfo.flagEmoji,

    forecast,
    forecastAvailable,
    source: { country: countrySource, weather: "open-meteo", countryError }
  };

  // Let the other parts react (Student 2 / Student 3 can listen to this event)
  document.dispatchEvent(new CustomEvent("destination:ready", { detail: currentDestination }));
  return currentDestination;
}

/* ---------------- UI ---------------- */

/** Render the country / destination card into a container element. */
function renderDestination(data, container) {
  if (!container) return;

  const flag = data.flagUrl
    ? `<img class="dw-flag" src="${data.flagUrl}" alt="Flag of ${data.country}">`
    : `<span class="dw-flag-emoji">${data.flagEmoji}</span>`;

  const rows = [
    ["Country", data.country],
    ["Region", data.region],
    ["Capital", data.capital],
    ["Currency", data.currency ? `${data.currency}${data.currencyName ? " — " + data.currencyName : ""} ${data.currencySymbol || ""}` : ""],
    ["Languages", (data.languages || []).join(", ")],
    ["Population", data.population ? data.population.toLocaleString("en-US") : ""],
    ["Time zone", data.timezone],
    ["Coordinates", `${data.latitude.toFixed(3)}, ${data.longitude.toFixed(3)}`]
  ].filter(([, v]) => v);

  container.innerHTML = `
    <div class="dw-card">
      <div class="dw-dest-header">
        ${flag}
        <div>
          <h3>${data.city}</h3>
          <p>${data.country}${data.continent ? " · " + data.continent : ""}</p>
        </div>
      </div>
      <table class="dw-table">
        ${rows.map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("")}
      </table>
      ${data.source.country === "fallback"
        ? `<p class="dw-note">Limited country details (REST Countries is unavailable${data.source.countryError ? ": " + data.source.countryError : ""}).</p>`
        : ""}
    </div>`;
}

/** Show an error message inside a container. */
function renderDestinationError(message, container) {
  if (!container) return;
  container.innerHTML = `<div class="dw-card dw-error">⚠️ ${message}</div>`;
}

/**
 * Attach live city suggestions to an <input> using a <datalist>.
 * Returns a function that gives the selected city object (or null).
 */
function attachCityAutocomplete(input, datalist) {
  let suggestions = [];
  let timer = null;

  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      try {
        suggestions = await searchCities(input.value, 5);
        datalist.innerHTML = suggestions
          .map(s => `<option value="${s.label}"></option>`)
          .join("");
      } catch (e) {
        suggestions = [];
      }
    }, 300); // debounce: wait until the user stops typing
  });

  return () => suggestions.find(s => s.label === input.value) || null;
}
