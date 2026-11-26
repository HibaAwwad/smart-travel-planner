/* ============================================================
 *  mockData.js  —  DATA CONTRACT between the 3 students
 *  Owner: Student 1
 * ============================================================
 *  Student 2 and Student 3 can build their parts using this object
 *  before the real APIs are connected. The real
 *  getDestinationData(city, date) returns EXACTLY this shape.
 *
 *  Student 2 (Budget)       uses: currency, currencyName, currencySymbol, country
 *  Student 3 (Attractions)  uses: latitude, longitude, weather, city
 * ============================================================ */

const mockDestinationData = {
  // ---- agreed fields (do not rename) ----
  city: "Istanbul",
  country: "Turkey",
  countryCode: "TR",
  latitude: 41.01384,
  longitude: 28.94966,
  currency: "TRY",
  travelDate: "2026-11-28",

  weather: {
    temperature: 17,          // max temperature of the travel day (°C)
    rainProbability: 60,      // %
    condition: "Light rain",  // short text from the WMO weather code

    // ---- extra weather fields ----
    minTemperature: 11,
    maxTemperature: 17,
    windSpeed: 18,            // km/h
    weatherCode: 61,
    icon: "🌦️",
    isOutdoorFriendly: false  // true when no rain/snow/storm and temp is mild
  },

  // ---- extra destination fields ----
  region: "Istanbul",          // state / province from geocoding
  timezone: "Europe/Istanbul",
  capital: "Ankara",
  currencyName: "Turkish lira",
  currencySymbol: "₺",
  languages: ["Turkish"],
  population: 85000000,
  continent: "Asia",
  flagUrl: "https://flags.restcountries.com/v5/w640/tr.png",
  flagEmoji: "🇹🇷",

  // all forecast days returned by Open-Meteo (for charts / comparisons)
  forecast: [
    { date: "2026-11-27", min: 12, max: 16, rainProbability: 20, weatherCode: 3,  condition: "Overcast", icon: "☁️" },
    { date: "2026-11-28", min: 11, max: 17, rainProbability: 60, weatherCode: 61, condition: "Light rain", icon: "🌦️" },
    { date: "2026-11-29", min: 9,  max: 13, rainProbability: 10, weatherCode: 1,  condition: "Mainly clear", icon: "🌤️" }
  ],

  forecastAvailable: true,     // false when date is more than 15 days away
  source: { country: "mock", weather: "mock" }
};
