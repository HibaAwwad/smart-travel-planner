# الطالب الأول — Destination & Weather

## ⚠️ أول إشي لازم تعرفيه: REST Countries تغيّرت

الرابط اللي اقترحه ChatGPT (`restcountries.com/v3.1/...`) صار **deprecated** وبرجّع خطأ.
النسخة الجديدة **v5** شغالة، بس بدها **API key مجاني**:

1. اعملي حساب: https://restcountries.com/sign-up
2. من صفحة https://restcountries.com/api-keys اعملي مفتاح.
3. ضيفي للـ **Allowed origins** هدول:
   - `localhost`
   - `127.0.0.1`
   - ولو رح ترفعوه على GitHub Pages: `username.github.io`
4. حطي المفتاح في `js/config.js` مكان `REST_COUNTRIES_API_KEY: ""`.

> لو ما في مفتاح أو صار خطأ، الكود بكمل شغل باستخدام بيانات الدولة من Open-Meteo Geocoding
> (اسم الدولة + العلم كـ emoji + العملة لأشهر الدول)، عشان الديمو ما يوقف.

**مهم:** افتحي المشروع من **Live Server** في VS Code (`http://127.0.0.1:5500/...`)
مش بدبل كليك على الملف، لأنه REST Countries بترفض الطلبات اللي جاية من `file://`.

---

## الملفات تبعتي

| الملف | شو فيه |
|---|---|
| `js/config.js` | الروابط والـ API key (مشترك) |
| `js/mockData.js` | **Data Contract**: نسخة تجريبية من `destinationData` للطالب 2 و 3 |
| `js/destination.js` | البحث عن المدينة (Geocoding) + معلومات الدولة (REST Countries) + الدالة الرئيسية |
| `js/weather.js` | توقعات الطقس (Open-Meteo) + تحويل weather codes لنص وأيقونة |
| `css/destination.css` | ستايل قسمي (كل الكلاسات تبدأ بـ `dw-` عشان ما تتعارض مع حدا) |
| `student1-test.html` | صفحة لتجربة شغلي لحاله قبل الدمج |
| `postman/...collection.json` | Postman collection جاهزة للعرض |

---

## للطالب الثاني والثالث (ابعتيلهم هاد القسم)

### ترتيب تحميل السكربتات في `index.html`
```html
<link rel="stylesheet" href="css/destination.css">
...
<script src="js/config.js"></script>
<script src="js/mockData.js"></script>
<script src="js/weather.js"></script>
<script src="js/destination.js"></script>
<!-- بعدها budget.js, attractions.js, recommendations.js, app.js -->
```

### الدالة الرئيسية
```javascript
const data = await getDestinationData("Istanbul", "2026-11-28");
```
بترجع object بنفس شكل `mockDestinationData`:

| الحقل | مين بستخدمه |
|---|---|
| `currency`, `currencyName`, `currencySymbol`, `country` | الطالب 2 (Budget) |
| `latitude`, `longitude`, `city` | الطالب 3 (Attractions) |
| `weather.condition`, `weather.rainProbability`, `weather.isOutdoorFriendly` | الطالب 3 (Recommendations) |
| `forecast` (16 يوم) | أي حدا بده يقارن أيام |

- `weather` بتكون `null` و`forecastAvailable` بتكون `false` لو التاريخ أبعد من 15 يوم.
- لو صار خطأ (مدينة مش موجودة، تاريخ ماضي…) الدالة بتعمل `throw new Error("رسالة واضحة")`، فاستخدموا `try/catch`.

### طريقتين للربط
```javascript
// 1) مباشرة من app.js
const data = await getDestinationData(city, date);
updateBudget(data.currency);
loadAttractions(data.latitude, data.longitude);

// 2) أو استمعوا للحدث
document.addEventListener("destination:ready", (e) => {
  const data = e.detail;
});
```

### للشغل قبل ما يجهز الـ API
```javascript
CONFIG.USE_MOCK_DATA = true;   // getDestinationData بترجع mockDestinationData
```

### دوال الواجهة الجاهزة
```javascript
renderDestination(data, document.getElementById("dw-destination"));
renderWeather(data, document.getElementById("dw-weather"));
renderDestinationError(err.message, container);
attachCityAutocomplete(inputEl, datalistEl);  // اقتراحات المدن أثناء الكتابة
getForecastDateRange();                       // {min, max} لحقل التاريخ
```
قسم الـ HTML الجاهز موجود في `student1-test.html` بين التعليقين
`Section that Student 2 copies into index.html`.

---

## شرح Postman (دقائقك الـ 3 بالعرض)

استوردي `postman/Student1_Destination_Weather.postman_collection.json` (Import في Postman)،
وغيري المتغير `rc_api_key` لمفتاحك.

1. **Service providers:** Open-Meteo (طقس وجغرافيا، مجاني بدون مفتاح) و REST Countries (معلومات الدول).
2. **Resource + Root URL + Path:**
   - `https://geocoding-api.open-meteo.com` ← root، `/v1/search` ← path (المورد: المدن)
   - `https://api.open-meteo.com` + `/v1/forecast` (المورد: التوقعات)
   - `https://api.restcountries.com` + `/countries/v5/codes.alpha_2/TR` (المورد: دولة معينة؛ الـ TR جزء من الـ path)
3. **HTTP method:** كلها `GET` (قراءة بس).
4. **Query parameters:** `name`, `count`, `latitude`, `longitude`, `daily`, `timezone`, `forecast_days`, `response_fields`.
5. **Representation:** JSON. ولإظهار المرونة شغّلي الطلب رقم 4: نفس الطقس بـ `format=csv` بيرجع CSV.
6. **Authentication:** REST Countries بدها `Authorization: Bearer <key>` بالـ Header — قارنيها مع Open-Meteo اللي ما بدها.
7. **Error case:** الطلب رقم 5 (مدينة مش موجودة) بيرجع بدون `results`، وورجيهم كيف الموقع بيعرض رسالة.
8. **Scenario:** الطلب 1 فيه script بيحفظ `lat`/`lon`/`country_code` تلقائياً، فالطلب 2 و 3 بيستخدموهم ← هاي نفس سلسلة الطلبات اللي بيعملها الموقع.

---

## Git
```bash
git checkout -b feature/destination-weather
git add js/config.js js/mockData.js js/destination.js js/weather.js css/destination.css student1-test.html postman/ STUDENT1_NOTES.md
git commit -m "Student 1: destination & weather (Open-Meteo + REST Countries v5)"
git push -u origin feature/destination-weather
```
