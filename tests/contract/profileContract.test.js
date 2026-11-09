require("../helpers/setTestEnv");

const mockUniqueProfileService = jest.fn();
const mockUpdateProfileService = jest.fn();

jest.mock("../../src/services/profileService", () => ({
  changeUserPassword: jest.fn(),
  uniqueProfileService: mockUniqueProfileService,
  updateProfileService: mockUpdateProfileService,
}));

const {
  getProfile,
  getUniqueProfile,
  profileEdit,
} = require("../../src/controllers/profileController");
const createMockResponse = require("../helpers/createMockResponse");

const profile = {
  _id: "507f191e810c19729de860ea",
  firstName: "Talha",
  lastName: "Khan",
  email: "talha@example.com",
  password: "hashed-password",
  location: "Lahore",
  occupation: "Engineer",
  lastSeen: new Date(),
};

describe("profile response contract", () => {
  test("current profile includes compatible IDs, email, and card fields", async () => {
    const response = createMockResponse();

    await getProfile({ user: profile }, response, jest.fn());

    expect(response.body.data).toMatchObject({
      _id: profile._id,
      id: profile._id,
      email: "talha@example.com",
      location: "Lahore",
      occupation: "Engineer",
    });
    expect(response.body.data.password).toBeUndefined();
  });

  test("public connected profile excludes email and secrets", async () => {
    mockUniqueProfileService.mockResolvedValue(profile);
    const response = createMockResponse();

    await getUniqueProfile(
      {
        params: { userId: profile._id },
        user: { _id: "507f1f77bcf86cd799439011" },
      },
      response,
      jest.fn(),
    );

    expect(response.body.data.id).toBe(profile._id);
    expect(response.body.data.email).toBeUndefined();
    expect(response.body.data.password).toBeUndefined();
  });

  test("updated current profile retains the current-user contract", async () => {
    mockUpdateProfileService.mockResolvedValue(profile);
    const response = createMockResponse();

    await profileEdit(
      { body: { location: "Lahore" }, user: profile },
      response,
      jest.fn(),
    );

    expect(response.body.data).toMatchObject({
      id: profile._id,
      email: profile.email,
      location: profile.location,
    });
  });
});
