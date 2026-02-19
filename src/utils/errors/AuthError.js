const AppError = require("../AppError");

class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(message, 401);
  }
}

module.exports = AuthError;
