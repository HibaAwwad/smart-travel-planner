# Smart Travel Planner ✈️🌍

**COM4381: Web Services Technologies — Project 1 (Consuming RESTful Web Service APIs)**
Birzeit University · 1st Semester 2026/2027

## Group members

| Name | Student ID | Part |
|---|---|---|
| Hiba | 1220722 | Destination & Weather (REST Countries + Open-Meteo) |
| Amal | ________ | Budget & Currency + Dashboard (Frankfurter) |
| Dalia | ________ | Tourist Attractions + Map (OpenTripMap) |

## Description

Smart Travel Planner helps a traveler plan a trip from one page. The user enters a
destination city, a travel date, a budget and their interests, and the app combines
several public REST APIs to show:

- **Destination info** — country, flag, capital, currency, languages, population
  (*REST Countries v5*) and the city's coordinates (*Open-Meteo Geocoding*).
- **Weather** on the travel date plus a 16-day forecast and an outdoor-activity hint
  (*Open-Meteo Forecast*).
- **Budget** converted to the local currency and split into categories (*Frankfurter*).
- **Tourist attractions** near the city on a map, filtered by interest (*OpenTripMap*).

All APIs are consumed directly from the frontend with the JavaScript **Fetch API**.

## APIs used

| API | Endpoint example | Key |
|---|---|---|
| Open-Meteo Geocoding | `GET https://geocoding-api.open-meteo.com/v1/search?name=Istanbul&count=5` | No |
| Open-Meteo Forecast | `GET https://api.open-meteo.com/v1/forecast?latitude=41.01&longitude=28.95&daily=...` | No |
| REST Countries v5 | `GET https://api.restcountries.com/countries/v5/codes.alpha_2/TR` | Free key |
| Frankfurter | `GET https://api.frankfurter.dev/...` | No |
| OpenTripMap | `GET https://api.opentripmap.com/0.1/en/places/radius?...` | Free key |

## How to run

1. Clone the repository and open the `assignment1` folder in **VS Code**.
2. Install the **Live Server** extension.
3. REST Countries key: put it in `js/config.js` (`REST_COUNTRIES_API_KEY`).
   The key's CORS allowed origins must include `localhost` and `127.0.0.1`.
4. Right-click `index.html` → **Open with Live Server**
   (the page must be served over `http://`, not opened as a `file://`).

To test only the Destination & Weather part, open `student1-test.html` with Live Server.

No libraries need to be installed — the project is plain HTML, CSS and JavaScript.

## Project structure

```text
assignment1/
├── index.html
├── student1-test.html
├── css/
│   └── destination.css
├── js/
│   ├── config.js
│   ├── mockData.js
│   ├── destination.js
│   └── weather.js
├── postman/
│   ├── Student1_Destination_Weather.postman_collection.json
│   └── student1-requests.http
└── README.md
```
