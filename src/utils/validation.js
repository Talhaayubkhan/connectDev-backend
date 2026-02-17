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

module.exports = { validateSignupData };
