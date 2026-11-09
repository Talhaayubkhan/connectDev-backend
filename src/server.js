const app = require("./app");
const connectDB = require("./config/database");

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    console.log("Database Connected Successfully!");

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => {
    // CHANGED: log the actual error, not just a generic message.
    // Before, if connectDB() failed, you'd have no idea WHY —
    // wrong URI? Auth failure? Network issue? All looked identical.
    console.error("Database connection failed!", error.message);
  });
