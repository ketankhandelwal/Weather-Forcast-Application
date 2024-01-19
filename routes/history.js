const express = require("express");
const router = express.Router();

const weather = require("../controllers/history/history");

router.get("/getWeatherHistory", weather.getHistory);

module.exports = router;
