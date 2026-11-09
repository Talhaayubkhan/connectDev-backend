const rateLimit = require("express-rate-limit");

const createLimiter = ({ max, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests,
    handler: (_req, res) => {
      res.status(429).json({ success: false, message });
    },
  });

const loginLimiter = createLimiter({
  max: 5,
  message: "Too many login attempts. Please try again later.",
  // WHY: successful users should not be locked out by their own valid logins.
  skipSuccessfulRequests: true,
});

const forgotPasswordLimiter = createLimiter({
  max: 3,
  message: "Too many password reset requests. Please try again later.",
  // WHY: successful reset requests still send email and must count against abuse limits.
  skipSuccessfulRequests: false,
});

module.exports = { forgotPasswordLimiter, loginLimiter };
