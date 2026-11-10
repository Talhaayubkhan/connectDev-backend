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

    if (!user) throw new AuthError("Account not found. Please login again.");

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new AuthError("Session expired. Please login again.");
    }

    const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
    if (!user.lastSeen || user.lastSeen < oneMinuteAgo) {
      user.lastSeen = new Date();
      await User.updateOne(
        { _id: userId },
        { $set: { lastSeen: user.lastSeen } },
      );
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
    next(error);
  }
};

module.exports = { isAuthCheck };
