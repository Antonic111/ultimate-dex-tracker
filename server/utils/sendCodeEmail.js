// utils/sendCodeEmail.js
import { Resend } from "resend";

const BASE_URL = "https://www.ultimatedextracker.com";

// Email image assets are hosted on the live site (public/ folder, committed to git).
// Base64 data URIs are NOT used because Outlook/Hotmail truncate them for images > ~8KB.
const EMAIL_ASSETS = {
  yellow:   { logo: `${BASE_URL}/Email_Logo_yellow.png`,   clock: `${BASE_URL}/email-icons/clock_yellow.png`,   lock: `${BASE_URL}/email-icons/lock_yellow.png`,   shield: `${BASE_URL}/email-icons/shield_yellow.png`   },
  orange:   { logo: `${BASE_URL}/Email_Logo_orange.png`,   clock: `${BASE_URL}/email-icons/clock_orange.png`,   lock: `${BASE_URL}/email-icons/lock_orange.png`,   shield: `${BASE_URL}/email-icons/shield_orange.png`   },
  lavender: { logo: `${BASE_URL}/Email_Logo_lavender.png`, clock: `${BASE_URL}/email-icons/clock_lavender.png`, lock: `${BASE_URL}/email-icons/lock_lavender.png`, shield: `${BASE_URL}/email-icons/shield_lavender.png` },
  blue:     { logo: `${BASE_URL}/Email_Logo_blue.png`,     clock: `${BASE_URL}/email-icons/clock_blue.png`,     lock: `${BASE_URL}/email-icons/lock_blue.png`,     shield: `${BASE_URL}/email-icons/shield_blue.png`     },
  red:      { logo: `${BASE_URL}/Email_Logo_red.png`,      clock: `${BASE_URL}/email-icons/clock_red.png`,      lock: `${BASE_URL}/email-icons/lock_red.png`,       shield: `${BASE_URL}/email-icons/shield_red.png`      },
};

// Check if emails are disabled in development
// Only disable if explicitly set to 'true', otherwise allow emails in development
const emailsDisabled = process.env.NODE_ENV === 'development' && process.env.DISABLE_EMAILS === 'true';

// Debug logging - more detailed for localhost testing
// Only log in development to avoid noise in production
if (process.env.NODE_ENV !== 'production') {
  console.log('📧 Email configuration:', {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    DISABLE_EMAILS: process.env.DISABLE_EMAILS || 'not set',
    RESEND_API_KEY: process.env.RESEND_API_KEY ? `Set (${process.env.RESEND_API_KEY.substring(0, 10)}...)` : '❌ Not set',
    EMAIL_FROM: process.env.EMAIL_FROM || '❌ Not set',
    emailsDisabled: emailsDisabled ? '⚠️ DISABLED' : '✅ ENABLED'
  });
}

// Only initialize Resend if emails are enabled
let resend = null;

function initializeResend() {
  if (!resend) {
    if (!process.env.RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY not set');
    }
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

/**
 * Generates email HTML matching the exact site grey theme (#181818 / #242424)
 * with dedicated per-action color themes (Yellow, Orange, Lavender, Blue, Red).
 */
export function generateEmailHtml({ username, subject, code, action }) {
  const normAction = (action || '').toLowerCase();
  
  let theme = 'yellow';
  let accentHex = '#ffe76a';
  let badgeBg = 'rgba(255, 231, 106, 0.12)';
  let badgeBorder = 'rgba(255, 231, 106, 0.4)';
  let badgeText = 'VERIFICATION CODE';
  let headlineText = 'Verify your account';
  let actionDescription = 'Enter this code to complete your verification for Ultimate Dex Tracker.';
  let didNotRequestTitle = "Didn't request this code?";
  let didNotRequestText = 'You can safely ignore this email — your account will remain secure.';

  if (normAction.includes('register') || (normAction.includes('verification') && !normAction.includes('email change') && !normAction.includes('new email') && !normAction.includes('password change'))) {
    theme = 'yellow';
    accentHex = '#ffe76a';
    badgeBg = 'rgba(255, 231, 106, 0.12)';
    badgeBorder = 'rgba(255, 231, 106, 0.4)';
    badgeText = 'ACCOUNT VERIFICATION';
    headlineText = 'Verify your account';
    actionDescription = 'Enter this code to complete your registration and begin tracking your collection across every game.';
    didNotRequestTitle = "Didn't create an account?";
    didNotRequestText = 'You can safely ignore this email. No account will be activated without this code.';
  } else if (normAction.includes('password reset') || normAction.includes('reset')) {
    theme = 'orange';
    accentHex = '#f97316';
    badgeBg = 'rgba(249, 115, 22, 0.12)';
    badgeBorder = 'rgba(249, 115, 22, 0.4)';
    badgeText = 'PASSWORD RESET';
    headlineText = 'Reset your password';
    actionDescription = 'Enter this code to reset the password for your Ultimate Dex Tracker account.';
    didNotRequestTitle = "Didn't request a password reset?";
    didNotRequestText = 'If you did not request this, please secure your account or change your password immediately.';
  } else if (normAction.includes('new email')) {
    theme = 'lavender';
    accentHex = '#c084fc';
    badgeBg = 'rgba(192, 132, 252, 0.12)';
    badgeBorder = 'rgba(192, 132, 252, 0.35)';
    badgeText = 'NEW EMAIL VERIFICATION';
    headlineText = 'Verify your new email';
    actionDescription = 'Enter this code to confirm and link this new email address to your Ultimate Dex Tracker account.';
    didNotRequestTitle = "Didn't request this change?";
    didNotRequestText = 'You can safely ignore this email — your account email will remain unchanged.';
  } else if (normAction.includes('email change')) {
    theme = 'lavender';
    accentHex = '#c084fc';
    badgeBg = 'rgba(192, 132, 252, 0.12)';
    badgeBorder = 'rgba(192, 132, 252, 0.35)';
    badgeText = 'EMAIL CHANGE REQUEST';
    headlineText = 'Verify your email change';
    actionDescription = 'Enter this code to confirm the email address change for your Ultimate Dex Tracker account.';
    didNotRequestTitle = "Didn't request this change?";
    didNotRequestText = 'You can safely ignore this email — your account email will remain unchanged.';
  } else if (normAction.includes('password change')) {
    theme = 'blue';
    accentHex = '#3b82f6';
    badgeBg = 'rgba(59, 130, 246, 0.12)';
    badgeBorder = 'rgba(59, 130, 246, 0.4)';
    badgeText = 'PASSWORD CHANGE';
    headlineText = 'Verify your password change';
    actionDescription = 'Enter this code to confirm your new password for your Ultimate Dex Tracker account.';
    didNotRequestTitle = "Didn't request this change?";
    didNotRequestText = 'If you did not make this change, please sign in and secure your account immediately.';
  } else if (normAction.includes('deletion') || normAction.includes('delete')) {
    theme = 'red';
    accentHex = '#ef4444';
    badgeBg = 'rgba(239, 68, 68, 0.12)';
    badgeBorder = 'rgba(239, 68, 68, 0.4)';
    badgeText = 'ACCOUNT DELETION';
    headlineText = 'Confirm account deletion';
    actionDescription = 'Enter this code to permanently delete your Ultimate Dex Tracker account and all saved Pokémon data.';
    didNotRequestTitle = "Didn't request account deletion?";
    didNotRequestText = 'Warning: This action is permanent. If you did not request this, ignore this email and your account will remain safe.';
  }

  const assets = EMAIL_ASSETS[theme] || EMAIL_ASSETS['yellow'];

  // Format code with spaces for crisp display
  const formattedCode = String(code || '').split('').join(' ');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0e0e0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #ffffff; -webkit-font-smoothing: antialiased;">
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #0e0e0e; padding: 36px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card: Exactly matching website grey theme (#181818) -->
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 500px; background-color: #181818; border: 1px solid #2e2e2e; border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.7);">
          
          <!-- Top Header: Official Site Logo (hosted on Vercel, themed per action) -->
          <tr>
            <td style="padding: 34px 28px 16px 28px; text-align: center; background-color: #181818;">
              <img 
                src="${assets.logo}" 
                alt="Ultimate Dex Tracker" 
                width="300" 
                style="display: block; width: 300px; max-width: 90%; height: auto; margin: 0 auto; border: 0; outline: none;" 
              />
              <div style="margin-top: 10px; font-size: 13px; color: #9ca3af; letter-spacing: 0.2px; font-weight: 500;">
                Track Your Pokémon Journey Across Generations
              </div>
            </td>
          </tr>


          <!-- Action Pill Badge -->
          <tr>
            <td align="center" style="padding: 6px 28px 0 28px;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background-color: ${badgeBg}; border: 1.5px solid ${badgeBorder}; border-radius: 24px; padding: 7px 18px; text-align: center;">
                    <span style="font-size: 12px; font-weight: 800; color: ${accentHex}; letter-spacing: 0.8px; text-transform: uppercase;">
                      ${badgeText}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content Area -->
          <tr>
            <td style="padding: 24px 32px 32px 32px; text-align: center;">
              
              <!-- Solid Clean White Headline (No Color Splitting) -->
              <h1 style="margin: 0 0 16px 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: -0.3px; line-height: 1.25;">
                ${headlineText}
              </h1>

              <!-- Greeting & Description -->
              <p style="margin: 0 0 8px 0; font-size: 15px; color: #d1d5db; line-height: 1.5;">
                Hello <strong style="color: #ffffff;">${username || 'Trainer'}</strong>,
              </p>
              <p style="margin: 0 0 26px 0; font-size: 14px; color: #9ca3af; line-height: 1.55; max-width: 400px; margin-left: auto; margin-right: auto;">
                ${actionDescription}
              </p>

              <!-- Verification Code Box: High contrast with themed accent border -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="margin-bottom: 24px;">
                <tr>
                  <td align="center">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #121212; border: 1.5px solid ${accentHex}; border-radius: 14px; padding: 22px 16px; text-align: center; box-shadow: 0 0 20px ${accentHex}20, inset 0 2px 6px rgba(0,0,0,0.5);">
                      <tr>
                        <td align="center">
                          <span style="font-family: 'Courier New', Courier, monospace, monospace; font-size: 38px; font-weight: 900; color: ${accentHex}; letter-spacing: 12px; display: inline-block; padding-left: 12px; text-shadow: 0 0 14px ${accentHex}50;">
                            ${formattedCode}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Dual Info Card: Matching site sub-box grey (#242424) -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #242424; border: 1px solid #333333; border-radius: 12px; padding: 14px 16px; margin-bottom: 24px;">
                <tr>
                  <!-- Left side: 10 mins -->
                  <td width="48%" style="vertical-align: middle; text-align: left;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 10px;">
                          <img 
                            src="${assets.clock}" 
                            alt="" 
                            width="32" 
                            height="32" 
                            style="display: block; width: 32px; height: 32px; border: 0;" 
                          />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 13px; font-weight: 700; color: #ffffff; display: block;">Expires in 10 minutes</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                  
                  <!-- Divider -->
                  <td width="4%" style="border-left: 1px solid #383838; font-size: 0; line-height: 0;">&nbsp;</td>

                  <!-- Right side: Security -->
                  <td width="48%" style="vertical-align: middle; text-align: left; padding-left: 8px;">
                    <table role="presentation" border="0" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="vertical-align: middle; padding-right: 10px;">
                          <img 
                            src="${assets.lock}" 
                            alt="" 
                            width="32" 
                            height="32" 
                            style="display: block; width: 32px; height: 32px; border: 0;" 
                          />
                        </td>
                        <td style="vertical-align: middle;">
                          <span style="font-size: 13px; font-weight: 700; color: #ffffff; display: block;">Never share this code</span>
                          <span style="font-size: 11px; color: #9ca3af; display: block;">with anyone.</span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- Bottom Notice: Didn't request this change? -->
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="text-align: left;">
                <tr>
                  <td width="36" style="vertical-align: top; padding-right: 10px; padding-top: 2px;">
                    <img 
                      src="${assets.shield}" 
                      alt="" 
                      width="28" 
                      height="28" 
                      style="display: block; width: 28px; height: 28px; border: 0;" 
                    />
                  </td>
                  <td style="vertical-align: top; text-align: left;">
                    <strong style="font-size: 13px; color: #ffffff; display: block; margin-bottom: 2px;">
                      ${didNotRequestTitle}
                    </strong>
                    <p style="margin: 0; font-size: 12px; color: #888888; line-height: 1.45;">
                      ${didNotRequestText}
                    </p>
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 16px 28px 28px 28px; text-align: center; border-top: 1px solid #242424;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #71717a;">
                © Ultimate Dex Tracker • All Rights Reserved
              </p>
              <p style="margin: 0; font-size: 13px;">
                <a href="https://www.ultimatedextracker.com" target="_blank" style="color: ${accentHex}; text-decoration: none; font-weight: 800; letter-spacing: 0.2px;">
                  ultimatedextracker.com
                </a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendCodeEmail(user, subject, code, action, options = {}) {
  const forceSend = options.forceSend || false;

  // If emails are disabled in development and not forced, return mock success
  if (emailsDisabled && !forceSend) {
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
    
    const emailHtml = generateEmailHtml({
      username: user.username,
      subject,
      code,
      action
    });

    const emailPayload = {
      from: `Ultimate Dex Tracker <${process.env.EMAIL_FROM}>`,
      to: [user.email],
      subject: subject,
      html: emailHtml
    };

    const { data, error } = await resendInstance.emails.send(emailPayload);

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
