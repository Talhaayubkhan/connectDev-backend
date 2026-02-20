const express = require("express");
const router = express.Router();
const { isAuthCheck } = require("../middlewares/auth");
const {
  showAllReceivedRequests,
  showAllAcceptedRequests,
} = require("../controllers/userController");

router.get("/user/requests/received", isAuthCheck, showAllReceivedRequests);
router.get("/user/connections", isAuthCheck, showAllAcceptedRequests);
module.exports = router;
