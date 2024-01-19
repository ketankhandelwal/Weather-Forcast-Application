const winston = require("winston");
require("dotenv").config();

const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss", // You can customize the timestamp format
      tz: "local", // Use local timezone
    }),
    winston.format.printf((info) => {
      // Include the custom variables in the log message
      const customVarsString = Object.keys(info.customVars || {})
        .map((key) => `${key}: ${info.customVars[key]}`)
        .join(", ");
      return `${info.timestamp} [${info.level}]: ${
        info.message
      } - CustomVars: ${customVarsString || "None"}`;
    })
  ),

  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "logfile.log" }),
  ],
});

module.exports = logger;
