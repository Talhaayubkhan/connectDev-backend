require("../helpers/setTestEnv");

const mockFindById = jest.fn();

jest.mock("../../src/models/userSchema", () => ({
  findById: mockFindById,
}));

const { changeUserPassword } = require("../../src/services/profileService");

const buildUser = ({ currentMatches = true, newMatches = false } = {}) => ({
  tokenVersion: 2,
  validatePassword: jest
    .fn()
    .mockResolvedValueOnce(currentMatches)
    .mockResolvedValueOnce(newMatches),
  save: jest.fn().mockResolvedValue(undefined),
});

describe("profile password changes", () => {
  beforeEach(() => mockFindById.mockReset());

  test("changes a valid password and revokes existing sessions", async () => {
    const user = buildUser();
    mockFindById.mockResolvedValue(user);

    await changeUserPassword("user-1", "CurrentPass1!", "NewStrongPass2!");

    expect(user.password).toBe("NewStrongPass2!");
    expect(user.tokenVersion).toBe(3);
    expect(user.save).toHaveBeenCalledTimes(1);
  });

  test("rejects an incorrect current password", async () => {
    mockFindById.mockResolvedValue(buildUser({ currentMatches: false }));

    await expect(
      changeUserPassword("user-1", "WrongPass1!", "NewStrongPass2!"),
    ).rejects.toMatchObject({ message: "Current password is incorrect." });
  });

  test("rejects reusing the current password", async () => {
    mockFindById.mockResolvedValue(buildUser({ newMatches: true }));

    await expect(
      changeUserPassword("user-1", "CurrentPass1!", "CurrentPass1!"),
    ).rejects.toMatchObject({
      message: "New password cannot be the same as current password.",
    });
  });
});
