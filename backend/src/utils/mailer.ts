import nodemailer from "nodemailer";

export async function sendWalletEmail(
  to: string,
  fullName: string,
  walletNumber: string
) {
  // Use environment variables for safety
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST!,
    port: Number(process.env.SMTP_PORT || 465),
    secure: true, // true for 465, false for 587
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!
    }
  });

  const mailOptions = {
    from: `"SecureBank" <${process.env.SMTP_USER}>`,
    to,
    subject: "Welcome to SecureBank — Your Wallet Has Been Created",
    html: `
      <h3>Hello ${fullName},</h3>
      <p>Welcome to <b>SecureBank</b>! Your wallet has been successfully created.</p>
      <p><strong>Wallet Number:</strong> ${walletNumber}</p>
      <p>You can now log in to your account and start using your wallet for secure transactions.</p>
      <br/>
      <p>Best regards,<br/>The SecureBank Team</p>
    `
  };

  await transporter.sendMail(mailOptions);
}
