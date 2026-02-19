const User = require("../models/userSchema");
const { validateSignupData } = require("../utils/validation");

const signupService = async (userData) => {
  validateSignupData(userData);
  const { firstName, lastName, email, password } = userData;

  const isExistEmail = await User.findOne({ email });
  if (isExistEmail) throw new Error("Email already exists!");

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
  const user = await User.findOne({ email });

  if (!user) throw new Error("Invalid credentials");

  const isMatch = await user.validatePassword(password);

  if (!isMatch) throw new Error("Invalid credentials");

  const token = await user.getSignJWT();

  return { user, token };
};

module.exports = { signupService, loginService };
