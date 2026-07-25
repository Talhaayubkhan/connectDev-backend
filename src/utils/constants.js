const crypto = require("node:crypto");
// ADDED: this import was missing. validateLoginInput() throws
// "new ValidationError(...)" below, but nothing imported ValidationError
// into this file — that would throw "ValidationError is not defined"
// (a ReferenceError) the first time someone submits a bad login,
// which then gets caught as an unexpected 500 instead of a clean 400.
const { ValidationError } = require("./errors");

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
  // CHANGED: use the env var when set, fall back to localhost for dev.
  // Before, this was hardcoded to localhost — meaning your deployed
  // production backend would still only accept requests from
  // localhost:5173, silently blocking your real frontend with a CORS error.
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  credentials: true, // Allow cookies to be sent
};

const isProduction = process.env.NODE_ENV === "production";

const AUTH_TOKEN_COOKIE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

const authTokenCookieOptions = {
  httpOnly: true,
  maxAge: AUTH_TOKEN_COOKIE_MAX_MS,
  path: "/",
  sameSite: "lax",
  secure: isProduction,
};

const COMMON_PASSWORDS = new Set([
  "123456",
  "password",
  "123456789",
  "qwerty",
  "abc123",
  "password123",
]);

const PASSWORD_RULES = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

const buildSafeUser = (user) => ({
  id: user._id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  photoURL: user.photoURL,
  gender: user.gender,
  age: user.age,
  skills: user.skills,
  about: user.about,
  location: user.location,
  occupation: user.occupation,
  isActive: user.isActive,
  createdAt: user.createdAt,
});

const validateLoginInput = (email, password) => {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new ValidationError("Email and password are required."); // now works correctly
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedPassword = password.trim();

  if (!normalizedEmail || !normalizedPassword) {
    throw new ValidationError("Email and password are required.");
  }

  return { normalizedEmail, normalizedPassword };
};

module.exports = {
  SENDER_FIELDS,
  CORS_OPTIONS,
  authTokenCookieOptions,
  COMMON_PASSWORDS,
  PASSWORD_RULES,
  buildSafeUser,
  validateLoginInput,
  // REMOVED: generateChatRoomId — only used by the now-removed socket.js.
  // Dead exports are confusing; if nothing imports it, don't export it.
};
