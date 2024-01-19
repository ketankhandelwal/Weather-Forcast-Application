// Import the Pool class from the "pg" library for managing database connections
const { Pool } = require("pg");

// Import the "dotenv" library to read environment variables from a .env file
require("dotenv").config();

// Create a new PostgreSQL database connection pool using the provided configuration
const pool = new Pool({
  // Read the PostgreSQL data from  environment variable
  user: process.env.DB_USER,

  host: process.env.DB_HOST,

  database: process.env.DB_DATABASE,

  password: process.env.DB_PASSWORD,

  port: process.env.DB_PORT,

  // Set binary to false (you can customize this as needed)
  binary: false,

  // Configure the maximum number of clients the pool should contain
  max: 200,

  // Configure the maximum time (in milliseconds) a client can remain idle in the pool
  idleTimeoutMillis: 1000,
});

// Export the created database connection pool to be used in other parts of the application
module.exports = pool;
