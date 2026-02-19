const express = require("express");
const router = express.Router();
const { sendRequest } = require("../controllers/connectionRequestController");
const { isAuthCheck } = require("../middlewares/auth");

router.post("/request/send/:status/:toUserId", isAuthCheck, sendRequest);
module.exports = router;
