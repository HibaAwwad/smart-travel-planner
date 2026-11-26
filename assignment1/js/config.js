/* ============================================================
 *  config.js  —  Shared configuration (Smart Travel Planner)
 *  Owner: Student 1 (Destination & Weather)
 * ============================================================
 *  REST Countries v3.1 is DEPRECATED (returns an error now).
 *  We use REST Countries v5, which needs a FREE API key:
 *    1) Sign up:  https://restcountries.com/sign-up
 *    2) Create a key on https://restcountries.com/api-keys
 *    3) Add these hostnames to the key's allowed origins:
 *         localhost
 *         127.0.0.1
 *       (and your GitHub Pages host if you deploy, e.g. username.github.io)
 *    4) Paste the key below.
 *
 *  If the key is empty or the request fails, destination.js falls back
 *  to the country data returned by Open-Meteo Geocoding, so the app
 *  keeps working during the demo.
 * ============================================================ */

const CONFIG = {
  REST_COUNTRIES_API_KEY: "rc_live_2eb5d0ca3fc04a1dbfffd38ed5591045",

  REST_COUNTRIES_BASE: "https://api.restcountries.com/countries/v5",
  GEOCODING_BASE: "https://geocoding-api.open-meteo.com/v1/search",
  FORECAST_BASE: "https://api.open-meteo.com/v1/forecast",

  // Open-Meteo gives up to 16 forecast days (today + 15)
  MAX_FORECAST_DAYS: 16,

  // Set to true to make getDestinationData() return mock data (no network)
  USE_MOCK_DATA: false
};
