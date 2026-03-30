// const validator = require("validator");
// const { ValidationError } = require("./errors");

// const validateSignupData = (data) => {
//   let { firstName, lastName, email, password, confirmPassword } = data;

//   firstName = firstName?.trim();
//   lastName = lastName?.trim();
//   email = email?.trim().toLowerCase();
//   password = password?.trim();
//   confirmPassword = confirmPassword?.trim();

//   if (!firstName || !validator.isLength(firstName, { min: 2, max: 50 })) {
//     throw new ValidationError("First name must be between 2 and 50 characters");
//   }

//   if (lastName && !validator.isLength(lastName, { min: 2, max: 50 })) {
//     throw new ValidationError("Last name must be between 2 and 50 characters");
//   }

//   if (!email || !validator.isEmail(email)) {
//     throw new ValidationError("Please provide a valid email");
//   }

//   if (
//     !password ||
//     !validator.isStrongPassword(password, {
//       minLength: 8,
//       minLowercase: 1,
//       minUppercase: 1,
//       minNumbers: 1,
//       minSymbols: 0,
//     })
//   ) {
//     throw new ValidationError(
//       "Password must be at least 8 characters with uppercase and number",
//     );
//   }

//   if (!confirmPassword || password !== confirmPassword) {
//     throw new ValidationError("Passwords do not match");
//   }

//   return true;
// };

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

//   const isEditAllowed = Object.keys(data).every((field) =>
//     ALLOWED_FIELDS.includes(field),
//   );

//   if (!isEditAllowed) {
//     throw new ValidationError("Some fields are not allowed to update");
//   }

//   if (
//     data.firstName &&
//     !validator.isLength(data.firstName.trim(), { min: 2, max: 50 })
//   ) {
//     throw new ValidationError("First name must be between 2 and 50 characters");
//   }

//   if (
//     data.lastName &&
//     !validator.isLength(data.lastName.trim(), { min: 2, max: 50 })
//   ) {
//     throw new ValidationError("Last name must be between 2 and 50 characters");
//   }

//   if (data.photoURL && !validator.isURL(data.photoURL)) {
//     throw new ValidationError("Invalid photo URL");
//   }

//   if (data.about && !validator.isLength(data.about, { min: 25, max: 300 })) {
//     throw new ValidationError("About must be between 25 and 300 characters");
//   }

//   if (data.skills !== undefined) {
//     if (!Array.isArray(data.skills)) {
//       throw new ValidationError("Skills must be an array");
//     }
//     if (data.skills.length > 20) {
//       throw new ValidationError("Skills cannot exceed 20 items");
//     }
//   }

//   if (
//     data.age &&
//     !validator.isInt(data.age.toString(), { min: 18, max: 100 })
//   ) {
//     throw new ValidationError("Age must be between 18 and 100");
//   }

//   return true;
// };

// const validatePassword = (password, newPassword, confirmPassword) => {
//   if (
//     !validator.isStrongPassword(password, {
//       minLength: 8,
//       minLowercase: 1,
//       minUppercase: 1,
//       minNumbers: 1,
//       minSymbols: 0,
//     })
//   ) {
//     throw new ValidationError("Password too weak");
//   }
//   if (!newPassword && confirmPassword !== newPassword) {
//     throw new ValidationError("Passwords do not match");
//   }

//   return true;
// };

// module.exports = { validateSignupData, validateProfileData, validatePassword };

const validator = require("validator");
const { ValidationError } = require("./errors");

const PASSWORD_RULES = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 0,
};

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
    throw new ValidationError("Weak password");
  }

  if (!confirmPassword || password !== confirmPassword) {
    throw new ValidationError("Passwords do not match");
  }

  return { firstName, lastName, email, password };
};

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

const validatePassword = (oldPassword, newPassword, confirmPassword) => {
  if (!validator.isStrongPassword(newPassword, PASSWORD_RULES)) {
    throw new ValidationError("Weak password");
  }

  if (!newPassword || newPassword !== confirmPassword) {
    throw new ValidationError("Passwords do not match");
  }

  return true;
};

module.exports = {
  validateSignupData,
  validateProfileData,
  validatePassword,
};
