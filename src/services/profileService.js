const User = require("../models/userSchema");

const updateProfileService = async (userId, updateData) => {
  const allowed = ["skills", "about", "age", "photoURL", "gender"];

  const isValid = Object.keys(updateData).every((k) => allowed.includes(k));

  if (!isValid) throw new Error("Not allowed updates");

  const user = await User.findByIdAndUpdate(userId, updateData, {
    runValidators: true,
  });

  return { user };
};

module.exports = { updateProfileService };
