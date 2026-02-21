const crypto = require("node:crypto");
const User = require("../models/userSchema");
const { ValidationError, NotFoundError } = require("../utils/errors");
const { validateSignupData, validatePassword } = require("../utils/validation");
const sendEmail = require("../utils/sendEmail");

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
  };

  return { user: safeUser, token };
};

const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw new NotFoundError("User not found");

  // Generate secure random token
  const token = crypto.randomBytes(32).toString("hex");
  console.log("get the main token", token);

  // Hash token before saving for security
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Save hashed token + expiry
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await user.save();

  // Build reset link containing original token
  const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
  const message = `Click to reset password: ${resetURL}`;

  await sendEmail(user.email, "Password Reset", message);
};
const resetPasswordService = async (token, newPassword) => {
  // Hash incoming token
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  // Find user with valid token and not expired
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  if (!user) throw new Error("Invalid or expired token");

  validatePassword(newPassword);

  // Update password
  user.password = newPassword;

  // Remove reset fields
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
