const validator = require("validator");

const validateSignupData = (data) => {
  const { firstName, lastName, email, password } = data;

  if (!firstName || !lastName) {
    throw new Error("First name and last name are required");
  }

  if (!email || !validator.isEmail(email)) {
    throw new Error("Please provide a valid email");
  }

  if (
    !password ||
    !validator.isStrongPassword(password, {
      minLength: 8,
      minLowercase: 1,
      minUppercase: 1,
      minNumbers: 1,
      minSymbols: 0,
    })
  ) {
    throw new Error(
      "Password must be at least 8 characters and include uppercase, lowercase, and a number",
    );
  }

  return true;
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

  // Check allowed fields
  const isEditAllowed = Object.keys(data).every((field) =>
    ALLOWED_FIELDS.includes(field),
  );

  if (!isEditAllowed) {
    throw new Error("Some fields are not allowed to update");
  }

  if (data.photoURL && !validator.isURL(data.photoURL)) {
    throw new Error("Invalid photo URL");
  }

  if (data.about && !validator.isLength(data.about, { min: 25, max: 100 })) {
    throw new Error("About must be between 25 and 100 characters");
  }

  if (data.skills.length < 1 || !data.skills.length > 20) {
    throw new Error("Skills must contain 1 to 20 items");
  }

  if (data.age && !validator.isInt(data.age.toString(), { min: 1, max: 100 })) {
    throw new Error("Age must be valid");
  }

  return true;
};

module.exports = { validateSignupData, validateProfileData };
