const mongoose = require("mongoose");
const validator = require("validator");
const { COMMON_PASSWORDS, PASSWORD_RULES } = require("./constants");
const { ValidationError } = require("./errors");

const PROFILE_FIELDS = new Set([
  "firstName",
  "lastName",
  "gender",
  "age",
  "about",
  "skills",
  "photoURL",
  "location",
  "occupation",
]);

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const requireObjectId = (id, fieldName = "ID") => {
  if (!id || !isValidObjectId(id)) {
    throw new ValidationError(`Invalid ${fieldName}.`);
  }
  return id;
};

const validatePasswordCore = (password) => {
  if (
    typeof password !== "string" ||
    !validator.isStrongPassword(password, PASSWORD_RULES)
  ) {
    throw new ValidationError(
      "Password must be at least 8 characters with 1 uppercase, 1 lowercase, 1 number, and 1 special character.",
    );
  }

  if (COMMON_PASSWORDS.has(password.toLowerCase())) {
    throw new ValidationError(
      "Password is too common. Please choose a stronger password.",
    );
  }
};

const validateNewPassword = (password) => {
  // WHY: silently trimming changes the user's secret and breaks later login attempts.
  if (typeof password !== "string" || password.length === 0) {
    throw new ValidationError("Password is required.");
  }
  validatePasswordCore(password);
  return password;
};

const validatePasswordMatch = (password, confirmPassword) => {
  if (typeof confirmPassword !== "string" || password !== confirmPassword) {
    throw new ValidationError("Passwords do not match.");
  }
};

const validateSignupData = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError("Signup data is required.");
  }

  const firstName =
    typeof data.firstName === "string" ? data.firstName.trim() : "";
  const lastName =
    typeof data.lastName === "string" ? data.lastName.trim() : "";
  const email = validator.normalizeEmail(
    typeof data.email === "string" ? data.email.trim() : "",
  );
  const password = validateNewPassword(data.password);

  if (!validator.isLength(firstName, { min: 2, max: 50 })) {
    throw new ValidationError("First name must be 2-50 characters.");
  }
  if (lastName && !validator.isLength(lastName, { min: 2, max: 50 })) {
    throw new ValidationError("Last name must be 2-50 characters.");
  }
  if (!email || !validator.isEmail(email)) {
    throw new ValidationError("Invalid email address.");
  }

  validatePasswordMatch(password, data.confirmPassword);
  return { firstName, lastName, email, password };
};

const validateLoginInput = (email, password) => {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new ValidationError("Email and password are required.");
  }

  const normalizedEmail = validator.normalizeEmail(email.trim());
  if (!normalizedEmail || !validator.isEmail(normalizedEmail) || !password) {
    throw new ValidationError("Email and password are required.");
  }

  return { normalizedEmail, password };
};

const sanitizeBoundedString = (
  value,
  fieldName,
  { min = 0, max, allowEmpty = true } = {},
) => {
  if (typeof value !== "string") {
    throw new ValidationError(`${fieldName} must be a string.`);
  }

  const sanitized = value.trim();
  if (!sanitized && allowEmpty) return "";
  if (!validator.isLength(sanitized, { min, max })) {
    throw new ValidationError(
      `${fieldName} must be between ${min} and ${max} characters.`,
    );
  }
  return sanitized;
};

const sanitizeSkills = (skills) => {
  if (!Array.isArray(skills)) {
    throw new ValidationError("Skills must be an array.");
  }

  const uniqueSkills = [];
  const seen = new Set();
  for (const value of skills) {
    if (typeof value !== "string") {
      throw new ValidationError("Each skill must be a string.");
    }
    const skill = value.trim();
    if (!validator.isLength(skill, { min: 2, max: 30 })) {
      throw new ValidationError("Each skill must be 2-30 characters.");
    }
    const key = skill.toLocaleLowerCase("en");
    if (!seen.has(key)) {
      seen.add(key);
      uniqueSkills.push(skill);
    }
  }

  if (uniqueSkills.length > 15) {
    throw new ValidationError("Cannot add more than 15 skills.");
  }
  return uniqueSkills;
};

const validateProfileData = (data) => {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new ValidationError("Profile update must be an object.");
  }

  const fields = Object.keys(data);
  if (fields.length === 0) {
    throw new ValidationError("At least one profile field is required.");
  }
  const invalidFields = fields.filter((field) => !PROFILE_FIELDS.has(field));
  if (invalidFields.length) {
    throw new ValidationError(`Invalid fields: ${invalidFields.join(", ")}.`);
  }

  const sanitized = {};
  if (data.firstName !== undefined) {
    sanitized.firstName = sanitizeBoundedString(data.firstName, "First name", {
      min: 2,
      max: 50,
      allowEmpty: false,
    });
  }
  if (data.lastName !== undefined) {
    sanitized.lastName = sanitizeBoundedString(data.lastName, "Last name", {
      min: 2,
      max: 50,
    });
  }
  if (data.gender !== undefined) {
    if (!["male", "female", "other"].includes(data.gender)) {
      throw new ValidationError("Gender must be male, female, or other.");
    }
    sanitized.gender = data.gender;
  }
  if (data.age !== undefined) {
    if (data.age === "" || data.age === null) {
      sanitized.age = undefined;
    } else {
      const age = Number(data.age);
      if (!Number.isInteger(age) || age < 18 || age > 100) {
        throw new ValidationError(
          "Age must be a whole number between 18 and 100.",
        );
      }
      sanitized.age = age;
    }
  }
  if (data.about !== undefined) {
    sanitized.about = sanitizeBoundedString(data.about, "About", { max: 300 });
  }
  if (data.skills !== undefined) {
    sanitized.skills = sanitizeSkills(data.skills);
  }
  if (data.photoURL !== undefined) {
    if (
      typeof data.photoURL !== "string" ||
      !validator.isURL(data.photoURL.trim(), {
        protocols: ["http", "https"],
        require_protocol: true,
      })
    ) {
      throw new ValidationError("Photo URL must be a valid HTTP or HTTPS URL.");
    }
    sanitized.photoURL = data.photoURL.trim();
  }
  if (data.location !== undefined) {
    sanitized.location = sanitizeBoundedString(data.location, "Location", {
      min: 2,
      max: 100,
    });
  }
  if (data.occupation !== undefined) {
    sanitized.occupation = sanitizeBoundedString(
      data.occupation,
      "Occupation",
      { min: 2, max: 100 },
    );
  }

  return sanitized;
};

const validatePasswordChange = (currentPassword, newPassword) => {
  if (typeof currentPassword !== "string" || !currentPassword) {
    throw new ValidationError("Current password is required.");
  }
  return validateNewPassword(newPassword);
};

const validateForgotPasswordEmail = (email) => {
  if (typeof email !== "string") {
    throw new ValidationError("Email is required.");
  }
  const normalizedEmail = validator.normalizeEmail(email.trim());
  if (!normalizedEmail || !validator.isEmail(normalizedEmail)) {
    throw new ValidationError("Invalid email format.");
  }
  return normalizedEmail;
};

const validateResetToken = (token) => {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    throw new ValidationError("Invalid reset token.");
  }
  return token;
};

const validateResetPassword = (newPassword, confirmPassword) => {
  const password = validateNewPassword(newPassword);
  validatePasswordMatch(password, confirmPassword);
  return password;
};

module.exports = {
  isValidObjectId,
  requireObjectId,
  validateForgotPasswordEmail,
  validateLoginInput,
  validateNewPassword,
  validatePasswordChange,
  validateProfileData,
  validateResetPassword,
  validateResetToken,
  validateSignupData,
};
