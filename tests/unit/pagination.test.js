require("../helpers/setTestEnv");

const { parsePagination } = require("../../src/utils/pagination");

describe("strict pagination", () => {
  test("uses defaults when values are missing", () => {
    expect(parsePagination({})).toEqual({ page: 1, limit: 10, skip: 0 });
  });

  test("parses whole positive integer strings", () => {
    expect(parsePagination({ page: "3", limit: "20" })).toEqual({
      page: 3,
      limit: 20,
      skip: 40,
    });
  });

  test.each([
    { page: "0" },
    { page: "-1" },
    { page: "1.5" },
    { page: "2abc" },
    { page: ["1", "2"] },
    { limit: "0" },
    { limit: "51" },
    { limit: "2.5" },
  ])("rejects invalid query $query", (query) => {
    expect(() => parsePagination(query)).toThrow();
  });
});
