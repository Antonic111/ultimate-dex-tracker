// utils/sendCodeEmail.js
import { Resend } from "resend";

// Check if emails are disabled in development
const forceDevMode = true; // Set to false when you want real emails
const emailsDisabled = forceDevMode || (process.env.NODE_ENV === 'development' && process.env.DISABLE_EMAILS === 'true');

// Debug logging
// removed verbose environment logs

// Only initialize Resend if emails are enabled
const resend = emailsDisabled ? null : new Resend(process.env.RESEND_API_KEY);

export async function sendCodeEmail(user, subject, code, action) {
  // If emails are disabled in development, return mock success
  if (emailsDisabled) {
    // dev-mode email stub logs removed
    return { 
      success: true, 
      message: 'Email would be sent in production',
      devMode: true,
      to: user.email,
      subject: subject,
      code: code,
      action: action
    };
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return;
  }

  if (!process.env.EMAIL_FROM) {
    console.error('EMAIL_FROM not set');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `Ultimate Dex Tracker <${process.env.EMAIL_FROM}>`,
      to: [user.email],
      subject: subject,
      html: `
        <h2>${subject}</h2>
        <p>Hello ${user.username},</p>
        <p>Your verification code for ${action} is: <strong>${code}</strong></p>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      `
    });

    if (error) {
      console.error('Error sending email:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
