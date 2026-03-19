const express = require("express");
const router = express.Router();
const { isAuthCheck } = require("../middlewares/auth");
const {
  getProfile,
  profileEdit,
  changeProfilePassword,
  getUniqueProfile,
} = require("../controllers/profileController");

router.get("/profile/view", isAuthCheck, getProfile);
router.get("/profile/:userId", isAuthCheck, getUniqueProfile);
router.patch("/profile/edit", isAuthCheck, profileEdit);
router.patch("/profile/changePassword", isAuthCheck, changeProfilePassword);
// router.delete("/profile/me", isAuthCheck, deleteAccountController);

module.exports = router;
