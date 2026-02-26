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
  origin: process.env.FRONTEND_URL, // Frontend URL
  credentials: true, // Allow cookies to be sent
};

module.exports = { SENDER_FIELDS, CORS_OPTIONS };
