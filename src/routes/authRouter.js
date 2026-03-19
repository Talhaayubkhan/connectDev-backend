// const express = require("express");
// const router = express.Router();
// const {
//   userSignUp,
//   userLogin,
//   userLogout,
// } = require("../controllers/authController");
// const {
//   loginLimiter,
//   forgotPasswordLimiter,
// } = require("../utils/rateLimiting");

// const {
//   forgotPassword,
//   resetPassword,
// } = require("../controllers/authController");

// router.post("/auth/signup", userSignUp);
// router.post("/auth/login", userLogin);
// router.post("/auth/logout", userLogout);

// router.post("/auth/forgot-password", forgotPasswordLimiter, forgotPassword);
// router.patch("/auth/reset-password", resetPassword);

// module.exports = router;

const express = require("express");
const router = express.Router();
const {
  userSignUp,
  userLogin,
  userLogout,
  forgotPassword,
  resetPassword,
} = require("../controllers/authController");

const {
  loginLimiter,
  forgotPasswordLimiter,
} = require("../utils/rateLimiting");

router.post("/auth/signup", userSignUp);
router.post("/auth/login", userLogin);
router.post("/auth/logout", userLogout);
router.post("/auth/forgot-password", forgotPasswordLimiter, forgotPassword);
router.patch("/auth/reset-password", resetPassword);

module.exports = router;
