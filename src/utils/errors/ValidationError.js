const AppError = require("./AppError");

class ValidationError extends AppError {
  constructor(message = "Invalid input. Please check your data.") {
    super(message, 400);
  }
}

module.exports = ValidationError;
