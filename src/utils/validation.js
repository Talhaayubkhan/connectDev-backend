// // utils/validators.js
// const validator = require("validator");
// const { ValidationError } = require("./errors");
// const { isValidObjectId, requireObjectId } = require("./constants");

// // PASSWORD RULES

// const PASSWORD_RULES = {
//   minLength: 8,
//   minLowercase: 1,
//   minUppercase: 1,
//   minNumbers: 1,
//   minSymbols: 0,
// };

// // AUTH VALIDATIONS

// const validateSignupData = (data) => {
//   let { firstName, lastName, email, password, confirmPassword } = data;

//   firstName = firstName?.trim();
//   lastName = lastName?.trim();
//   email = validator.normalizeEmail(email?.trim() || "");
//   password = password?.trim();
//   confirmPassword = confirmPassword?.trim();

//   if (!firstName) {
//     throw new ValidationError("First name is required");
//   }

//   if (!validator.isLength(firstName, { min: 2, max: 50 })) {
//     throw new ValidationError("First name must be 2–50 characters");
//   }

//   if (lastName && !validator.isLength(lastName, { min: 2, max: 50 })) {
//     throw new ValidationError("Last name must be 2–50 characters");
//   }

//   if (!email || !validator.isEmail(email)) {
//     throw new ValidationError("Invalid email");
//   }

//   if (!validator.isStrongPassword(password, PASSWORD_RULES)) {
//     throw new ValidationError("Weak password");
//   }

//   if (!confirmPassword || password !== confirmPassword) {
//     throw new ValidationError("Passwords do not match");
//   }

//   return { firstName, lastName, email, password };
// };

// // PROFILE VALIDATION

// const validateProfileData = (data) => {
//   const ALLOWED_FIELDS = [
//     "firstName",
//     "lastName",
//     "gender",
//     "age",
//     "about",
//     "skills",
//     "photoURL",
//   ];

//   if (!Object.keys(data).every((f) => ALLOWED_FIELDS.includes(f))) {
//     throw new ValidationError("Invalid update fields");
//   }

//   if (data.firstName) {
//     data.firstName = data.firstName.trim();
//     if (!validator.isLength(data.firstName, { min: 2, max: 50 })) {
//       throw new ValidationError("Invalid first name");
//     }
//   }

//   if (data.skills) {
//     if (!Array.isArray(data.skills)) {
//       throw new ValidationError("Skills must be array");
//     }

//     const cleaned = data.skills.map((s) => s.trim());

//     if (cleaned.some((s) => s.length < 2)) {
//       throw new ValidationError("Each skill must be at least 2 chars");
//     }

//     data.skills = [...new Set(cleaned)];
//   }

//   return data;
// };

// // PASSWORD CHANGE

// const validatePassword = (oldPassword, newPassword, confirmPassword) => {
//   if (!validator.isStrongPassword(newPassword, PASSWORD_RULES)) {
//     throw new ValidationError("Weak password");
//   }

//   if (!newPassword || newPassword !== confirmPassword) {
//     throw new ValidationError("Passwords do not match");
//   }

//   return true;
// };

// // CHAT VALIDATIONS (NEW)

// // Validate opening chat
// const validateChatAccess = (userId, targetUserId) => {
//   requireObjectId(userId, "User ID");
//   requireObjectId(targetUserId, "Target User ID");

//   if (userId.toString() === targetUserId.toString()) {
//     throw new ValidationError("Cannot chat with yourself");
//   }
// };

// // Validate messages pagination
// const validateMessagePagination = (chatId, page, limit) => {
//   requireObjectId(chatId, "Chat ID");

//   page = parseInt(page);
//   limit = parseInt(limit);

//   if (isNaN(page) || page < 1) {
//     throw new ValidationError("Invalid page");
//   }

//   if (isNaN(limit) || limit < 1 || limit > 50) {
//     throw new ValidationError("Invalid limit");
//   }

//   return { page, limit };
// };

// // Validate sending message
// const validateSendMessage = (chatId, text) => {
//   requireObjectId(chatId, "Chat ID");

//   if (!text || !text.trim()) {
//     throw new ValidationError("Message cannot be empty");
//   }

//   if (!validator.isLength(text, { min: 1, max: 1000 })) {
//     throw new ValidationError("Message must be 1–1000 characters");
//   }

//   return text.trim();
// };

// module.exports = {
//   // common
//   isValidObjectId,
//   requireObjectId,

//   // auth
//   validateSignupData,
//   validateProfileData,
//   validatePassword,

//   // chat
//   validateChatAccess,
//   validateMessagePagination,
//   validateSendMessage,
// };

// utils/validators.js
const validator = require("validator");
const { ValidationError } = require("./errors");
const { isValidObjectId, requireObjectId } = require("./constants");

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

// ========== AUTH VALIDATIONS ==========

const validateSignupData = (data) => {
  let { firstName, lastName, email, password, confirmPassword } = data;

  firstName = firstName?.trim();
  lastName = lastName?.trim();
  email = validator.normalizeEmail(email?.trim() || "");
  password = password?.trim();
  confirmPassword = confirmPassword?.trim();

  if (!firstName) {
    throw new ValidationError("First name is required");
  }

  if (!validator.isLength(firstName, { min: 2, max: 50 })) {
    throw new ValidationError("First name must be 2–50 characters");
  }

  if (lastName && !validator.isLength(lastName, { min: 2, max: 50 })) {
    throw new ValidationError("Last name must be 2–50 characters");
  }

  if (!email || !validator.isEmail(email)) {
    throw new ValidationError("Invalid email");
  }

  if (!validator.isStrongPassword(password, PASSWORD_RULES)) {
    throw new ValidationError(
      "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
    );
  }

  if (COMMON_PASSWORDS.has(password)) {
    throw new ValidationError(
      "Password is too common. Please choose a stronger password.",
    );
  }

  if (!confirmPassword || password !== confirmPassword) {
    throw new ValidationError("Passwords do not match");
  }

  return { firstName, lastName, email, password };
};

// ========== PROFILE VALIDATION ==========

const validateProfileData = (data) => {
  const ALLOWED_FIELDS = [
    "firstName",
    "lastName",
    "gender",
    "age",
    "about",
    "skills",
    "photoURL",
  ];

  if (!Object.keys(data).every((f) => ALLOWED_FIELDS.includes(f))) {
    throw new ValidationError("Invalid update fields");
  }

  if (data.firstName) {
    data.firstName = data.firstName.trim();
    if (!validator.isLength(data.firstName, { min: 2, max: 50 })) {
      throw new ValidationError("Invalid first name");
    }
  }

  if (data.skills) {
    if (!Array.isArray(data.skills)) {
      throw new ValidationError("Skills must be array");
    }

    const cleaned = data.skills.map((s) => s.trim());

    if (cleaned.some((s) => s.length < 2)) {
      throw new ValidationError("Each skill must be at least 2 chars");
    }

    data.skills = [...new Set(cleaned)];
  }

  return data;
};

// ========== PASSWORD FLOW VALIDATIONS ==========

/**
 * Validate password change when user is logged in (requires old password)
 * Used in: changePassword endpoint (when user is authenticated)
 */
const validatePasswordChange = (oldPassword, newPassword, confirmPassword) => {
  if (!oldPassword) {
    throw new ValidationError("Current password is required");
  }

  if (!newPassword || !confirmPassword) {
    throw new ValidationError("New password and confirmation are required");
  }

  if (!validator.isStrongPassword(newPassword, PASSWORD_RULES)) {
    throw new ValidationError(
      "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
    );
  }

  if (COMMON_PASSWORDS.has(newPassword)) {
    throw new ValidationError(
      "Password is too common. Please choose a stronger password.",
    );
  }

  if (newPassword !== confirmPassword) {
    throw new ValidationError("Passwords do not match");
  }

  return true;
};

/**
 * Validate email for forgot-password flow
 * Used in: forgotPassword controller before calling service
 */
const validateForgotPasswordEmail = (email) => {
  if (!email) {
    throw new ValidationError("Email is required");
  }

  const normalizedEmail = validator.normalizeEmail(email.trim());

  if (!validator.isEmail(normalizedEmail)) {
    throw new ValidationError("Invalid email format");
  }

  return normalizedEmail;
};

/**
 * Validate reset token format
 * Used in: resetPassword controller before calling service
 */
const validateResetToken = (token) => {
  if (!token || typeof token !== "string") {
    throw new ValidationError("Reset token is required");
  }

  // Token is 64 character hex string (32 bytes of random → 64 hex chars)
  const hexRegex = /^[a-f0-9]{64}$/i;
  if (!hexRegex.test(token)) {
    throw new ValidationError("Invalid token format");
  }

  return token;
};

/**
 * Validate password for reset-password flow (no old password required)
 * Used in: resetPasswordService
 */
const validateResetPassword = (newPassword, confirmPassword) => {
  if (!newPassword || !confirmPassword) {
    throw new ValidationError("Both password fields are required");
  }

  if (!validator.isStrongPassword(newPassword, PASSWORD_RULES)) {
    throw new ValidationError(
      "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
    );
  }

  if (COMMON_PASSWORDS.has(newPassword)) {
    throw new ValidationError(
      "Password is too common. Please choose a stronger password.",
    );
  }

  if (newPassword !== confirmPassword) {
    throw new ValidationError("Passwords do not match");
  }

  return newPassword;
};

// ========== CHAT VALIDATIONS ==========

// Validate opening chat
const validateChatAccess = (userId, targetUserId) => {
  requireObjectId(userId, "User ID");
  requireObjectId(targetUserId, "Target User ID");

  if (userId.toString() === targetUserId.toString()) {
    throw new ValidationError("Cannot chat with yourself");
  }
};

// Validate messages pagination
const validateMessagePagination = (chatId, page, limit) => {
  requireObjectId(chatId, "Chat ID");

  page = parseInt(page);
  limit = parseInt(limit);

  if (isNaN(page) || page < 1) {
    throw new ValidationError("Invalid page");
  }

  if (isNaN(limit) || limit < 1 || limit > 50) {
    throw new ValidationError("Invalid limit");
  }

  return { page, limit };
};

// Validate sending message
const validateSendMessage = (chatId, text) => {
  requireObjectId(chatId, "Chat ID");

  if (!text || !text.trim()) {
    throw new ValidationError("Message cannot be empty");
  }

  if (!validator.isLength(text, { min: 1, max: 1000 })) {
    throw new ValidationError("Message must be 1–1000 characters");
  }

  return text.trim();
};

// ========== EXPORTS ==========

module.exports = {
  // common
  isValidObjectId,
  requireObjectId,

  // auth - signup/profile
  validateSignupData,
  validateProfileData,

  // auth - password flows
  validatePasswordChange, // RENAMED: was validatePassword
  validateForgotPasswordEmail, // NEW
  validateResetToken, // NEW
  validateResetPassword, // NEW

  // chat
  validateChatAccess,
  validateMessagePagination,
  validateSendMessage,
};
