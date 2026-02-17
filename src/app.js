const express = require("express");
const app = express();
const User = require("./models/userSchema");

app.use(express.json());

app.post("/signUp", async (req, res) => {
  try {
    const userData = req.body;

    const user = new User(userData);

    await user.save();

    res.status(201).send({
      success: true,
      message: "User Added Successfully",
      data: user,
    });
  } catch (err) {
    res.status(400).send({
      success: false,
      message: err.message,
    });
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

app.patch("/user/:userId", async (req, res) => {
  const userId = req.params?.userId;
  const userData = req.body;

  try {
    const ISALLOWEDUPDATE = ["skills", "about", "age", "photoURL", "gender"];

    const checkUpdate = Object.keys(userData).every((k) => {
      return ISALLOWEDUPDATE.includes(k);
    });

    if (!checkUpdate) {
      throw new Error("Not allowed the updates!");
    }

    const user = await User.findByIdAndUpdate(userId, userData, {
      runValidators: true,
      returnDocument: "after",
    });

    res.send("User updated successfully!");
  } catch (error) {
    res.status(400).send("Update Failed!" + error.message);
  }
});

module.exports = app;
