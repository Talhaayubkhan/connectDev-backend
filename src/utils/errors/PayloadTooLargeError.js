const AppError = require("./AppError");

class PayloadTooLargeError extends AppError {
  constructor(message = "Request body is too large.") {
    super(message, 413);
  }
}

module.exports = PayloadTooLargeError;
