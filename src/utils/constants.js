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

// Cookie options shared by login + logout so the browser can reliably set and clear the same cookie.
// Behind the scenes: clearCookie() only removes the cookie if its path / sameSite / secure flags match how it was set.
const isProduction = process.env.NODE_ENV === "production";

// Keep maxAge in line with JWT expiry in userSchema (getSignJWT → expiresIn: "7d").
// If the cookie died sooner than the token, the token would still be "valid" but the browser would stop sending it — confusing when debugging.
const AUTH_TOKEN_COOKIE_MAX_MS = 7 * 24 * 60 * 60 * 1000;

const authTokenCookieOptions = {
  httpOnly: true,
  // JS on the page cannot read this cookie → reduces damage if someone injects malicious script (XSS).
  maxAge: AUTH_TOKEN_COOKIE_MAX_MS,
  path: "/",
  // lax: cookie is sent on top-level navigations to your site; strict would skip some cross-site flows. Both help with CSRF vs no SameSite.
  sameSite: "lax",
  // secure: only send over HTTPS. Must stay false on local http:// dev servers or the browser will refuse to store the cookie.
  secure: isProduction,
};

// constants.js

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
  // Stronger boundary checks: handle non-string payloads safely.
  if (typeof email !== "string" || typeof password !== "string") {
    throw new ValidationError("Email and password are required.");
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
  generateChatRoomId,
  authTokenCookieOptions,
  COMMON_PASSWORDS,
  PASSWORD_RULES,
  buildSafeUser,
  validateLoginInput,
};
