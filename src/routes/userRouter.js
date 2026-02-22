const express = require("express");
const router = express.Router();
const { isAuthCheck } = require("../middlewares/auth");
const {
  showAllReceivedRequests,
  showAllAcceptedRequests,
  feed,
} = require("../controllers/userController");

router.get("/user/requests/received", isAuthCheck, showAllReceivedRequests);
router.get("/user/connections", isAuthCheck, showAllAcceptedRequests);
router.get("/user/feed", isAuthCheck, feed);
module.exports = router;
