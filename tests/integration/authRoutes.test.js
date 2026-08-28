require("../helpers/setTestEnv");

const request = require("supertest");
const mockChangeUserPassword = jest.fn().mockResolvedValue(undefined);

jest.mock("../../src/middlewares/auth", () => ({
  isAuthCheck: (req, _res, next) => {
    req.user = { _id: "user-1" };
    next();
  },
}));
jest.mock("../../src/services/profileService", () => ({
  changeUserPassword: mockChangeUserPassword,
  uniqueProfileService: jest.fn(),
  updateProfileService: jest.fn(),
}));

const app = require("../../src/app");

describe("authentication route contracts", () => {
  test("password change accepts the frontend payload and clears the session", async () => {
    const response = await request(app)
      .patch("/profile/changePassword")
      .set("Cookie", "token=active-session")
      .send({ currentPassword: "CurrentPass1!", newPassword: "NewStrongPass2!" });

    expect(response.status).toBe(200);
    expect(mockChangeUserPassword).toHaveBeenCalledWith(
      "user-1",
      "CurrentPass1!",
      "NewStrongPass2!",
    );
    expect(response.headers["set-cookie"][0]).toContain("token=;");
    expect(response.headers["set-cookie"][0]).toContain("HttpOnly");
    expect(response.headers["set-cookie"][0]).toContain("SameSite=Lax");
  });

  test("reset password rejects malformed tokens", async () => {
    const response = await request(app).patch("/auth/reset-password").send({
      token: "not-a-token",
      newPassword: "NewStrongPass2!",
      confirmPassword: "NewStrongPass2!",
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test.each([
    [
      "missing token",
      {
        newPassword: "NewStrongPass2!",
        confirmPassword: "NewStrongPass2!",
      },
    ],
    [
      "mismatched passwords",
      {
        token: "a".repeat(64),
        newPassword: "NewStrongPass2!",
        confirmPassword: "DifferentPass3!",
      },
    ],
    [
      "weak passwords",
      {
        token: "a".repeat(64),
        newPassword: "weak",
        confirmPassword: "weak",
      },
    ],
  ])("reset password rejects %s", async (_label, body) => {
    const response = await request(app)
      .patch("/auth/reset-password")
      .send(body);

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
