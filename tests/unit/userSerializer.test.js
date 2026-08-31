require("../helpers/setTestEnv");

const {
  isRecentlyActive,
  serializeUser,
} = require("../../src/utils/userSerializer");

const now = new Date("2026-08-28T10:00:00.000Z").getTime();
const user = {
  _id: "user-1",
  firstName: "Talha",
  lastName: "Khan",
  email: "talha@example.com",
  password: "hashed-secret",
  resetPasswordToken: "hashed-token",
  resetPasswordExpires: new Date(now + 60_000),
  photoURL: "https://example.com/avatar.png",
  age: 25,
  gender: "male",
  about: "Backend developer",
  skills: ["Node.js"],
  location: "Lahore",
  occupation: "Engineer",
  isActive: false,
  lastSeen: new Date(now - 4 * 60_000),
  createdAt: new Date("2026-01-01T00:00:00.000Z"),
  updatedAt: new Date("2026-08-01T00:00:00.000Z"),
};

describe("safe user serialization", () => {
  test("returns compatible identifiers and current profile fields", () => {
    const result = serializeUser(user, { includeEmail: true, now });

    expect(result).toEqual({
      _id: "user-1",
      id: "user-1",
      firstName: "Talha",
      lastName: "Khan",
      email: "talha@example.com",
      photoURL: "https://example.com/avatar.png",
      age: 25,
      gender: "male",
      about: "Backend developer",
      skills: ["Node.js"],
      location: "Lahore",
      occupation: "Engineer",
      isActive: true,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    });
  });

  test("omits email and all secret fields for public users", () => {
    const result = serializeUser(user, { now });

    expect(result.email).toBeUndefined();
    expect(result.password).toBeUndefined();
    expect(result.resetPasswordToken).toBeUndefined();
    expect(result.resetPasswordExpires).toBeUndefined();
  });

  test("supports Mongoose documents without spreading private fields", () => {
    const result = serializeUser({ toObject: () => ({ ...user }) }, { now });

    expect(result.id).toBe("user-1");
    expect(result.password).toBeUndefined();
  });

  test("derives activity from the five minute last-seen window", () => {
    expect(isRecentlyActive(new Date(now - 5 * 60_000), now)).toBe(true);
    expect(isRecentlyActive(new Date(now - 5 * 60_000 - 1), now)).toBe(false);
    expect(isRecentlyActive(undefined, now)).toBe(false);
    expect(isRecentlyActive("invalid-date", now)).toBe(false);
  });
});
