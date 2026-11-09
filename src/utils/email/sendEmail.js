const nodemailer = require("nodemailer");

let cachedTransporter;
let cachedCredentials;

const getTransporter = (emailUser, emailPass) => {
  const credentials = `${emailUser}\u0000${emailPass}`;
  if (!cachedTransporter || cachedCredentials !== credentials) {
    cachedTransporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: emailUser, pass: emailPass },
    });
    cachedCredentials = credentials;
  }
  return cachedTransporter;
};

const sendEmail = async (to, subject, { text, html }) => {
  const emailUser = process.env.EMAIL_USER;
  const emailPass = process.env.EMAIL_PASS;
  if (!emailUser || !emailPass) {
    throw new Error("EMAIL_USER and EMAIL_PASS are required to send email.");
  }

  return getTransporter(emailUser, emailPass).sendMail({
    from: `"ConnectDev" <${emailUser}>`,
    to,
    subject,
    text,
    html,
  });
};

module.exports = sendEmail;
