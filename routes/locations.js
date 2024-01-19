const express = require("express");
const router = express.Router();

const locations = require("../controllers/locations/locations");

router.post("/addLocation", locations.addLocation);
router.get("/getAllLocations", locations.getAllLocations);
router.get("/getLocationByID", locations.getLocationByID);
router.put("/updateLocations", locations.updateLocation);
router.delete("/deleteLocation", locations.deleteLocation);

module.exports = router;
