const jwt = require("jsonwebtoken");
const User = require("../models/userSchema");
const { AuthError } = require("../utils/errors");

const LAST_SEEN_WRITE_INTERVAL_MS = 60 * 1000;

const isAuthCheck = async (req, _res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) throw new AuthError("Please login to access this resource.");

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded._id);

    if (!user) throw new AuthError("Account not found. Please login again.");
    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new AuthError("Session expired. Please login again.");
    }

    const now = new Date();
    const lastSeenAt = user.lastSeen ? new Date(user.lastSeen).getTime() : 0;
    if (now.getTime() - lastSeenAt >= LAST_SEEN_WRITE_INTERVAL_MS) {
      // WHY: throttling avoids a database write on every authenticated request.
      await User.updateOne(
        { _id: user._id },
        { $set: { lastSeen: now } },
      );
      user.lastSeen = now;
    }

    req.user = user;
    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return next(
        new AuthError("Invalid or expired session. Please login again."),
      );
    }
    return next(error);
  }
};

module.exports = { isAuthCheck };
