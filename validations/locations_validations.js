const Yup = require("yup");

const locations = Yup.object().shape({
  lat: Yup.number().required().min(-90).max(90),
  lng: Yup.number().required().min(-180).max(180),
  name: Yup.string().required(),
});

const getLocationByID = Yup.object().shape({
  id: Yup.number().min(1).required(),
});

const updateLocation = Yup.object().shape({
  id: Yup.number().required().min(1),
  name: Yup.string().optional(),
  lat: Yup.number().min(-90).max(90).optional(),
  lng: Yup.number().min(-180).max(180).optional(),
});

const deleteLocation = Yup.object().shape({
  id: Yup.number().positive().required()
})

module.exports = {
  locations,
  getLocationByID,
  updateLocation,
  deleteLocation
};
