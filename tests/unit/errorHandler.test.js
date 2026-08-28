require("../helpers/setTestEnv");

const errorHandler = require("../../src/middlewares/errorHandler");
const createMockResponse = require("../helpers/createMockResponse");

const handle = (error) => {
  const response = createMockResponse();
  errorHandler(error, {}, response, jest.fn());
  return response;
};

describe("global error responses", () => {
  test("turns invalid database identifiers into a safe validation error", () => {
    const response = handle({ name: "CastError", message: "internal cast" });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Invalid resource ID.",
    });
  });

  test("uses the first Mongoose validation message", () => {
    const response = handle({
      name: "ValidationError",
      errors: {
        age: { message: "Age must be between 18 and 100" },
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.body.message).toBe("Age must be between 18 and 100");
  });

  test("turns duplicate keys into a conflict response", () => {
    const response = handle({ code: 11000, message: "duplicate internals" });

    expect(response.statusCode).toBe(409);
    expect(response.body).toEqual({
      success: false,
      message: "Resource already exists.",
    });
  });
});
