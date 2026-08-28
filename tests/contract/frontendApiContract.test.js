require("../helpers/setTestEnv");

const { serializeUser } = require("../../src/utils/userSerializer");
const { SENDER_FIELDS } = require("../../src/utils/constants");

describe("frontend user-card contract", () => {
  test("database projections include every field used by public cards", () => {
    expect(SENDER_FIELDS).toEqual(
      expect.arrayContaining([
        "firstName",
        "lastName",
        "photoURL",
        "age",
        "gender",
        "about",
        "skills",
        "location",
        "occupation",
        "lastSeen",
      ]),
    );
  });

  test("serialized cards provide compatible identity and activity fields", () => {
    const card = serializeUser({
      _id: "507f191e810c19729de860ea",
      firstName: "Ada",
      lastName: "Lovelace",
      location: "London",
      occupation: "Engineer",
      lastSeen: new Date(),
    });

    expect(card).toMatchObject({
      _id: "507f191e810c19729de860ea",
      id: "507f191e810c19729de860ea",
      location: "London",
      occupation: "Engineer",
      isActive: true,
    });
  });
});
