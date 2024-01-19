const WEATHER_API_URL = "http://api.weatherapi.com/v1";

const TIMELINE = {
  WEEKLY: 1,
  MONTHLY: 3,
  FORTNIGHT: 2,
};

const MAX_REQUESTS = 10; // Maximum number of requests allowed
  const REQUEST_INTERVAL = 60; // Interval in seconds (1 minute)


module.exports = {
  WEATHER_API_URL,
  TIMELINE,
  MAX_REQUESTS,
  REQUEST_INTERVAL
};
