const crypto = require("node:crypto");
const User = require("../models/userSchema");
const { ValidationError, NotFoundError } = require("../utils/errors");
const { validateSignupData, validatePassword } = require("../utils/validation");
const sendEmail = require("../utils/email/sendEmail");
const resetPasswordTemplate = require("../utils/email/resetPasswordTemplate");

const signupService = async (userData) => {
  const sanitizedData = {
    firstName: userData.firstName?.trim(),
    lastName: userData.lastName?.trim(),
    email: userData.email?.toLowerCase().trim(),
    password: userData.password,
    confirmPassword: userData.confirmPassword,
  };

  validateSignupData(sanitizedData);
  const { firstName, lastName, email, password } = sanitizedData;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ValidationError("Email already exists!");
  }
  const user = new User({
    firstName,
    lastName,
    email,
    password,
  });
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
  const normalizedEmail = email.trim().toLowerCase();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    throw new ValidationError("Invalid email or password");
  }

  const isMatch = await user.validatePassword(password);

  if (!isMatch) {
    throw new ValidationError("Invalid email or password");
  }

  const token = await user.getSignJWT();

  const safeUser = {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    photoURL: user.photoURL,
    about: user.about,
    age: user.age,
    skils: user.skills,
    gender: user.gender,
    isActive: user.isActive,
  };

  return { user: safeUser, token };
};

const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email });
  // Do not reveal user existence
  if (!user) return;

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;

  await user.save();

  const resetURL = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  const html = resetPasswordTemplate(resetURL);

  await sendEmail(user.email, "Password Reset", html);
};

const resetPasswordService = async (token, newPassword, confirmPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) {
    throw new ValidationError("Invalid or expired token");
  }

  validatePassword(newPassword, confirmPassword);

  user.password = newPassword;

  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;

  // Invalidate existing sessions
  user.tokenVersion += 1;

  await user.save();
};

module.exports = {
  signupService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
};
