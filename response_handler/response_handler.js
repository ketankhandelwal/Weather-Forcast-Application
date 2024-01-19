// Define a utility function to format responses
function formatResponse(statusCode, message, data = null) {
    // Create an object with the specified structure
    return {
      status_code: statusCode, // Include the HTTP status code
      message: message, // Include a descriptive message
      data: data, // Include optional data (can be null)
    };
  }
  
  // Export the formatResponse function to be used in other parts of the application
  module.exports = formatResponse;
  