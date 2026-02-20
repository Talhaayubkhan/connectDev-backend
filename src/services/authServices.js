const User = require("../models/userSchema");
const { ValidationError, NotFoundError } = require("../utils/errors");
const { validateSignupData } = require("../utils/validation");

const signupService = async (userData) => {
  const sanitizedData = {
    firstName: userData.firstName?.trim(),
    lastName: userData.lastName?.trim(),
    email: userData.email?.toLowerCase().trim(),
    password: userData.password,
  };

  validateSignupData(sanitizedData);
  const { firstName, lastName, email, password } = sanitizedData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ValidationError("Email already exists!");
  }
  const user = new User({ firstName, lastName, email, password });
  await user.save();

  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
};
const loginService = async (email, password) => {
  if (!email || !password) {
    throw new ValidationError("Email and password are required");
  }

  const user = await User.findOne({ email: email.toLowerCase() });
  const isMatch = await user.validatePassword(password);

  if (!user || !isMatch) {
    throw new ValidationError("Invalid email or password");
  }
  const token = await user.getSignJWT();

  return { user, token };
};

module.exports = { signupService, loginService };
