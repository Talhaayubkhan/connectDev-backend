require("../helpers/setTestEnv");

const mockSendMail = jest.fn().mockResolvedValue({ messageId: "message-1" });
const mockCreateTransport = jest.fn(() => ({ sendMail: mockSendMail }));

jest.mock("nodemailer", () => ({ createTransport: mockCreateTransport }));

const sendEmail = require("../../src/utils/email/sendEmail");

describe("email delivery configuration", () => {
  const originalUser = process.env.EMAIL_USER;
  const originalPass = process.env.EMAIL_PASS;

  afterEach(() => {
    if (originalUser === undefined) delete process.env.EMAIL_USER;
    else process.env.EMAIL_USER = originalUser;
    if (originalPass === undefined) delete process.env.EMAIL_PASS;
    else process.env.EMAIL_PASS = originalPass;
    mockCreateTransport.mockClear();
    mockSendMail.mockClear();
  });

  test("fails clearly when email credentials are missing", async () => {
    delete process.env.EMAIL_USER;
    delete process.env.EMAIL_PASS;

    await expect(
      sendEmail("user@example.com", "Subject", { text: "Body" }),
    ).rejects.toThrow("EMAIL_USER and EMAIL_PASS are required to send email.");
  });

  test("creates the transporter lazily from validated credentials", async () => {
    process.env.EMAIL_USER = "sender@example.com";
    process.env.EMAIL_PASS = "app-password";

    await sendEmail("user@example.com", "Subject", { text: "Body" });

    expect(mockCreateTransport).toHaveBeenCalledWith({
      service: "gmail",
      auth: { user: "sender@example.com", pass: "app-password" },
    });
    expect(mockSendMail).toHaveBeenCalledWith({
      from: '"ConnectDev" <sender@example.com>',
      to: "user@example.com",
      subject: "Subject",
      text: "Body",
      html: undefined,
    });
  });
});
