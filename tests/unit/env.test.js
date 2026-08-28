require("../helpers/setTestEnv");

const {
  getCookieOptions,
  getCorsOptions,
  getRuntimeConfig,
} = require("../../src/config/env");

describe("runtime configuration", () => {
  const baseEnv = {
    NODE_ENV: "production",
    PORT: "8080",
    MONGODB_URL: "mongodb://database/connectdev",
    JWT_SECRET: "production-secret-with-at-least-32-characters",
    FRONTEND_URL: "https://connect.example, https://admin.example",
    COOKIE_SAME_SITE: "none",
    COOKIE_SECURE: "true",
  };

  test("parses validated origins and cookie settings", () => {
    const config = getRuntimeConfig(baseEnv);

    expect(config.port).toBe(8080);
    expect(config.frontendOrigins).toEqual([
      "https://connect.example",
      "https://admin.example",
    ]);
    expect(getCookieOptions(config)).toMatchObject({
      httpOnly: true,
      sameSite: "none",
      secure: true,
    });
  });

  test("rejects a short JWT secret", () => {
    expect(() =>
      getRuntimeConfig({ ...baseEnv, JWT_SECRET: "too-short" }),
    ).toThrow("JWT_SECRET must be at least 32 characters.");
  });

  test("rejects insecure SameSite none cookies", () => {
    expect(() =>
      getRuntimeConfig({ ...baseEnv, COOKIE_SECURE: "false" }),
    ).toThrow('COOKIE_SECURE must be true when COOKIE_SAME_SITE is "none".');
  });

  test("allows requests without an Origin header", () => {
    const options = getCorsOptions(getRuntimeConfig(baseEnv));
    const callback = jest.fn();

    options.origin(undefined, callback);

    expect(callback).toHaveBeenCalledWith(null, true);
  });
});
