const crypto = require("node:crypto");
const User = require("../models/userSchema");
const { ValidationError, ConflictError } = require("../utils/errors");
const {
  validateSignupData,
  validateResetPassword,
} = require("../utils/validation");
const sendEmail = require("../utils/email/sendEmail");
const resetPasswordTemplate = require("../utils/email/resetPasswordTemplate");
const { validateLoginInput, buildSafeUser } = require("../utils/constants");
const signupService = async (userData) => {
  // validateSignupData throws ValidationError if input is bad; we don't duplicate those checks here.
  const { firstName, lastName, email, password } = validateSignupData(userData);

  const existingUser = await User.findOne({ email });
  if (existingUser) throw new ConflictError("Email already registered.");

  const user = new User({ firstName, lastName, email, password });
  await user.save();

  // Return only safe, public fields — never send password hash or internal flags to the client.
  return {
    id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  };
};

const loginService = async (email, password) => {
  // Keep normalization + validation in one place for easier maintenance.
  const { normalizedEmail, normalizedPassword } = validateLoginInput(
    email,
    password,
  );
  const user = await User.findOne({ email: normalizedEmail });

  // WHY same message for both cases?
  // Security: don't reveal whether email exists
  if (!user) throw new ValidationError("Invalid email or password.");

  const isMatch = await user.validatePassword(normalizedPassword);
  if (!isMatch) throw new ValidationError("Invalid email or password.");

  const token = await user.getSignJWT();

  // Single serializer avoids drift of API response fields across auth flows.
  const safeUser = buildSafeUser(user);

  return { user: safeUser, token };
};

const forgotPasswordService = async (email) => {
  // Email is already normalized in the controller (validateForgotPasswordEmail). Same string shape as in the DB.
  const user = await User.findOne({ email });
  // WHY return silently?
  // Don't reveal whether email exists — security best practice
  if (!user) return;

  if (user.resetPasswordExpires && user.resetPasswordExpires > Date.now()) {
    // Security hardening: always return success from this flow so attackers cannot
    // infer account existence/timing behavior by observing different responses.
    return;
  }

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  // WHY query param not path param?
  // Frontend uses useSearchParams() — reads ?token=...
  // Path param (/reset-password/:token) would cause 404
  const resetURL = `${process.env.FRONTEND_URL}/auth/reset-password?token=${token}`;
  // console.log(`Reset URL for ${email}: ${resetURL}`); // Log for testing

  await sendEmail(user.email, "Reset your password", {
    text: `Reset your password: ${resetURL}`,
    html: resetPasswordTemplate(resetURL),
  });
};

const resetPasswordService = async (token, newPassword, confirmPassword) => {
  if (!token) throw new ValidationError("Reset token is required.");

  // Check password rules before hitting the database: cheaper and avoids work when input is obviously wrong.
  // (Controller already validates for HTTP; we repeat here so this service stays correct if another caller is added later.)
  validateResetPassword(newPassword, confirmPassword);

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  // WHY vague message?
  // Don't tell attacker whether token is invalid vs expired
  if (!user) throw new ValidationError("Reset link is invalid or has expired.");

  user.password = newPassword;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  user.tokenVersion += 1; // invalidate all existing sessions
  await user.save();
};

module.exports = {
  signupService,
  loginService,
  forgotPasswordService,
  resetPasswordService,
};
