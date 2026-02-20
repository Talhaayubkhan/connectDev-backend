const express = require("express");
const router = express.Router();
const {
  sendRequest,
  acceptRequest,
} = require("../controllers/connectionRequestController");
const { isAuthCheck } = require("../middlewares/auth");
const validateStatus = require("../middlewares/statusValidation");

router.post(
  "/request/send/:status/:toUserId",
  isAuthCheck,
  validateStatus(["interested", "ignored"]),
  sendRequest,
);
router.post(
  "/request/review/:status/:requestId",
  isAuthCheck,
  validateStatus(["accepted", "rejected"]),
  acceptRequest,
);
module.exports = router;
