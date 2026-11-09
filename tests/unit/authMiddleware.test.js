require("../helpers/setTestEnv");

const mockUpdateOne = jest.fn().mockResolvedValue(undefined);
const mockUser = {
  _id: "507f1f77bcf86cd799439011",
  tokenVersion: 2,
  lastSeen: new Date(Date.now() - 2 * 60 * 1000),
};

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(() => ({ _id: mockUser._id, tokenVersion: 2 })),
}));
jest.mock("../../src/models/userSchema", () => ({
  findById: jest.fn().mockResolvedValue(mockUser),
  updateOne: mockUpdateOne,
}));

const { isAuthCheck } = require("../../src/middlewares/auth");

describe("authentication activity tracking", () => {
  test("updates only lastSeen when the stored value is stale", async () => {
    const request = { cookies: { token: "valid-token" } };
    const next = jest.fn();

    await isAuthCheck(request, {}, next);

    expect(mockUpdateOne).toHaveBeenCalledWith(
      { _id: mockUser._id },
      { $set: { lastSeen: expect.any(Date) } },
    );
    expect(request.user).toBe(mockUser);
    expect(next).toHaveBeenCalledWith();
  });
});
