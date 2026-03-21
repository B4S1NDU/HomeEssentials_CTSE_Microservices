/**
 * Success response formatter
 */
const successResponse = (data = null, message = 'Success', statusCode = 200) => {
  return {
    success: true,
    statusCode,
    message,
    data,
  };
};

/**
 * Error response formatter
 */
const errorResponse = (error = {}, message = 'Error occurred', statusCode = 500) => {
  return {
    success: false,
    statusCode,
    message,
    error,
  };
};

module.exports = {
  successResponse,
  errorResponse,
};
