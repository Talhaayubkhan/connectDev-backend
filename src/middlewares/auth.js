// const User = require("../models/userSchema");
// const jwt = require("jsonwebtoken");
// const { AuthError, NotFoundError } = require("../utils/errors");

// const isAuthCheck = async (req, res, next) => {
//   try {
//     const token = req.cookies?.token;
//     if (!token) {
//       throw new AuthError("Please login to access this resource");
//     }
//     const decoded = await jwt.verify(token, process.env.JWT_SECRET);
//     // console.log("decoed values ", decoded);

//     // 3. Extract userId from token
//     const userId = decoded._id;
//     // console.log(userId);

//     // 4. Find user
//     const user = await User.findById(userId);
//     // console.log(user);

//     if (decoded.tokenVersion !== user.tokenVersion) {
//       throw new AuthError("Session expired. Please login again.");
//     }

//     if (!user) {
//       throw new NotFoundError("User not found");
//     }
//     // ✅ update lastSeen on every request
//     user.lastSeen = new Date();
//     req.user = user;
//     next();
//   } catch (error) {
//     next(error);
//   }
// };

// module.exports = { isAuthCheck };

// ─────────────────────────────────────────────────────────
// FILE 1: middlewares/auth.js
// ─────────────────────────────────────────────────────────
const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");
const { AuthError } = require("../utils/errors");

const isAuthCheck = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) throw new AuthError("Please login to access this resource.");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded._id;

    const user = await User.findById(userId);

    // WHY check user exists BEFORE tokenVersion?
    // Before: tokenVersion check came first — if user is null,
    // decoded.tokenVersion !== null.tokenVersion crashes the server.
    // Always verify resource exists before accessing its properties.
    if (!user) throw new AuthError("Account not found. Please login again.");

    // WHY AuthError not NotFoundError for missing user?
    // If token exists but user doesn't = account deleted or tampered token.
    // This is an auth problem, not a "resource not found" problem.
    // Frontend handles 401 by redirecting to login — correct behavior.
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new AuthError("Session expired. Please login again.");
    }

    // WHY throttle lastSeen updates?
    // Before: user.lastSeen was set but never saved — useless.
    // Saving on EVERY request = DB write on every API call = expensive.
    // Only update if lastSeen is older than 1 minute — good balance.
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (!user.lastSeen || user.lastSeen < oneMinuteAgo) {
      user.lastSeen = new Date();
      user.isActive = true;
      // WHY save only updated fields?
      // user.save() re-validates and saves entire document.
      // updateOne only touches lastSeen + isActive — faster, safer.
      await User.updateOne(
        { _id: userId },
        { lastSeen: user.lastSeen, isActive: true },
      );
    }

    req.user = user;
    next();
  } catch (error) {
    // WHY handle JWT errors specifically?
    // jwt.verify throws its own error types — JsonWebTokenError, TokenExpiredError.
    // These are not instances of AppError so isOperational is undefined.
    // We catch them and convert to AuthError so errorHandler handles them correctly.
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return next(
        new AuthError("Invalid or expired session. Please login again."),
      );
    }
    next(error);
  }
};

module.exports = { isAuthCheck };
