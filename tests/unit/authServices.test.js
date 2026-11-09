require("../helpers/setTestEnv");

const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn().mockResolvedValue(undefined);
const mockSendEmail = jest.fn();
const mockUserConstructor = jest.fn(function (data) {
  Object.assign(this, data, { _id: "user-1", tokenVersion: 0 });
  this.save = jest.fn().mockResolvedValue(this);
});
mockUserConstructor.findOne = mockFindOne;
mockUserConstructor.updateOne = mockUpdateOne;

jest.mock("../../src/models/userSchema", () => mockUserConstructor);
jest.mock("../../src/utils/email/sendEmail", () => mockSendEmail);

const {
  forgotPasswordService,
  loginService,
  resetPasswordService,
  signupService,
} = require("../../src/services/authServices");

describe("authentication services", () => {
  beforeEach(() => {
    mockFindOne.mockReset();
    mockUpdateOne.mockClear();
    mockSendEmail.mockReset();
    mockUserConstructor.mockClear();
  });

  test("signup preserves the exact password for hashing", async () => {
    const password = " StrongPass1! ";
    mockFindOne.mockResolvedValue(null);

    await signupService({
      firstName: "Talha",
      email: "talha@example.com",
      password,
      confirmPassword: password,
    });

    expect(mockUserConstructor.mock.instances[0].password).toBe(password);
  });

  test("login gives the same error for a missing user and wrong password", async () => {
    mockFindOne.mockResolvedValueOnce(null).mockResolvedValueOnce({
      validatePassword: jest.fn().mockResolvedValue(false),
    });

    await expect(
      loginService("missing@example.com", "StrongPass1!"),
    ).rejects.toMatchObject({ message: "Invalid email or password." });
    await expect(
      loginService("known@example.com", "WrongPass1!"),
    ).rejects.toMatchObject({ message: "Invalid email or password." });
  });

  test("login compares the exact untrimmed password", async () => {
    const validatePassword = jest.fn().mockResolvedValue(true);
    mockFindOne.mockResolvedValue({
      _id: "user-1",
      email: "known@example.com",
      validatePassword,
      getSignJWT: jest.fn().mockReturnValue("signed-token"),
    });

    await loginService("known@example.com", " StrongPass1! ");

    expect(validatePassword).toHaveBeenCalledWith(" StrongPass1! ");
  });

  test("clears its reset token when email delivery fails", async () => {
    const user = {
      _id: "user-1",
      email: "known@example.com",
      resetPasswordExpires: undefined,
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockFindOne.mockResolvedValue(user);
    mockSendEmail.mockRejectedValue(new Error("SMTP unavailable"));

    await expect(
      forgotPasswordService("known@example.com"),
    ).rejects.toThrow("SMTP unavailable");
    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: "user-1", resetPasswordToken: user.resetPasswordToken },
      { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } },
    );
  });

  test("reset replaces the password, clears reset state, and revokes sessions", async () => {
    const user = {
      password: "old-hash",
      resetPasswordToken: "stored-token",
      resetPasswordExpires: new Date(Date.now() + 60_000),
      tokenVersion: 3,
      save: jest.fn().mockResolvedValue(undefined),
    };
    mockFindOne.mockResolvedValue(user);

    await resetPasswordService("a".repeat(64), "NewStrongPass2!");

    expect(user.password).toBe("NewStrongPass2!");
    expect(user.resetPasswordToken).toBeUndefined();
    expect(user.resetPasswordExpires).toBeUndefined();
    expect(user.tokenVersion).toBe(4);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  test("rejects an expired or unknown reset token", async () => {
    mockFindOne.mockResolvedValue(null);

    await expect(
      resetPasswordService("a".repeat(64), "NewStrongPass2!"),
    ).rejects.toMatchObject({
      message: "Reset link is invalid or has expired.",
    });
  });
});
