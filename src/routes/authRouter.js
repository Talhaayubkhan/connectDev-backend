const express = require("express");
const router = express.Router();
const {
  userSignUp,
  userLogin,
  userLogout,
} = require("../controllers/authController");
// const { isAuthCheck } = require("../middlewares/auth");

router.post("/signup", userSignUp);
router.post("/login", userLogin);
router.post("/logout", userLogout);

module.exports = router;
