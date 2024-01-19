const redis = require("redis");
const formatResponse = require("../../response_handler/response_handler");
const { sendEmail } = require("../../utils/helperFunctions");

const cacheMiddleware = async (req, res, next) => {
  let redisClient;
  if (process.env.NODE_ENV == "local") {
    redisClient = redis.createClient({
      socket: {
        host: "127.0.0.1",
        port: 6379,
      },
      legacyMode: true,
    });
  } else {
    redisClient = redis.createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: 6379,
      },
      legacyMode: true,
    });
  }

  await redisClient.connect();
  const queryKey = process.env.redisQueryKey;

  redisClient.get(queryKey, async (err, data) => {
    if (err) {
      sendEmail(err);
      await redisClient.disconnect();
      throw err;
    }

    if (data !== null) {
      await redisClient.disconnect();
      const response = formatResponse(
        200,
        "Dashboard Data Fetched Successfully",
        JSON.parse(data)
      );
      res.send(response);
    } else {
      next();
      await redisClient.disconnect();
    }
  });
};
module.exports = cacheMiddleware;
