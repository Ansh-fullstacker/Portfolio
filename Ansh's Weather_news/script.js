/* ==========================================
   ATMOSPHERE WEATHER ENGINE
   OpenWeatherMap Current + 5 Day Forecast
   ========================================== */

// 1. Paste your OpenWeatherMap API key here.
const WX_API_KEY = "acf737b59684d89e733a44d51a1fda2a";

// 2. Find the dashboard elements.
const wx = (id) => document.getElementById(id);

const wxForm = wx("wx-search");
const wxInput = wx("wx-city");
const wxButton = wx("wx-search-btn");
const wxStatus = wx("wx-status");
const wxContent = wx("wx-content");

const WX_BASE = "https://api.openweathermap.org/data/2.5";
const WX_ICON = "https://openweathermap.org/img/wn/";

const wxNumber = (value) => Math.round(value);

function wxSet(id, value) {
  wx(id).textContent = value;
}

function wxIcon(code) {
  return `${WX_ICON}${code}@2x.png`;
}

function wxDate(timestamp, timezone, options) {
  // Format using the city's timezone, not the computer's timezone.
  const date = new Date(
    (timestamp + timezone) * 1000
  );

  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: "UTC"
  }).format(date);
}

function wxClock(timestamp, timezone) {
  return wxDate(timestamp, timezone, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}

function wxWindDirection(degrees) {
  const directions = [
    "N", "NE", "E", "SE",
    "S", "SW", "W", "NW"
  ];

  return directions[
    Math.round(degrees / 45) % 8
  ];
}

function wxEscape(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  })[char]);
}

// 3. Request JSON safely and show meaningful errors.
async function wxFetch(url) {
  const response = await fetch(url);

  let data;

  try {
    data = await response.json();
  } catch {
    throw new Error("Weather service returned an invalid response.");
  }

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error(
        "API key invalid or not activated yet. Check your key and try again."
      );
    }

    if (response.status === 404) {
      throw new Error(
        "City not found. Try a city name like Jaipur or London."
      );
    }

    if (response.status === 429) {
      throw new Error(
        "Too many requests. Please wait and try again."
      );
    }

    throw new Error(
      data.message || `Weather service error (${response.status}).`
    );
  }

  return data;
}

// 4. Render the main weather hero.
function wxRenderCurrent(data) {
  const timezone = data.timezone || 0;
  const weather = data.weather[0];

  wxSet("wx-location", `${data.name}, ${data.sys.country}`);
  wxSet(
    "wx-date",
    wxDate(data.dt, timezone, {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    })
  );

  wxSet("wx-temp", wxNumber(data.main.temp));
  wxSet("wx-feels", wxNumber(data.main.feels_like));
  wxSet("wx-feels-stat", wxNumber(data.main.feels_like));
  wxSet("wx-description", weather.description);

  wx("wx-icon").src = wxIcon(weather.icon);
  wx("wx-icon").alt = weather.description;

  wxSet("wx-humidity", data.main.humidity);
  wxSet("wx-humidity-short", `${data.main.humidity}%`);

  wx("wx-humidity-bar").style.width =
    `${Math.max(0, Math.min(100, data.main.humidity))}%`;

  wxSet("wx-wind", data.wind.speed.toFixed(1));
  wxSet(
    "wx-wind-direction",
    data.wind.deg == null
      ? "Air movement"
      : `${wxWindDirection(data.wind.deg)} direction`
  );

  wxSet("wx-pressure", data.main.pressure);
  wxSet(
    "wx-visibility",
    data.visibility == null
      ? "--"
      : (data.visibility / 1000).toFixed(1)
  );
  wxSet("wx-clouds", data.clouds.all);

  wxSet("wx-sunrise", wxClock(data.sys.sunrise, timezone));
  wxSet("wx-sunset", wxClock(data.sys.sunset, timezone));

  wxSet(
    "wx-condition-pill",
    "LIVE CONDITIONS"
  );
}

// 5. Group the forecast into local calendar days.
function wxGroupDays(items, timezone) {
  const groups = new Map();

  for (const item of items) {
    const date = wxDate(item.dt, timezone, {
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });

    if (!groups.has(date)) {
      groups.set(date, []);
    }

    groups.get(date).push(item);
  }

  return [...groups.values()];
}

// 6. Display the next six 3-hour forecast slots.
function wxRenderHourly(items, timezone) {
  const container = wx("wx-hourly");

  container.innerHTML = items.slice(0, 6).map((item, index) => {
    const time = index === 0
      ? "Now + 3h"
      : wxDate(item.dt, timezone, {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true
        });

    const description = wxEscape(
      item.weather[0].description
    );

    return `
      <article class="wx-hour">
        <time>${time}</time>
        <img
          src="${wxIcon(item.weather[0].icon)}"
          alt="${description}"
          loading="lazy"
        />
        <strong>${wxNumber(item.main.temp)}°</strong>
        <p>${description}</p>
      </article>
    `;
  }).join("");
}

// 7. Display a five-day forecast.
// The forecast API provides 3-hour intervals, so we aggregate
// each day's readings to estimate the daily high and low.
function wxRenderForecast(items, timezone) {
  const days = wxGroupDays(items, timezone).slice(0, 5);

  wx("wx-forecast").innerHTML = days.map((day, index) => {
    const temps = day.map((item) => item.main.temp);
    const high = wxNumber(Math.max(...temps));
    const low = wxNumber(Math.min(...temps));

    // Choose the reading closest to midday.
    const midday = day.reduce((best, item) => {
      const hour = Number(
        wxDate(item.dt, timezone, { hour: "2-digit", hour12: false })
      );

      const bestHour = Number(
        wxDate(best.dt, timezone, { hour: "2-digit", hour12: false })
      );

      return Math.abs(hour - 12) < Math.abs(bestHour - 12)
        ? item
        : best;
    });

    const date = wxDate(midday.dt, timezone, {
      weekday: "short",
      day: "numeric",
      month: "short"
    });

    const label = index === 0 ? "Today" : date;
    const description = wxEscape(
      midday.weather[0].description
    );

    const rainChance = Math.round(
      Math.max(...day.map((item) => (item.pop || 0) * 100))
    );

    return `
      <article class="wx-day">
        <span class="wx-day-name">${label}</span>
        <span class="wx-day-weather">
          <img src="${wxIcon(midday.weather[0].icon)}"
               alt="${description}" loading="lazy" />
          ${description}
        </span>
        <span class="wx-day-temps">
          <span>${high}°</span>
          <span>${low}°</span>
        </span>
        <span class="wx-day-rain">☂ ${rainChance}%</span>
      </article>
    `;
  }).join("");
}

// 8. Load the complete dashboard.
async function wxLoadWeather(city) {
  const searchCity = city.trim();

  if (!searchCity) {
    wxStatus.textContent = "Please enter a city name.";
    wxInput.focus();
    return;
  }

  if (WX_API_KEY === "YOUR_API_KEY") {
    wxStatus.textContent =
      "Add your OpenWeatherMap API key in script.js first.";
    return;
  }

  wxButton.disabled = true;
  wxStatus.textContent = "Reading the sky...";
  wxContent.hidden = true;

  try {
    const query = `q=${encodeURIComponent(searchCity)}&appid=${encodeURIComponent(WX_API_KEY)}&units=metric`;

    const [current, forecast] = await Promise.all([
      wxFetch(`${WX_BASE}/weather?${query}`),
      wxFetch(`${WX_BASE}/forecast?${query}`)
    ]);

    // Both requests must succeed before showing the dashboard.
    wxRenderCurrent(current);

    wxRenderHourly(
      forecast.list,
      forecast.city.timezone || 0
    );

    wxRenderForecast(
      forecast.list,
      forecast.city.timezone || 0
    );

    wxContent.hidden = false;
    wxStatus.textContent =
      `Weather updated for ${current.name}.`;
  } catch (error) {
    wxStatus.textContent =
      error instanceof TypeError
        ? "Network error. Check your connection and API access."
        : error.message;

    console.error("Atmosphere weather error:", error);
  } finally {
    wxButton.disabled = false;
  }
}

// 9. Search by clicking Explore or pressing Enter.
wxForm.addEventListener("submit", (event) => {
  event.preventDefault();
  wxLoadWeather(wxInput.value);
});

// 10. Automatically load Jaipur on page open.
wxLoadWeather(wxInput.value || "Jaipur");