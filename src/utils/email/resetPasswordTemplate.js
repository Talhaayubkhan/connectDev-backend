const resetPasswordTemplate = (resetURL) => {
  return `
    <div style="font-family: Arial; max-width: 600px; margin: auto;">
      <h2>Password Reset Request</h2>
      <p>You requested to reset your password.</p>
      <p>Click the button below to reset it:</p>

      <a href="${resetURL}" 
         style="display:inline-block;padding:12px 20px;
                background:#4CAF50;color:white;
                text-decoration:none;border-radius:5px;">
         Reset Password
      </a>

      <p>This link will expire in 15 minutes.</p>
      <p>If you did not request this, please ignore this email.</p>
    </div>
  `;
};

module.exports = resetPasswordTemplate;
