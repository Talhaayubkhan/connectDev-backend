class AppError extends Error {
  constructor(message, statusCode) {
    super(message);

    this.statusCode = statusCode;

    // WHY this.name?
    // By default all errors show name "Error" in logs.
    // Setting this.name = class name makes logs readable.
    // console.log(new ValidationError()) → "ValidationError: ..."
    this.name = this.constructor.name;

    // WHY isOperational?
    // Separates two types of errors:
    // isOperational = true  → we threw this intentionally (validation fail, auth fail)
    //                         → safe to send message to client
    // isOperational = false → unexpected crash, bug in code
    //                         → send generic "something went wrong" to client
    // Your global error handler can check this flag.
    this.isOperational = true;

    // WHY captureStackTrace?
    // Removes AppError constructor from the stack trace.
    // Stack trace points to where error was THROWN, not where AppError was created.
    // Makes debugging much easier.
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

module.exports = AppError;
