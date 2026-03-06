const AppError = require("./AppError");

class AuthError extends AppError {
  constructor(message = "Unauthorized. Please login.") {
    super(message, 401);
  }
}

module.exports = AuthError;
