const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");

const isAuthCheck = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    if (!token) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const decoded = await jwt.verify(token, "CONNECTDEV@111");
    // console.log("decoed values ", decoded);

    // 3. Extract userId from token
    const userId = decoded._id;
    // console.log(userId);

    // 4. Find user
    const user = await User.findById(userId);
    // console.log(user);

    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        success: false,
        message: "Session expired. Please login again.",
      });
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid Token",
    });
  }
};

module.exports = { isAuthCheck };
