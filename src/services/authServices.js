const crypto = require("node:crypto");
const User = require("../models/userSchema");
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require("../utils/errors");
const { validateSignupData, validatePassword } = require("../utils/validation");
const { sendEmail, buildResetEmailHTML } = require("../utils/email/sendEmail");

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
  // WHY ConflictError not ValidationError?
  // ValidationError = wrong format/missing field (400)
  // ConflictError = valid data but already exists (409)
  // Frontend can handle 409 differently — "sign in instead?" prompt
  if (existingUser) throw new ConflictError("Email already registered.");

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
    throw new ValidationError("Email and password are required.");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail });

  // WHY same message for both cases?
  // Security: don't reveal whether email exists
  if (!user) throw new ValidationError("Invalid email or password.");

  const isMatch = await user.validatePassword(password);
  if (!isMatch) throw new ValidationError("Invalid email or password.");

  const token = await user.getSignJWT();

  const {
    __v,
    resetPasswordExpires,
    resetPasswordToken,
    tokenVersion,
    ...safeUser
  } = user.toObject();

  return { user: safeUser, token };
};

const forgotPasswordService = async (email) => {
  const user = await User.findOne({ email });
  // WHY return silently?
  // Don't reveal whether email exists — security best practice
  if (!user) return;

  // Cooldown — prevent spam
  if (
    user.resetPasswordExpires &&
    user.resetPasswordExpires > Date.now() + 14 * 60 * 1000
  ) {
    throw new ValidationError(
      "Reset email already sent. Please wait before requesting again.",
    );
  }

  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;
  await user.save();

  // WHY query param not path param?
  // Frontend uses useSearchParams() — reads ?token=...
  // Path param (/reset-password/:token) would cause 404
  const resetURL = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail(user.email, "Reset your password", {
    text: `Reset your password: ${resetURL}\n\nExpires in 15 minutes.`,
    html: buildResetEmailHTML(resetURL),
  });
};

const resetPasswordService = async (token, newPassword, confirmPassword) => {
  if (!token) throw new ValidationError("Reset token is required.");

  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() },
  });

  // WHY vague message?
  // Don't tell attacker whether token is invalid vs expired
  if (!user) throw new ValidationError("Reset link is invalid or has expired.");

  validatePassword(newPassword, confirmPassword);

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
