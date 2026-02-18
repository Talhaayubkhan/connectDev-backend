const express = require("express");
const router = express.Router();
const { isAuthCheck } = require("../middlewares/auth");
const {
  getProfile,
  profileEdit,
  changePassword,
} = require("../controllers/profileController");

router.get("/profile/view", isAuthCheck, getProfile);
router.patch("/profile/edit", isAuthCheck, profileEdit);
router.patch("/profile/changePassword", isAuthCheck, changePassword);

module.exports = router;
