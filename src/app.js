const express = require("express");
const app = express();
const User = require("./models/userSchema");

app.use(express.json());

app.post("/signUp", async (req, res) => {
  // console.log(req.body);
  const userData = req.body;

  const user = new User(userData);
  try {
    await user.save();
    res.send("User Added Successfully!");
  } catch (err) {
    res.status(400).send("Error while saving the request!", err.message);
  }
});

app.get("/feed", async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send("Something went wrong!");
  }
});

app.delete("/user", async (req, res) => {
  const userId = req.body.userId;
  // console.log(userId);

  try {
    const user = await User.findOneAndDelete(userId);
    res.send("user deleted successfully!");
  } catch (error) {
    res.status(400).send("Something went wrong!");
  }
});

app.patch("/user", async (req, res) => {
  const userId = req.body.userId;
  const userData = req.body;

  try {
    const user = await User.findByIdAndUpdate({ _id: userId }, userData, {
      returnDocument: "after",
      runValidators: true,
    });
    console.log(user);

    res.send("User updated successfully!");
  } catch (error) {
    res.status(400).send("Something Went wrong!");
  }
});

module.exports = app;
