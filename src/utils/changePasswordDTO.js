const createPasswordDTO = (body) => ({
  currentPassword: body.currentPassword,
  newPassword: body.newPassword,
});
module.exports = createPasswordDTO;
