require("../helpers/setTestEnv");

const User = require("../../src/models/userSchema");

const buildUser = (overrides = {}) =>
  new User({
    firstName: "Talha",
    email: "talha@example.com",
    password: "StrongPass1!",
    ...overrides,
  });

describe("user persistence constraints", () => {
  test("rejects biographies longer than 300 characters", async () => {
    await expect(
      buildUser({ about: "x".repeat(301) }).validate(),
    ).rejects.toMatchObject({
      errors: { about: { kind: "maxlength" } },
    });
  });

  test("rejects skill names longer than 30 characters", async () => {
    await expect(
      buildUser({ skills: ["x".repeat(31)] }).validate(),
    ).rejects.toMatchObject({
      errors: { "skills.0": { kind: "maxlength" } },
    });
  });
});
