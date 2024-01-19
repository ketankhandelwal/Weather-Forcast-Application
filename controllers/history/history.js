// Import necessary modules and configurations
const history_validations = require("../../validations/history_validation");
const formatResponse = require("../../response_handler/response_handler");
const pool = require("../../dbConfig/db");
const axios = require("axios");
const {
  WEATHER_API_URL,
  TIMELINE,
  MAX_REQUESTS,
  REQUEST_INTERVAL,
} = require("../../utils/constant");
const redis = require("redis");
const { getFromCache, setToCache } = require("../../utils/helperFunctions");
const logger = require("../../utils/logger");
const { log } = require("winston");

// Controller function to get weather history
exports.getHistory = async (req, res) => {
  // Establish a database connection
  const client = await pool.connect();

  try {
    // Extract parameters from the request query
    let { id, timeline } = req.query;

    //logger
    logger.info("Fetch the history data for id & timeline", {
      customVars: {
        location_id: id,
        timeline: 1
          ? TIMELINE.WEEKLY
          : 2
          ? TIMELINE.FORTNIGHT
          : 3
          ? TIMELINE.MONTHLY
          : "Invalid",
      },
    });

    // Validate request parameters using Joi schema
    try {
      await history_validations.getHistory.validate({
        id,
        timeline,
      });
    } catch (validationError) {
      // Return a 400 response if validation fails
      const response = formatResponse(400, String(validationError.errors), []);
      return res.status(400).json(response);
    }

    // Start a database transaction
    await client.query("BEGIN");

    // SQL query to get latitude and longitude from the database
    const get_lat_lng_byID_query = `SELECT lat,lng FROM locations WHERE id = $1`;

    // Execute the SQL query to get location coordinates
    const get_lat_lng_byID_result = await client.query(get_lat_lng_byID_query, [
      id,
    ]);

    // Call a function to get weather history data based on location and timeline
    const get_weather_history_data = await getWeatherHistoryData(
      get_lat_lng_byID_result,
      timeline
    );

    // Commit the database transaction
    await client.query("COMMIT");

    // Send success response if weather history data is obtained
    if (get_weather_history_data) {
      const response = formatResponse(
        200,
        "Weather History Fetched Successfully!",
        get_weather_history_data
      );
      res.status(200).json(response);
    } else {
      // Rollback the transaction in case of failure to get weather history data
      await client.query("ROLLBACK");
      const response = formatResponse(400, "Something went wrong!", []);
      res.status(400).json(response);
    }
  } catch (error) {
    // Handle any errors that occur during the process, log the error, and return a 400 response
    const response = formatResponse(400, String(error), []);
    res.status(400).json(response);
  } finally {
    // Release the database connection when done
    client.release();
  }
};

// Function to get weather history data from OpenWeatherMap API
const getWeatherHistoryData = async (locationCoordinates, timeline) => {
  const redisClient = redis.createClient({
    legacyMode: true,
  });
  await redisClient.connect();
  const { lat, lng } = locationCoordinates.rows[0];

  //logger
  logger.info("Location Coordinates", {
    customVars: {
      lat: lat,
      lng: lng,
    },
  });
  const { startDate, endDate } = calculateTimeStamp(timeline);

  const cacheKey = `${startDate}-${endDate}`;

  //logger
  logger.info("History Cached Key", {
    customVars: {
      cacheKey: cacheKey,
    },
  });

  // Check if there is a rate limit key in the cache
  const rateLimitKey = `rate_limit:${cacheKey}`;
  const rateLimitCount = (await getFromCache(rateLimitKey, redisClient)) || 0;

  // Check if the user has exceeded the rate limit
  if (rateLimitCount >= MAX_REQUESTS) {
    const error = new Error("Rate limit exceeded. Please try again later.");
    error.statusCode = 429; // HTTP 429 Too Many Requests
    throw error;
  }

  // Check if data is in the cache
  const cachedData = await getFromCache(cacheKey, redisClient);
  if (cachedData) {
    await setToCache(
      rateLimitKey,
      rateLimitCount + 1,
      REQUEST_INTERVAL,
      redisClient
    );
    return cachedData;
  }


  // If not in cache, make API request
  const apiKey = process.env.WEATHER_API_KEY;
  const historyApiURL = `${WEATHER_API_URL}/history.json?key=${apiKey}&q=${lat},${lng}&dt=${startDate}&end_dt=${endDate}`;

  try {
    // Increment the rate limit count
    await setToCache(
      rateLimitKey,
      rateLimitCount + 1,
      REQUEST_INTERVAL,
      redisClient
    );

    const response = await axios.get(historyApiURL);
    const weatherHistoryData = response.data;

    // Store data in the cache with a 1-day expiration (in seconds)
    await setToCache(cacheKey, weatherHistoryData, 24 * 60 * 60, redisClient);

    return weatherHistoryData;
  } catch (error) {
    console.log(String(error));
    throw error;
  }
};

// Function to calculate start and end dates based on the timeline
const calculateTimeStamp = (timeline) => {
  try {
    if (timeline == TIMELINE.WEEKLY) {
      // Calculate start and end dates for a 7-day timeline
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const startDate = formatDate(sevenDaysAgo);
      const endDate = formatDate(new Date());
      return {
        startDate,
        endDate,
      };
    } else if (timeline == TIMELINE.FORTNIGHT) {
      // Calculate start and end dates for a 15-day timeline
      const fifteenDaysAgo = new Date();
      fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
      const startDate = formatDate(fifteenDaysAgo);
      const endDate = formatDate(new Date());
      return {
        startDate,
        endDate,
      };
    } else if (timeline == TIMELINE.MONTHLY) {
      // Calculate start and end dates for a 30-day timeline
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = formatDate(thirtyDaysAgo);
      const endDate = formatDate(new Date());
      return {
        startDate,
        endDate,
      };
    } else {
      // Throw an error for an invalid timeline value
      throw new Error("Invalid timeline value");
    }
  } catch (error) {
    // Log and rethrow any errors during date calculation
    console.error("Error calculating timestamp:", error);
    throw error;
  }
};

// Function to format a date as "YYYY-MM-DD"
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
