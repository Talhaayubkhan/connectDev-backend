const crypto = require("node:crypto");
const User = require("../models/userSchema");
const { ValidationError, ConflictError } = require("../utils/errors");
const {
  validateSignupData,
  validateLoginInput,
  validateNewPassword,
  validateResetToken,
} = require("../utils/validation");
const { getRuntimeConfig } = require("../config/env");
const sendEmail = require("../utils/email/sendEmail");
const resetPasswordTemplate = require("../utils/email/resetPasswordTemplate");
const { serializeUser } = require("../utils/userSerializer");
const signupService = async (userData) => {
  const { firstName, lastName, email, password } = validateSignupData(userData);

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ConflictError("Email already registered.");

  const user = new User({ firstName, lastName, email, password });
  await user.save();

  return serializeUser(user, { includeEmail: true });
};

const loginService = async (email, password) => {
  const { normalizedEmail, password: validatedPassword } = validateLoginInput(
    email,
    password,
  );
  const user = await User.findOne({ email: normalizedEmail });

  // WHY: one message prevents account discovery through login responses.
  if (!user) throw new ValidationError("Invalid email or password.");

  const isMatch = await user.validatePassword(validatedPassword);
  if (!isMatch) throw new ValidationError("Invalid email or password.");

  const token = await user.getSignJWT();

  const safeUser = serializeUser(user, { includeEmail: true });

  return { user: safeUser, token };
};

const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email });
  // WHY: silent success prevents password reset from becoming an account lookup.
  if (!user) return;

  if (user.resetPasswordExpires && user.resetPasswordExpires > Date.now()) {
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  const { frontendOrigins } = getRuntimeConfig();
  const resetURL = `${frontendOrigins[0]}/auth/reset-password?token=${token}`;

  try {
    await sendEmail(user.email, "Reset your password", {
      text: `Reset your password: ${resetURL}`,
      html: resetPasswordTemplate(resetURL),
    });
  } catch (error) {
    // WHY: failed delivery must not block another reset attempt for 15 minutes.
    await User.updateOne(
      { _id: user._id, resetPasswordToken: hashedToken },
      { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } },
    );
    throw error;
  }
};

const resetPasswordService = async (token, newPassword) => {
  validateResetToken(token);
  validateNewPassword(newPassword);

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  // WHY: one message avoids revealing whether a token existed but expired.
  if (!user) throw new ValidationError("Reset link is invalid or has expired.");

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();
};

module.exports = {
  signupService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
};
