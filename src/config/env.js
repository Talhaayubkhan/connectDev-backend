require("dotenv").config({ quiet: true });
const { ForbiddenError } = require("../utils/errors");

const AUTH_TOKEN_COOKIE_MAX_MS = 7 * 24 * 60 * 60 * 1000;
const COOKIE_SAME_SITE_VALUES = new Set(["lax", "strict", "none"]);

const parseBoolean = (value, fallback, name) => {
  if (value === undefined || value === "") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be either true or false.`);
};

const parseOrigins = (value, nodeEnv) => {
  const configured = value
    ?.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const origins = configured?.length
    ? configured
    : nodeEnv === "production"
      ? []
      : ["http://localhost:5173"];

  if (origins.length === 0) {
    throw new Error("FRONTEND_URL is required in production.");
  }

  for (const origin of origins) {
    let parsed;
    try {
      parsed = new URL(origin);
    } catch {
      throw new Error(`Invalid FRONTEND_URL origin: ${origin}`);
    }

    if (!["http:", "https:"].includes(parsed.protocol) || parsed.origin !== origin) {
      throw new Error(`Invalid FRONTEND_URL origin: ${origin}`);
    }
  }

  return origins;
};

const getRuntimeConfig = (env = process.env) => {
  const nodeEnv = env.NODE_ENV || "development";
  const port = Number(env.PORT || 3000);
  const mongoUrl = env.MONGODB_URL?.trim();
  const jwtSecret = env.JWT_SECRET;
  const cookieSameSite = (
    env.COOKIE_SAME_SITE || (nodeEnv === "production" ? "none" : "lax")
  ).toLowerCase();
  const cookieSecure = parseBoolean(
    env.COOKIE_SECURE,
    nodeEnv === "production",
    "COOKIE_SECURE",
  );

  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("PORT must be an integer between 1 and 65535.");
  }
  if (!mongoUrl) throw new Error("MONGODB_URL is required.");
  if (typeof jwtSecret !== "string" || jwtSecret.length < 32) {
    throw new Error("JWT_SECRET must be at least 32 characters.");
  }
  if (!COOKIE_SAME_SITE_VALUES.has(cookieSameSite)) {
    throw new Error('COOKIE_SAME_SITE must be "lax", "strict", or "none".');
  }
  if (cookieSameSite === "none" && !cookieSecure) {
    throw new Error('COOKIE_SECURE must be true when COOKIE_SAME_SITE is "none".');
  }

  return {
    nodeEnv,
    port,
    mongoUrl,
    jwtSecret,
    frontendOrigins: parseOrigins(env.FRONTEND_URL, nodeEnv),
    emailUser: env.EMAIL_USER?.trim() || "",
    emailPass: env.EMAIL_PASS || "",
    cookieSameSite,
    cookieSecure,
  };
};

const getCookieOptions = (config) => ({
  httpOnly: true,
  maxAge: AUTH_TOKEN_COOKIE_MAX_MS,
  path: "/",
  sameSite: config.cookieSameSite,
  secure: config.cookieSecure,
});

const getCorsOptions = (config) => ({
  credentials: true,
  origin(origin, callback) {
    // WHY: CLI clients and server-to-server requests do not send Origin.
    if (!origin || config.frontendOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new ForbiddenError("Origin is not allowed by CORS."));
  },
});

module.exports = { getCookieOptions, getCorsOptions, getRuntimeConfig };
