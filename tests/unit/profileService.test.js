require("../helpers/setTestEnv");

const mockSelect = jest.fn();
const mockFindById = jest.fn(() => ({ select: mockSelect }));
const mockConnectionExists = jest.fn();

jest.mock("../../src/models/userSchema", () => ({ findById: mockFindById }));
jest.mock("../../src/models/connectionSchema", () => ({
  exists: mockConnectionExists,
}));

const {
  uniqueProfileService,
  updateProfileService,
} = require("../../src/services/profileService");

describe("profile services", () => {
  beforeEach(() => {
    mockFindById.mockClear();
    mockSelect.mockReset();
    mockConnectionExists.mockReset();
  });

  test("rejects an invalid target ID before database access", async () => {
    await expect(
      uniqueProfileService("invalid-id", "507f1f77bcf86cd799439011"),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockFindById).not.toHaveBeenCalled();
    expect(mockConnectionExists).not.toHaveBeenCalled();
  });

  test("checks target existence before connection authorization", async () => {
    mockSelect.mockResolvedValue(null);

    await expect(
      uniqueProfileService(
        "507f191e810c19729de860ea",
        "507f1f77bcf86cd799439011",
      ),
    ).rejects.toMatchObject({ statusCode: 404 });

    expect(mockConnectionExists).not.toHaveBeenCalled();
  });

  test("allows a user to view their own profile without a connection", async () => {
    const target = { _id: "507f191e810c19729de860ea" };
    mockSelect.mockResolvedValue(target);

    await expect(
      uniqueProfileService(
        "507f191e810c19729de860ea",
        "507f191e810c19729de860ea",
      ),
    ).resolves.toBe(target);
    expect(mockConnectionExists).not.toHaveBeenCalled();
  });

  test("requires an accepted connection for another existing user", async () => {
    mockSelect.mockResolvedValue({ _id: "507f191e810c19729de860ea" });
    mockConnectionExists.mockResolvedValue(false);

    await expect(
      uniqueProfileService(
        "507f191e810c19729de860ea",
        "507f1f77bcf86cd799439011",
      ),
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test("applies only normalized profile fields without mutating input", async () => {
    const input = {
      firstName: "  Talha  ",
      skills: [" Node.js ", "node.JS"],
      location: "  Lahore  ",
    };
    const original = structuredClone(input);
    const user = { save: jest.fn().mockResolvedValue(undefined) };

    await updateProfileService(input, user);

    expect(input).toEqual(original);
    expect(user).toMatchObject({
      firstName: "Talha",
      skills: ["Node.js"],
      location: "Lahore",
    });
    expect(user.save).toHaveBeenCalledTimes(1);
  });
});
