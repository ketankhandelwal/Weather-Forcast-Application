// Import necessary dependencies and libraries
const weather_validator = require("../../validations/weather_validator");
const formatResponse = require("../../response_handler/response_handler");
const pool = require("../../dbConfig/db");
const axios = require("axios");
const {
  WEATHER_API_URL,
  MAX_REQUESTS,
  REQUEST_INTERVAL,
} = require("../../utils/constant");
const redis = require("redis");
const { setToCache, getFromCache } = require("../../utils/helperFunctions");
const logger = require("../../utils/logger");

// Controller function to get weather forecast by location ID
exports.getWeatherForcastByID = async (req, res) => {
  // Establish a database connection
  const client = await pool.connect();

  try {
    // Extract location ID from the request query
    let { id } = req.query;

    logger.info("Fetching Data for ID ", {
      customVars: {
        location_id: id,
      },
    });

    // Validate request parameters using Joi schema
    try {
      await weather_validator.getWeatherForcastByID.validate({
        id,
      });
    } catch (validationError) {
      // Return a 400 response if validation fails
      const response = formatResponse(400, String(validationError.errors), []);
      return res.status(400).json(response);
    }

    // Start a database transaction
    await client.query("BEGIN");

    // SQL query to get latitude and longitude by location ID
    const get_lat_lng_byID_query = `
    SELECT lat, lng FROM locations WHERE id = $1
    `;

    // Execute the SQL query to get latitude and longitude by location ID
    const get_lat_lng_byID_result = await client.query(get_lat_lng_byID_query, [
      id,
    ]);

    //
    logger.info("Fetching Latitude and Longiture of Location by ID", {
      customVars: {
        lat: get_lat_lng_byID_result.rows[0].lat,
        lng: get_lat_lng_byID_result.rows[0].lng,
      },
    });

    // Get weather data using latitude and longitude
    const weather_data = await getWeatherData(get_lat_lng_byID_result);

    // Commit the database transaction
    await client.query("COMMIT");

    // Send success response
    if (weather_data) {
      const response = formatResponse(
        200,
        "Forecast Fetched Successfully!",
        weather_data
      );
      res.status(200).json(response);
    } else {
      // Rollback the transaction in case of failure
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

// Function to get weather data from OpenWeatherMap API
const getWeatherData = async (locationCoordinates) => {
  const redisClient = redis.createClient({
    legacyMode: true,
  });
  await redisClient.connect();
  const { lat, lng } = locationCoordinates.rows[0];
  const cacheKey = `${lat}-${lng}`;

  //logger
  logger.info("Defining cache key", {
    customVars: {
      cacheKey: cacheKey,
    },
  });

  // Check if there is a rate limit key in the cache
  const rateLimitKey = `rate_limit:${cacheKey}`;
  const rateLimitCount = (await getFromCache(rateLimitKey, redisClient)) || 0;

  //logger
  logger.info("Current Rate Limit Count", {
    customVars: {
      current_rate_limit: rateLimitCount,
    },
  });

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
  const weatherApiUrl = `${WEATHER_API_URL}/current.json?q=${lat},${lng}&key=${apiKey}`;

  //logger
  logger.info("APT HIT TO GET WEATHER DATA", {
    customVars: {
      WEATHER_API_URL: weatherApiUrl,
    },
  });

  try {
    // Increment the rate limit count
    await setToCache(
      rateLimitKey,
      rateLimitCount + 1,
      REQUEST_INTERVAL,
      redisClient
    );
    // Make a GET request to the OpenWeatherMap API
    const response = await axios.get(weatherApiUrl);

    // Extract weather data from the API response
    const weatherData = response.data;

    await setToCache(cacheKey, weatherData, 30 * 60, redisClient);

    // Return the weather data
    return weatherData;
  } catch (error) {
    //logger
    logger.info(String(error));
    console.log(String(error));

    // Throw the error to be caught by the calling function
    throw error;
  }
};
