const SENDER_FIELDS = [
  "firstName",
  "lastName",
  "photoURL",
  "age",
  "gender",
  "about",
  "skills",
  "location",
  "occupation",
  "lastSeen",
  "createdAt",
  "updatedAt",
];

const nodeEnv = process.env.NODE_ENV || "development";
const sameSite = (
  process.env.COOKIE_SAME_SITE || (nodeEnv === "production" ? "none" : "lax")
).toLowerCase();
const secure =
  process.env.COOKIE_SECURE === undefined || process.env.COOKIE_SECURE === ""
    ? nodeEnv === "production"
    : process.env.COOKIE_SECURE === "true";

if (!["lax", "strict", "none"].includes(sameSite)) {
  throw new Error('COOKIE_SAME_SITE must be "lax", "strict", or "none".');
}
if (sameSite === "none" && !secure) {
  throw new Error('COOKIE_SECURE must be true when COOKIE_SAME_SITE is "none".');
}

const authTokenCookieOptions = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: "/",
  sameSite,
  secure,
};

const COMMON_PASSWORDS = new Set([
  "123456",
  "password",
  "123456789",
  "qwerty",
  "abc123",
  "password123",
]);

const PASSWORD_RULES = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

module.exports = {
  SENDER_FIELDS,
  authTokenCookieOptions,
  COMMON_PASSWORDS,
  PASSWORD_RULES,
};
