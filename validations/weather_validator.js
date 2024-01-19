const Yup = require("yup");

const getWeatherForcastByID = Yup.object().shape({
  id: Yup.number().required().positive(),
});

module.exports = {
  getWeatherForcastByID,
};
