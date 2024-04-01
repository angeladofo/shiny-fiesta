

let weather =
  "https://api.open-meteo.com/v1/forecast?latitude=10&longitude=13.41&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timeformat=unixtime&timezone=America%2FNew_York";
  console.log(weather)
  let weatherUrl;
  weatherUrl = new URL(weather);
// .search: we want to update the longitude and latitude of the url above the easiest way to access it is with the .search property

let generateImage;
const dayFormat = new Intl.DateTimeFormat(undefined, { weekday: "short" }); //undefined just means your local timezone //long converts it into the weekday words //short is the same as long except instead of Friday you would get Fri
const dayFormatLong = new Intl.DateTimeFormat(undefined, {weekday: "long"});
const hourFormat = new Intl.DateTimeFormat(undefined, {hour : "numeric"})

export function getWeather(lat = 10, lon = 10, timezone) {
  let currentTemp;
  let currWindSpeed;
  let currPrecip;
  let iconCode;
  let currTime;
  

  // Check if Geolocation API is supported
  if ("geolocation" in navigator) {
    // Prompt the user to allow or deny location access using an alert
    if (window.confirm("Allow this site to access your location?")) {
      // User clicked "OK", proceed to get location
      getLocation();
    } else {
      // User clicked "Cancel" or closed the alert, handle accordingly
      console.log("User denied location access.");
      getData(weather);
    }
  } else { 
    // Geolocation API is not supported by the browser
    console.error("Geolocation is not supported by this browser.");
    getData(weather);
  }

  // Function to get location
  function getLocation(latitude, longitude) {
    navigator.geolocation.getCurrentPosition(
      function getPosition(position) {
        let lat = Math.round(position.coords.latitude * 100) / 100;
        let long = Math.round(position.coords.longitude * 100) / 100;
        // console.log(weatherUrl.href);

        //changing the API to be the coordinates of the USER
        weatherUrl.search = `?latitude=${lat}&longitude=${long}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&hourly=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timeformat=unixtime&timezone=${timezone}`;

        // console.log(weatherUrl.href);

        //Calling the function that fetches the data based on updated URL
        getData(weatherUrl);
      },

      function (error) {
        console.error("Error getting user's location:", error.message);
      }
    );
  }

  function getData(weatherUrl) {
    fetch(weatherUrl)
      .then((file) => {
        if (!file.ok) {
          throw new Error("invalid response");
        }
        return file.json();
      })
      .then((data) => {
        //getting important current-weather data from API
        currTime = data.current.time;
        currentTemp = Math.round(data.current.temperature_2m);
        currWindSpeed = data.current.wind_speed_10m;
        currPrecip = data.current.precipitation;
        console.log(data.current.weather_code)
        getIcon(data.current.weather_code);

        //getting important daily-weather data from API Sunday to Monday
        let myDaily = data.daily.time.map((time, index) => {
          return {
            // the { must me next to return
            timestamp: time * 1000, // converts to milliseconds
            weathercode: data.daily.weather_code[index],
            hightemp: data.daily.temperature_2m_max[index],
            lowtemp: data.daily.temperature_2m_min[index],
            flhightemp: data.daily.apparent_temperature_max[index],
            fllowtemp: data.daily.apparent_temperature_min[index],
          };
        });
        console.log(myDaily)

        //getting important hourly-weather data from API
        let myHourly = data.hourly.time
          .map((time, index) => {
            return {
              // the { must be next to return
              timestamp: time * 1000, // converts to milliseconds
              weathercode: data.hourly.weather_code[index],
              temp: Math.round(data.hourly.temperature_2m[index]),
              fltemp: Math.round(data.hourly.apparent_temperature[index]),
              rain: Math.round(data.hourly.precipitation[index]),
              wind: Math.round(data.hourly.wind_speed_10m[index]),
            };
          })
          .filter(
            (item) =>
              item.timestamp >= currTime * 1000 &&
              item.timestamp <= (currTime + 41500) * 1000
          ); //no use of {} for .filter
        //filters array to be from current-time to 12hrs away
            console.log(myHourly)
        // Updating the UI
        renderData("current-temp", currentTemp);
        renderData("head-wind", currWindSpeed);
        renderData("head-rain", currPrecip);
        renderIcon("current-icon", generateImage);
        renderDaily(myDaily);
        renderHourly(myHourly);

        //the json has a bunch of arrays typically the first array is the most recent data for the particular key
      })
      .catch((err) => {
        console.warn(err.message);
      });
  }
}
//function for generating icon based on code
function getIcon(code) {
  if(code === 0) {
    return (generateImage = "icons/sun.svg")
  }
  if (code < 4 && code !== 0) {
    return (generateImage = "icons/cloud.svg");
  } else if ((code > 50 && code < 68) || (code > 79 && code < 83)) {
    return (generateImage = "icons/rain.svg");
  } else if ((code > 70 && code < 78) || code === 85 || code === 86) {
    return (generateImage = "icons/snow.svg");
  } else if (code === 95 || code === 96 || code === 99) {
    return (generateImage = "icons/lightning.svg");
  }
}

function renderData(selector, value, { parent = document } = {}) {
  // setting the parent property is optional
  parent.querySelector(`[data-${selector}]`).innerText = value;
}

function renderIcon(selector, generated, { parent = document } = {}) {
  let img = parent.querySelector(`[data-${selector}]`);
  img.src = generated;
}

function renderDaily(daily) {
  let section = document.querySelector("[data-daily-report]");
  let cardTemplate = document.getElementById("card-template");
  section.innerText = "";

  daily.forEach((day, index) => {
    //assign the cloned content of the <template> element to our variable
    const element = cardTemplate.content.cloneNode("true");

    // Set the childs data of the cloned template
    renderData("template-high", day.hightemp, { parent: element });
    renderData("template-low", day.lowtemp, { parent: element });
    renderIcon("template-daily-icon", getIcon(day.weathercode), {
      parent: element,
    }); //whatever getIcon returns becomes result
    renderData("template-day", dayFormat.format(day.timestamp), {
      parent: element,
    });
    //apend the template back on the UI
    section.append(element);
  });
}

function renderHourly(hourly) {
  let section = document.getElementById("table-section");
  let hourlyTemplate = document.getElementById("hourly-template");
  section.innerText = "";
  console.log(hourly)

  hourly.forEach((hour, index) => {
    //assign the cloned content of the <template> element to our variable
    const element = hourlyTemplate.content.cloneNode("true");
    
    

    // Set the childs data of the cloned template
    renderData("template-hourly-day", dayFormatLong.format(hour.timestamp), {
      parent: element,
    });

    renderData("template-hour", hourFormat.format(hour.timestamp), { parent: element });
    renderIcon("template-hourly-icon", getIcon(hour.weathercode), {
      parent: element,
    });
    renderData("template-hourly-temp", hour.temp, { parent: element });
    renderData("template-hourly-fl", hour.fltemp, { parent: element });
    renderData("template-hourly-wind", hour.wind, { parent: element });
    renderData("template-hourly-precip", hour.rain, { parent: element });

    //apend the template back on the UI
    
    section.append(element);
  });
}