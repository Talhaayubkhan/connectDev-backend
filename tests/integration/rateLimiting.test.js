require("../helpers/setTestEnv");

const express = require("express");
const request = require("supertest");
const { forgotPasswordLimiter } = require("../../src/utils/rateLimiting");

describe("password recovery rate limiting", () => {
  test("counts successful reset requests to prevent email abuse", async () => {
    const app = express();
    app.post("/forgot", forgotPasswordLimiter, (_req, res) => {
      res.status(200).json({ success: true });
    });

    const responses = [];
    for (let attempt = 0; attempt < 4; attempt += 1) {
      responses.push(await request(app).post("/forgot"));
    }

    expect(responses.slice(0, 3).every(({ status }) => status === 200)).toBe(
      true,
    );
    expect(responses[3].status).toBe(429);
    expect(responses[3].body).toEqual({
      success: false,
      message: "Too many password reset requests. Please try again later.",
    });
  });
});
