require("../helpers/setTestEnv");

const request = require("supertest");
const app = require("../../src/app");

describe("HTTP application safety", () => {
  test("reports service health without exposing Express", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, status: "ok" });
    expect(response.headers["x-powered-by"]).toBeUndefined();
    expect(response.headers["x-content-type-options"]).toBe("nosniff");
  });

  test("returns a JSON response for unknown routes", async () => {
    const response = await request(app).get("/missing-route");

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      success: false,
      message: "Route not found.",
    });
  });

  test("rejects unconfigured browser origins with a safe response", async () => {
    const response = await request(app)
      .get("/health")
      .set("Origin", "https://untrusted.example");

    expect(response.status).toBe(403);
    expect(response.body).toEqual({
      success: false,
      message: "Origin is not allowed by CORS.",
    });
  });

  test("returns controlled JSON for malformed request bodies", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .set("Content-Type", "application/json")
      .send('{"firstName":');

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      success: false,
      message: "Malformed JSON body.",
    });
  });

  test("rejects oversized request bodies", async () => {
    const response = await request(app)
      .post("/auth/signup")
      .send({ firstName: "x".repeat(101 * 1024) });

    expect(response.status).toBe(413);
    expect(response.body).toEqual({
      success: false,
      message: "Request body is too large.",
    });
  });

  test("rate limits repeated login attempts", async () => {
    const responses = [];

    for (let attempt = 0; attempt < 6; attempt += 1) {
      responses.push(
        await request(app)
          .post("/auth/login")
          .send({ email: 123, password: 123 }),
      );
    }

    expect(responses.slice(0, 5).every(({ status }) => status === 400)).toBe(
      true,
    );
    expect(responses[5].status).toBe(429);
    expect(responses[5].body).toEqual({
      success: false,
      message: "Too many login attempts. Please try again later.",
    });
  });
});
