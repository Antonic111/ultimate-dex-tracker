// utils/sendCodeEmail.js
import { Resend } from "resend";

export async function sendCodeEmail(user, subject, code, context = "verification") {
  const resend = new Resend(process.env.RESEND_API_KEY);

  const html = `
    <h2>Your ${context} code</h2>
    <p>Your 6-digit code is:</p>
    <h1 style="letter-spacing: 4px;">${code}</h1>
    <p>This code will expire in 10 minutes.</p>
    <p>If you didn't request this, you can ignore this email.</p>
  `;

  try {
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject,
      html,
    });
    console.log("📧 Email sent:", result);
  } catch (err) {
    console.error("❌ Email send failed:", err);
    throw new Error("Failed to send email");
  }
}
