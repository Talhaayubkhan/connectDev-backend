const express = require("express");
const router = express.Router();
const {
  userSignUp,
  userLogin,
  userLogout,
} = require("../controllers/authController");
const loginLimiter = require("../utils/rateLimiting");

router.post("/signup", userSignUp);
router.post("/login", loginLimiter, userLogin);
router.post("/logout", userLogout);

module.exports = router;
