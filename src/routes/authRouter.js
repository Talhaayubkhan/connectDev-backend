const express = require("express");
const router = express.Router();
const {
  userSignUp,
  userLogin,
  userLogout,
} = require("../controllers/authController");
const {
  loginLimiter,
  forgotPasswordLimiter,
} = require("../utils/rateLimiting");

const {
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

router.post("/auth/signup", userSignUp);
router.post("/auth/login", loginLimiter, userLogin);
router.post("/auth/logout", userLogout);

router.post("/auth/forgot-password", forgotPasswordLimiter, forgotPassword);
router.patch("/auth/reset-password", resetPassword);

module.exports = router;
