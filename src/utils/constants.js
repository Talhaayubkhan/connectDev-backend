const crypto = require("node:crypto");
const mongoose = require("mongoose");

const { ValidationError } = require("./errors");

// services/constants.js
const SENDER_FIELDS = [
  "firstName",
  "lastName",
  "photoURL",
  "age",
  "gender",
  "about",
  "skills",
];

const CORS_OPTIONS = {
  // origin: process.env.FRONTEND_URL, // Frontend URL
  origin: "http://localhost:5173", // or your frontend port
  credentials: true, // Allow cookies to be sent
};

const generateChatRoomId = (userId, targetUserId) => {
  return crypto
    .createHash("sha256")
    .update([userId, targetUserId].sort().join("_"))
    .digest("hex");
};

// COMMON HELPERS
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);
const requireObjectId = (id, fieldName = "ID") => {
  if (!id || !isValidObjectId(id)) {
    throw new ValidationError(`Invalid ${fieldName}`);
  }
};

module.exports = {
  SENDER_FIELDS,
  CORS_OPTIONS,
  generateChatRoomId,
  isValidObjectId,
  requireObjectId,
};
