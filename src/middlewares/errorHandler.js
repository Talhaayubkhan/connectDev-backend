const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // WHY log only 500s?
  // 400, 401, 404 = expected errors — no need to log.
  // 500 = unexpected crash — always log with full stack trace.
  // In production you'd send this to a service like Sentry.
  if (statusCode >= 500) {
    console.error(`[${new Date().toISOString()}] ${err.name}: ${err.message}`);
    console.error(err.stack);
  }

  // WHY isOperational check?
  // isOperational = true  → we threw this intentionally (AuthError, ValidationError etc)
  //                       → safe to senad actual message to client
  // isOperational = false → unexpected crash or bug
  //                       → NEVER send internal details to client (security risk)
  //                       → send generic message instead
  const message = err.isOperational
    ? err.message
    : "Something went wrong. Please try again.";

  // WHY return here?
  // Stops function after sending response.
  // Before: next() was called after res.json() — wrong.
  // Response is already sent — next() after it causes "headers already sent" error.
  return res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
