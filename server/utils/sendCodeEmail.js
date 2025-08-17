// utils/sendCodeEmail.js
import { Resend } from "resend";

export async function sendCodeEmail(user, subject, code, context = "verification") {
  console.log(`📧 Sending ${context} email to:`, user.email);
  console.log(`📧 Email subject:`, subject);
  console.log(`📧 Verification code:`, code);
  
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY not set');
    throw new Error("Email service not configured");
  }

  const html = `
    <h2>Your ${context} code</h2>
    <p>Your 6-digit code is:</p>
    <h1 style="letter-spacing: 4px;">${code}</h1>
    <p>This code will expire in 10 minutes.</p>
    <p>If you didn't request this, you can ignore this email.</p>
  `;

  try {
    console.log('📧 Attempting to send email via Resend...');
    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject,
      html,
    });
    console.log("✅ Email sent successfully:", result);
    return result;
  } catch (err) {
    console.error("❌ Email send failed:", err);
    throw new Error("Failed to send email");
  }
}
