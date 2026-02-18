const express = require("express");
const router = express.Router();
const { isAuthCheck } = require("../middlewares/auth");
const {
  getProfile,
  profileUpdate,
} = require("../controllers/profileController");

router.get("/profile", isAuthCheck, getProfile);
router.patch("/profile/:userId", isAuthCheck, profileUpdate);

module.exports = router;
