// Import necessary dependencies and libraries
const locations_validator = require("../../validations/locations_validations");
const formatResponse = require("../../response_handler/response_handler");
const pool = require("../../dbConfig/db");
const logger = require("../../utils/logger");

// Controller function to add a new location
exports.addLocation = async (req, res) => {
  // Establish a database connection
  const client = await pool.connect();

  try {
    // Extract data from the request body
    let { name, lng, lat } = req.body;

    // Validate request parameters using Yup schema
    try {
      await locations_validator.locations.validate({
        name,
        lng,
        lat,
      });
    } catch (validationError) {
      // Return a 400 response if validation fails
      const response = formatResponse(400, String(validationError.errors), []);
      return res.status(400).json(response);
    }

    // Start a database transaction
    await client.query("BEGIN");

    // SQL query to insert or update a location
    const create_location_query = `INSERT INTO locations (name, lat, lng, created_at) VALUES 
    ($1, $2, $3, $4) ON CONFLICT (lat, lng) DO UPDATE 
    SET name = EXCLUDED.name
    RETURNING id, name, lat, lng`;

    // Execute the SQL query to create or update the location
    const create_location_result = await client.query(create_location_query, [
      name,
      lat,
      lng,
      Date.now(),
    ]);

    // Commit the database transaction
    await client.query("COMMIT");

    // Send success response
    if (create_location_result.rowCount) {
      const response = formatResponse(
        200,
        "Location Added Successfully! ",
        create_location_result.rows
      );
      res.status(200).json(response);
    } else {
      // Rollback the transaction in case of failure
      await client.query("ROLLBACK");
      const response = formatResponse(400, "Something went wrong!", []);
      res.status(400).json(response);
    }
  } catch (error) {
    // Handle any errors that occur during the process, log the error, and return a 400 response
    const response = formatResponse(400, error, []);
    res.status(400).json(response);
  } finally {
    // Release the database connection when done
    client.release();
  }
};

// Controller function to get all locations
exports.getAllLocations = async (req, res) => {
  // Establish a database connection
  const client = await pool.connect();

  try {
    // Start a database transaction
    await client.query("BEGIN");

    // SQL query to get all locations
    const get_all_locations_query = `SELECT * FROM locations`;

    // Execute the SQL query to get all locations
    const get_all_locations_result = await client.query(
      get_all_locations_query
    );

    // Commit the database transaction
    await client.query("COMMIT");

    // Send success response
    if (get_all_locations_result?.rowCount || get_all_locations_result?.rows) {
      const response = formatResponse(
        200,
        "Location List Fetched Successfully!",
        get_all_locations_result.rows
      );
      res.status(200).json(response);
    } else {
      // Rollback the transaction in case of failure
      await client.query("ROLLBACK");
      const response = formatResponse(400, "Something went wrong!", []);
      res.status(400).json(response);
    }
  } catch (error) {
    // Handle any errors that occur during the process, log the error, and return a 400 response
    const response = formatResponse(400, error, []);
    res.status(400).json(response);
  } finally {
    // Release the database connection when done
    client.release();
  }
};

// Controller function to get a location by ID
exports.getLocationByID = async (req, res) => {
  // Establish a database connection
  const client = await pool.connect();

  try {
    // Extract parameters from the request query
    let { id } = req.query;

    // Validate request parameters using Yup schema
    try {
      await locations_validator.getLocationByID.validate({
        id,
      });
    } catch (validationError) {
      // Return a 400 response if validation fails
      const response = formatResponse(400, String(validationError.errors), []);
      return res.status(400).json(response);
    }

    // Start a database transaction
    await client.query("BEGIN");

    // SQL query to get a location by ID
    const get_location_byID_query = `SELECT * FROM locations WHERE id = $1`;

    // Execute the SQL query to get a location by ID
    const get_location_byID_result = await client.query(
      get_location_byID_query,
      [id]
    );

    // Commit the database transaction
    await client.query("COMMIT");

    // Send success response
    if (get_location_byID_result.rowCount || get_location_byID_result.rows) {
      const response = formatResponse(
        200,
        "Location Fetched Successfully!",
        get_location_byID_result.rows
      );
      res.status(200).json(response);
    } else {
      // Rollback the transaction in case of failure
      await client.query("ROLLBACK");
      const response = formatResponse(400, "Something went wrong!", []);
      res.status(400).json(response);
    }
  } catch (error) {
    // Handle any errors that occur during the process, log the error, and return a 400 response
    const response = formatResponse(400, String(error), []);
    res.status(400).json(response);
  } finally {
    // Release the database connection when done
    client.release();
  }
};

// Controller function to update a location
exports.updateLocation = async (req, res) => {
  // Establish a database connection
  const client = await pool.connect();

  try {
    // Extract data from the request body
    let { id, name, lat, lng } = req.body;

    // Validate request parameters using Yup schema
    try {
      await locations_validator.updateLocation.validate({
        id,
        name,
        lat,
        lng,
      });
    } catch (validationError) {
      // Return a 400 response if validation fails
      const response = formatResponse(400, String(validationError.errors), []);
      return res.status(400).json(response);
    }

    // Start a database transaction
    await client.query("BEGIN");

    // SQL query to update a location by ID
    const update_location_byID_query = `
    UPDATE locations
    SET
      name = COALESCE($2, name),
      lat = COALESCE($3, lat),
      lng = COALESCE($4, lng),
      updated_at = COALESCE($5, updated_at)
    WHERE id = $1;
  `;

    // Execute the SQL query to update a location by ID
    const update_location_byID_result = await client.query(
      update_location_byID_query,
      [id, name, lat, lng, Date.now()]
    );

    // Commit the database transaction
    await client.query("COMMIT");

    // Send success response
    if (update_location_byID_result.rowCount) {
      const response = formatResponse(
        200,
        "Location Updated Successfully!!",
        update_location_byID_result.rowCount
      );
      res.status(200).json(response);
    } else if (update_location_byID_result.rowCount == 0) {
      const response = formatResponse(200, "Nothing To Update", []);
      res.status(200).json(response);
    } else {
      // Rollback the transaction in case of failure
      await client.query("ROLLBACK");
      const response = formatResponse(400, "Something went wrong!", []);
      res.status(400).json(response);
    }
  } catch (error) {
    // Handle any errors that occur during the process, log the error, and return a 400 response
    const response = formatResponse(400, String(error), []);
    res.status(400).json(response);
  } finally {
    // Release the database connection when done
    client.release();
  }
};

// Controller function to delete a location
exports.deleteLocation = async (req, res) => {
  // Establish a database connection
  const client = await pool.connect();

  try {
    // Extract parameters from the request query
    let { id } = req.query;

    // Validate request parameters using Yup schema
    try {
      await locations_validator.deleteLocation.validate({
        id,
      });
    } catch (validationError) {
      // Return a 400 response if validation fails
      const response = formatResponse(400, String(validationError.errors), []);
      return res.status(400).json(response);
    }

    // Start a database transaction
    await client.query("BEGIN");

    // SQL query to delete a location by ID
    const delete_location_query = `
   DELETE FROM locations WHERE id  = $1
  `;

    // Execute the SQL query to delete a location by ID
    const delete_location_result = await client.query(delete_location_query, [
      id,
    ]);

    // Commit the database transaction
    await client.query("COMMIT");

    // Send success response
    if (delete_location_result.rowCount) {
      const response = formatResponse(
        200,
        "Location Deleted Successfully!!",
        delete_location_result.rowCount
      );
      res.status(200).json(response);
    } else if (delete_location_result.rowCount == 0) {
      const response = formatResponse(200, "Nothing To Delete", []);
      res.status(200).json(response);
    } else {
      // Rollback the transaction in case of failure
      await client.query("ROLLBACK");
      const response = formatResponse(400, "Something went wrong!", []);
      res.status(400).json(response);
    }
  } catch (error) {
    // Handle any errors that occur during the process, log the error, and return a 400 response
    const response = formatResponse(400, String(error), []);
    res.status(400).json(response);
  } finally {
    // Release the database connection when done
    client.release();
  }
};
