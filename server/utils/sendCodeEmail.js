// utils/sendCodeEmail.js
import { Resend } from "resend";

// Check if emails are disabled in development
const emailsDisabled = process.env.NODE_ENV === 'development' && process.env.DISABLE_EMAILS === 'true';

// Debug logging
console.log('Email configuration:', {
  NODE_ENV: process.env.NODE_ENV,
  DISABLE_EMAILS: process.env.DISABLE_EMAILS,
  RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Set' : 'Not set',
  EMAIL_FROM: process.env.EMAIL_FROM ? 'Set' : 'Not set',
  emailsDisabled
});

// Only initialize Resend if emails are enabled
let resend = null;

function initializeResend() {
  if (!resend && !emailsDisabled) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

export async function sendCodeEmail(user, subject, code, action) {
  // If emails are disabled in development, return mock success
  if (emailsDisabled) {
    console.log(`[DEV MODE] Email would be sent: ${subject} to ${user.email} with code ${code}`);
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
    return { success: false, error: 'RESEND_API_KEY not configured' };
  }

  if (!process.env.EMAIL_FROM) {
    console.error('EMAIL_FROM not set');
    return { success: false, error: 'EMAIL_FROM not configured' };
  }

  try {
    const resendInstance = initializeResend();
    if (!resendInstance) {
      return { success: false, error: 'Email service not available' };
    }
    
    const { data, error } = await resendInstance.emails.send({
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

    console.log('Email sent successfully:', { to: user.email, subject, action });
    return data;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
