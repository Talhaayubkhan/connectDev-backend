require("../helpers/setTestEnv");

const mockServer = {
  close: jest.fn((callback) => callback()),
};
const mockApp = {
  listen: jest.fn((_port, callback) => {
    queueMicrotask(callback);
    return mockServer;
  }),
};
const mockConnectDB = jest.fn().mockResolvedValue(undefined);
const mockCloseDatabase = jest.fn().mockResolvedValue(undefined);

jest.mock("../../src/app", () => mockApp);
jest.mock("../../src/config/database", () => mockConnectDB);
jest.mock("mongoose", () => ({
  connection: {
    close: mockCloseDatabase,
    readyState: 1,
  },
}));

describe("server lifecycle", () => {
  test("does not connect or listen when imported", () => {
    require("../../src/server");

    expect(mockConnectDB).not.toHaveBeenCalled();
    expect(mockApp.listen).not.toHaveBeenCalled();
  });

  test("connects before accepting HTTP requests", async () => {
    const { startServer } = require("../../src/server");

    await startServer({
      config: { mongoUrl: "mongodb://database/connectdev", port: 4321 },
    });

    expect(mockConnectDB).toHaveBeenCalledWith("mongodb://database/connectdev");
    expect(mockApp.listen).toHaveBeenCalledWith(4321, expect.any(Function));
    expect(mockConnectDB.mock.invocationCallOrder[0]).toBeLessThan(
      mockApp.listen.mock.invocationCallOrder[0],
    );
  });

  test("closes HTTP and database resources during shutdown", async () => {
    const { shutdown } = require("../../src/server");

    await shutdown("SIGTERM");

    expect(mockServer.close).toHaveBeenCalledTimes(1);
    expect(mockCloseDatabase).toHaveBeenCalledTimes(1);
  });
});
