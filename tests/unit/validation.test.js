require("../helpers/setTestEnv");

const {
  validateLoginInput,
  validateNewPassword,
  validatePasswordChange,
  validateProfileData,
  validateSignupData,
} = require("../../src/utils/validation");

const validProfile = {
  firstName: "  Talha  ",
  lastName: "  Khan  ",
  gender: "male",
  age: "25",
  about: "  Backend developer  ",
  skills: [" Node.js ", "node.JS", "Express"],
  photoURL: "https://example.com/avatar.png",
  location: "  Lahore  ",
  occupation: "  Engineer  ",
};

describe("password validation", () => {
  test("preserves valid signup passwords exactly", () => {
    const password = " StrongPass1! ";
    const result = validateSignupData({
      firstName: "Talha",
      email: "talha@example.com",
      password,
      confirmPassword: password,
    });

    expect(result.password).toBe(password);
  });

  test("preserves valid login passwords exactly", () => {
    expect(validateLoginInput(" USER@Example.com ", " StrongPass1! ")).toEqual({
      normalizedEmail: "user@example.com",
      password: " StrongPass1! ",
    });
  });

  test("accepts a valid new password without changing its value", () => {
    expect(
      validatePasswordChange("CurrentPass1!", "NewStrongPass2!"),
    ).toBe("NewStrongPass2!");
    expect(validateNewPassword(" StrongPass3! ")).toBe(" StrongPass3! ");
  });
});

describe("profile validation", () => {
  test("returns sanitized data without mutating the request body", () => {
    const input = structuredClone(validProfile);
    const result = validateProfileData(input);

    expect(input).toEqual(validProfile);
    expect(result).toEqual({
      firstName: "Talha",
      lastName: "Khan",
      gender: "male",
      age: 25,
      about: "Backend developer",
      skills: ["Node.js", "Express"],
      photoURL: "https://example.com/avatar.png",
      location: "Lahore",
      occupation: "Engineer",
    });
  });

  test.each([
    ["non-object body", null],
    ["empty update", {}],
    ["invalid field", { role: "admin" }],
    ["non-string biography", { about: 123 }],
    ["long biography", { about: "x".repeat(301) }],
    ["invalid photo URL", { photoURL: "not-a-url" }],
    ["invalid gender", { gender: "unknown" }],
    ["age below minimum", { age: 17 }],
    ["age above maximum", { age: 101 }],
    [
      "too many skills",
      { skills: Array.from({ length: 16 }, (_, i) => `skill-${i}`) },
    ],
    ["long skill", { skills: ["x".repeat(31)] }],
    ["non-string skill", { skills: ["Node.js", 42] }],
  ])("rejects %s", (_label, update) => {
    expect(() => validateProfileData(update)).toThrow();
  });

  test.each([18, 100])("accepts boundary age %s", (age) => {
    expect(validateProfileData({ age })).toEqual({ age });
  });

  test("allows an optional age to be cleared", () => {
    expect(validateProfileData({ age: "" })).toEqual({ age: undefined });
  });
});
