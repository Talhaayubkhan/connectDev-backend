const User = require("../models/userSchema");
const jwt = require("jsonwebtoken");

const isAuthCheck = async (req, res, next) => {
  try {
    const token = req.cookies?.token;
    // console.log(token);

    const decoded = await jwt.verify(token, "CONNECTDEV@111");

    // 3. Extract userId from token
    const userId = decoded._id;

    // 4. Find user
    const user = await User.findById(userId);
    // console.log(user);

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
      message: "Invalid or expired token",
    });
  }
};

module.exports = { isAuthCheck };
