require("../helpers/setTestEnv");

const mockUserExists = jest.fn();
const mockUserFind = jest.fn();
const mockFindOne = jest.fn();
const mockFindOneAndUpdate = jest.fn();
const mockConnectionFind = jest.fn();
const mockSave = jest.fn();
const mockConnectionConstructor = jest.fn(function (data) {
  Object.assign(this, data);
  this.save = mockSave;
});
mockConnectionConstructor.findOne = mockFindOne;
mockConnectionConstructor.findOneAndUpdate = mockFindOneAndUpdate;
mockConnectionConstructor.find = mockConnectionFind;

jest.mock("../../src/models/userSchema", () => ({
  exists: mockUserExists,
  find: mockUserFind,
}));
jest.mock("../../src/models/connectionSchema", () => mockConnectionConstructor);

const {
  acceptConnectionRequest,
  getFeedService,
  sendConnectionRequest,
} = require("../../src/services/connectionRequestService");

const senderId = "507f1f77bcf86cd799439011";
const receiverId = "507f191e810c19729de860ea";
const requestId = "507f191e810c19729de860eb";

describe("connection request services", () => {
  beforeEach(() => {
    mockUserExists.mockReset();
    mockFindOne.mockReset();
    mockFindOneAndUpdate.mockReset();
    mockConnectionFind.mockReset();
    mockUserFind.mockReset();
    mockSave.mockReset();
    mockConnectionConstructor.mockClear();
  });

  test("rejects invalid receiver IDs before database access", async () => {
    await expect(
      sendConnectionRequest(senderId, "invalid-id", "interested"),
    ).rejects.toMatchObject({ statusCode: 400 });

    expect(mockUserExists).not.toHaveBeenCalled();
    expect(mockFindOne).not.toHaveBeenCalled();
  });

  test("rejects self requests before database access", async () => {
    await expect(
      sendConnectionRequest(senderId, senderId, "interested"),
    ).rejects.toMatchObject({ message: "Cannot send request to yourself." });

    expect(mockUserExists).not.toHaveBeenCalled();
  });

  test("returns not found when the receiver does not exist", async () => {
    mockUserExists.mockResolvedValue(false);

    await expect(
      sendConnectionRequest(senderId, receiverId, "interested"),
    ).rejects.toMatchObject({ statusCode: 404 });
  });

  test("rejects an existing relationship in either direction", async () => {
    mockUserExists.mockResolvedValue(true);
    mockFindOne.mockResolvedValue({ _id: "existing-request" });

    await expect(
      sendConnectionRequest(senderId, receiverId, "interested"),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "A connection request already exists.",
    });
    expect(mockFindOne).toHaveBeenCalledWith({
      $or: [
        { senderUserId: senderId, receiverUserId: receiverId },
        { senderUserId: receiverId, receiverUserId: senderId },
      ],
    });
  });

  test("normalizes a duplicate insert race to the same conflict", async () => {
    mockUserExists.mockResolvedValue(true);
    mockFindOne.mockResolvedValue(null);
    mockSave.mockRejectedValue({ code: 11000 });

    await expect(
      sendConnectionRequest(senderId, receiverId, "interested"),
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "A connection request already exists.",
    });
  });

  test("reviews only a pending request owned by the receiver", async () => {
    const updated = { _id: requestId, status: "accepted" };
    mockFindOneAndUpdate.mockResolvedValue(updated);

    await expect(
      acceptConnectionRequest(receiverId, requestId, "accepted"),
    ).resolves.toBe(updated);
    expect(mockFindOneAndUpdate).toHaveBeenCalledWith(
      {
        _id: requestId,
        receiverUserId: receiverId,
        status: "interested",
      },
      { $set: { status: "accepted" } },
      { new: true, runValidators: true },
    );
  });

  test("returns one safe not-found result for unauthorized or nonpending review", async () => {
    mockFindOneAndUpdate.mockResolvedValue(null);

    await expect(
      acceptConnectionRequest(receiverId, requestId, "rejected"),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: "Pending connection request not found.",
    });
  });

  test("feed does not hide users because of stale stored activity", async () => {
    mockConnectionFind.mockReturnValue({
      select: () => ({ lean: jest.fn().mockResolvedValue([]) }),
    });
    let userFilter;
    mockUserFind.mockImplementation((filter) => {
      userFilter = filter;
      return {
        sort: () => ({
          skip: () => ({
            limit: () => ({
              select: () => ({
                lean: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      };
    });

    await getFeedService(senderId, 10, 0);

    expect(userFilter).toEqual({ _id: { $nin: [senderId] } });
    expect(userFilter.isActive).toBeUndefined();
  });
});
