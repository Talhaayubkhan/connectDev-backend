const crypto = require("node:crypto");

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

// PASSWORD RULES
const PASSWORD_RULES = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1, // UPDATED: Changed from 0 to 1 - require special character
};

// Common password blacklist
const COMMON_PASSWORDS = new Set([
  "Password123!",
  "Admin123!",
  "Qwerty123!",
  "Welcome123!",
  "Pass@123",
  "Test@1234",
  "User@123",
  "Login123!",
]);

module.exports = {
  SENDER_FIELDS,
  CORS_OPTIONS,
  generateChatRoomId,
  COMMON_PASSWORDS,
  PASSWORD_RULES,
};
