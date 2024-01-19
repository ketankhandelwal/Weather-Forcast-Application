const getFromCache = async (key, redisClient) => {
  return new Promise((resolve, reject) => {
    redisClient.get(key, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data ? JSON.parse(data) : null);
      }
    });
  });
};

const setToCache = async (key, data, expiration, redisClient) => {
  return new Promise((resolve, reject) => {
    redisClient.setex(key, expiration, JSON.stringify(data), (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

module.exports = {
  setToCache,
  getFromCache,
};
