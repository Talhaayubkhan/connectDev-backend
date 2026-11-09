require("../helpers/setTestEnv");

const mockGetPending = jest.fn();
const mockGetAccepted = jest.fn();
const mockGetFeed = jest.fn();

jest.mock("../../src/services/connectionRequestService", () => ({
  getPendingReceivedRequests: mockGetPending,
  getAcceptedReceivedRequests: mockGetAccepted,
  getFeedService: mockGetFeed,
}));

const {
  feed,
  showAllAcceptedRequests,
  showAllReceivedRequests,
} = require("../../src/controllers/userController");
const createMockResponse = require("../helpers/createMockResponse");

const loggedInUserId = "507f1f77bcf86cd799439011";

describe("user collection controllers", () => {
  test("returns an empty pending-request collection successfully", async () => {
    mockGetPending.mockResolvedValue([]);
    const response = createMockResponse();
    const next = jest.fn();

    await showAllReceivedRequests(
      { user: { _id: loggedInUserId } },
      response,
      next,
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ count: 0, results: [] });
    expect(next).not.toHaveBeenCalled();
  });

  test("returns an empty accepted-connection collection successfully", async () => {
    mockGetAccepted.mockResolvedValue([]);
    const response = createMockResponse();

    await showAllAcceptedRequests(
      { user: { _id: loggedInUserId } },
      response,
      jest.fn(),
    );

    expect(response.statusCode).toBe(200);
    expect(response.body).toMatchObject({ count: 0, data: [] });
  });

  test("maps accepted relationships to safe other-user cards", async () => {
    const otherUser = {
      _id: "507f191e810c19729de860ea",
      firstName: "Ada",
      email: "private@example.com",
      location: "London",
      occupation: "Engineer",
      lastSeen: new Date(),
    };
    mockGetAccepted.mockResolvedValue([
      {
        senderUserId: { _id: loggedInUserId },
        receiverUserId: otherUser,
      },
    ]);
    const response = createMockResponse();

    await showAllAcceptedRequests(
      { user: { _id: loggedInUserId } },
      response,
      jest.fn(),
    );

    expect(response.body.count).toBe(1);
    expect(response.body.data[0]).toMatchObject({
      id: otherUser._id,
      location: "London",
      occupation: "Engineer",
      isActive: true,
    });
    expect(response.body.data[0].email).toBeUndefined();
  });

  test("returns serialized feed cards with pagination metadata", async () => {
    mockGetFeed.mockResolvedValue({
      users: [
        {
          _id: "507f191e810c19729de860ea",
          firstName: "Ada",
          email: "private@example.com",
          location: "London",
          occupation: "Engineer",
          lastSeen: new Date(),
        },
      ],
      hasNextPage: true,
    });
    const response = createMockResponse();

    await feed(
      { user: { _id: loggedInUserId }, query: { page: "2", limit: "10" } },
      response,
      jest.fn(),
    );

    expect(mockGetFeed).toHaveBeenCalledWith(loggedInUserId, 10, 10);
    expect(response.body).toMatchObject({
      page: 2,
      limit: 10,
      results: 1,
      hasNextPage: true,
    });
    expect(response.body.data[0]).toMatchObject({
      id: "507f191e810c19729de860ea",
      location: "London",
      occupation: "Engineer",
    });
    expect(response.body.data[0].email).toBeUndefined();
  });
});
