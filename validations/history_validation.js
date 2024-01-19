const Yup = require("yup");

const getHistory = Yup.object().shape({
  id: Yup.number().required().positive(),
  timeline: Yup.number().required().min(1).max(3),
});

module.exports = {
  getHistory,
};
