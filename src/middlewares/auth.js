const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");
const { AuthError, NotFoundError } = require("../utils/errors");

const isAuthCheck = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      throw new AuthError("Please login to access this resource");
    }
    const decoded = await jwt.verify(token, process.env.JWT_SECRET);
    // console.log("decoed values ", decoded);

    // 3. Extract userId from token
    const userId = decoded._id;
    // console.log(userId);

    // 4. Find user
    const user = await User.findById(userId);
    // console.log(user);

    if (decoded.tokenVersion !== user.tokenVersion) {
      throw new AuthError("Session expired. Please login again.");
    }

    if (!user) {
      throw new NotFoundError("User not found");
    }
    // ✅ update lastSeen on every request
    user.lastSeen = new Date();
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = { isAuthCheck };
