import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { sendCodeEmail } from "../server/utils/sendCodeEmail.js";

// Load environment variables
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../server/.env.local") });
dotenv.config({ path: path.resolve(__dirname, "../server/.env") });

const targetEmail = process.argv[2] || "antoniodeluca111@hotmail.com";
const username = "Antonic";

console.log("\n=======================================================");
console.log("🚀 ULTIMATE DEX TRACKER - EMAIL TEST RUNNER");
console.log("=======================================================");
console.log(`📬 Target Recipient: ${targetEmail}`);
console.log(`🔑 Resend API Key:  ${process.env.RESEND_API_KEY ? "✅ Configured" : "❌ Missing"}`);
console.log(`📤 Sender Address:  ${process.env.EMAIL_FROM || "❌ Missing"}`);
console.log("=======================================================\n");

if (!process.env.RESEND_API_KEY) {
  console.error("❌ Error: RESEND_API_KEY is not set in .env or .env.local!");
  process.exit(1);
}

if (!process.env.EMAIL_FROM) {
  console.error("❌ Error: EMAIL_FROM is not set in .env or .env.local!");
  process.exit(1);
}

const testEmails = [
  {
    type: "1. Account Registration / Verification",
    subject: "Verify Your Account",
    code: "482910",
    action: "email verification"
  },
  {
    type: "2. Password Reset",
    subject: "Reset Your Password",
    code: "719304",
    action: "password reset"
  },
  {
    type: "3. Email Change (Current Email)",
    subject: "Email Change Verification",
    code: "530182",
    action: "email change verification"
  },
  {
    type: "4. Email Change (New Email)",
    subject: "Verify Your New Email",
    code: "649271",
    action: "new email verification"
  },
  {
    type: "5. Password Change Verification",
    subject: "Password Change Verification",
    code: "820491",
    action: "password change verification"
  },
  {
    type: "6. Account Deletion Confirmation",
    subject: "Delete Your Account",
    code: "991038",
    action: "account deletion"
  }
];

async function runTest() {
  const user = {
    username,
    email: targetEmail
  };

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < testEmails.length; i++) {
    const item = testEmails[i];
    console.log(`[${i + 1}/${testEmails.length}] Sending ${item.type}...`);
    
    try {
      await sendCodeEmail(user, item.subject, item.code, item.action, { forceSend: true });
      console.log(`   ✅ Sent successfully! (Code: ${item.code})`);
      successCount++;
      
      // Small pause between sends to avoid provider rate limiting
      if (i < testEmails.length - 1) {
        await new Promise(r => setTimeout(r, 1200));
      }
    } catch (err) {
      console.error(`   ❌ Failed to send ${item.type}:`, err?.message || err);
      failCount++;
    }
  }

  console.log("\n=======================================================");
  console.log(`🎉 TEST RUN COMPLETE: ${successCount} sent, ${failCount} failed.`);
  console.log(`📬 Check your inbox at ${targetEmail} (and check spam/junk folder).`);
  console.log("=======================================================\n");
}

runTest().catch((err) => {
  console.error("🔥 Fatal error during test run:", err);
  process.exit(1);
});
