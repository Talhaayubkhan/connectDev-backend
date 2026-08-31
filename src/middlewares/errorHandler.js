const {
  ConflictError,
  PayloadTooLargeError,
  ValidationError,
} = require("../utils/errors");

const firstMongooseMessage = (error) =>
  Object.values(error.errors || {}).find((item) => item?.message)?.message ||
  "Invalid input. Please check your data.";

const normalizeError = (error) => {
  if (error.isOperational) return error;
  if (error.type === "entity.parse.failed") {
    return new ValidationError("Malformed JSON body.");
  }
  if (error.type === "entity.too.large") {
    return new PayloadTooLargeError();
  }
  if (error.name === "CastError") {
    return new ValidationError("Invalid resource ID.");
  }
  if (error.name === "ValidationError") {
    return new ValidationError(firstMongooseMessage(error));
  }
  if (error.code === 11000) {
    return new ConflictError("Resource already exists.");
  }

  return error;
};

const errorHandler = (rawError, _req, res, _next) => {
  const error = normalizeError(rawError);
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${rawError.stack || rawError}`);
  }

  // WHY: unexpected messages can expose database, file, or authentication details.
  const message = error.isOperational
    ? error.message
    : "Something went wrong. Please try again.";

  return res.status(statusCode).json({ success: false, message });
};

module.exports = errorHandler;
module.exports.normalizeError = normalizeError;
