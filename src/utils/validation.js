const validator = require("validator");
const mongoose = require("mongoose");
const { ValidationError } = require("./errors");
const { COMMON_PASSWORDS, PASSWORD_RULES } = require("./constants");

// ================= COMMON HELPERS =================

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const requireObjectId = (id, fieldName = "ID") => {
  if (!id || !isValidObjectId(id)) {
    throw new ValidationError(`Invalid ${fieldName}`);
  }
};

// ================= PASSWORD CORE =================

const validatePasswordCore = (password) => {
  if (!validator.isStrongPassword(password, PASSWORD_RULES)) {
    throw new ValidationError(
      "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character",
    );
  }

  if (COMMON_PASSWORDS instanceof Set && COMMON_PASSWORDS.has(password)) {
    throw new ValidationError(
      "Password is too common. Please choose a stronger password.",
    );
  }
};

const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword || password !== confirmPassword) {
    throw new ValidationError("Passwords do not match");
  }
};

// ================= AUTH VALIDATIONS =================

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

  validatePasswordCore(password);
  validatePasswordMatch(password, confirmPassword);

  return { firstName, lastName, email, password };
};

// ================= PROFILE VALIDATION =================

const validateProfileData = (data) => {
  const ALLOWED_FIELDS = [
    "firstName",
    "lastName",
    "gender",
    "age",
    "about",
    "skills",
    "photoURL",
    "location",
    "occupation",
  ];

  const invalidFields = Object.keys(data).filter(
    (f) => !ALLOWED_FIELDS.includes(f),
  );

  if (invalidFields.length > 0) {
    throw new ValidationError(`Invalid fields: ${invalidFields.join(", ")}`);
  }

  if (data.firstName !== undefined) {
    if (!data.firstName?.trim()) {
      throw new ValidationError("First name cannot be empty");
    }

    data.firstName = data.firstName.trim();

    if (!validator.isLength(data.firstName, { min: 2, max: 50 })) {
      throw new ValidationError("First name must be 2-50 characters");
    }
  }

  if (data.lastName !== undefined) {
    if (!data.lastName?.trim()) {
      throw new ValidationError("Last name cannot be empty");
    }

    data.lastName = data.lastName.trim();

    if (!validator.isLength(data.lastName, { min: 2, max: 50 })) {
      throw new ValidationError("Last name must be 2-50 characters");
    }
  }

  if (data.skills !== undefined) {
    if (!Array.isArray(data.skills)) {
      throw new ValidationError("Skills must be an array");
    }

    const cleaned = data.skills
      .filter((s) => typeof s === "string")
      .map((s) => s.trim())
      .filter(Boolean);

    if (cleaned.some((s) => s.length < 2)) {
      throw new ValidationError("Each skill must be at least 2 characters");
    }

    data.skills = [...new Set(cleaned)];
  }

  if (data.location !== undefined) {
    if (typeof data.location === "string") {
      data.location = data.location.trim();

      if (
        data.location.length > 0 &&
        !validator.isLength(data.location, { min: 2, max: 100 })
      ) {
        throw new ValidationError("Location must be 2-100 characters");
      }
    }
  }

  if (data.occupation !== undefined) {
    if (typeof data.occupation === "string") {
      data.occupation = data.occupation.trim();

      if (
        data.occupation.length > 0 &&
        !validator.isLength(data.occupation, { min: 2, max: 100 })
      ) {
        throw new ValidationError("Occupation must be 2-100 characters");
      }
    }
  }

  if (data.age !== undefined) {
    const age = Number(data.age);

    if (data.age !== "" && (isNaN(age) || age < 18 || age > 120)) {
      throw new ValidationError("Age must be between 18 and 120");
    }

    data.age = isNaN(age) ? undefined : age;
  }

  return data;
};

// ================= PASSWORD FLOW =================

const validatePasswordChange = (oldPassword, newPassword, confirmPassword) => {
  if (!oldPassword) {
    throw new ValidationError("Current password is required");
  }

  if (!newPassword || !confirmPassword) {
    throw new ValidationError("New password and confirmation are required");
  }

  validatePasswordCore(newPassword);
  validatePasswordMatch(newPassword, confirmPassword);

  return true;
};

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

const validateResetToken = (token) => {
  if (!token || typeof token !== "string") {
    throw new ValidationError("Reset token is required");
  }

  const hexRegex = /^[a-f0-9]{64}$/i;

  if (!hexRegex.test(token)) {
    throw new ValidationError("Invalid token format");
  }

  return token;
};

const validateResetPassword = (newPassword, confirmPassword) => {
  if (!newPassword || !confirmPassword) {
    throw new ValidationError("Both password fields are required");
  }

  validatePasswordCore(newPassword);
  validatePasswordMatch(newPassword, confirmPassword);

  return newPassword;
};

// ================= CHAT VALIDATIONS =================

const validateChatAccess = (userId, targetUserId) => {
  requireObjectId(userId, "User ID");
  requireObjectId(targetUserId, "Target User ID");

  if (userId.toString() === targetUserId.toString()) {
    throw new ValidationError("Cannot chat with yourself");
  }
};

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

// ================= EXPORTS =================

module.exports = {
  isValidObjectId,
  requireObjectId,

  validateSignupData,
  validateProfileData,

  validatePasswordChange,
  validateForgotPasswordEmail,
  validateResetToken,
  validateResetPassword,

  validateChatAccess,
  validateMessagePagination,
  validateSendMessage,
};
