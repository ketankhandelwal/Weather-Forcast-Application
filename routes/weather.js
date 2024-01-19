const express = require("express");
const router = express.Router();

const weather = require("../controllers/weather/weather");

router.get("/getWeatherForcastByID", weather.getWeatherForcastByID);

module.exports = router;
