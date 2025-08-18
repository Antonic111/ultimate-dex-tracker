// utils/sendCodeEmail.js
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function sendCodeEmail(user, subject, code, action) {
  if (!process.env.RESEND_API_KEY) {
    console.error('RESEND_API_KEY not set');
    return;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'PokéTracker <noreply@poketracker.com>',
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
