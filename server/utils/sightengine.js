/**
 * Sightengine AI Image Content Moderation Service
 * 
 * Inspects uploaded images for NSFW/nudity, violence/gore, offensive material,
 * and malicious content before saving to the server.
 */

export async function moderateImage(imageBuffer, mimeType = "image/jpeg", fileName = "avatar.jpg") {
  const apiUser = (process.env.SIGHTENGINE_API_USER || "").trim();
  const apiSecret = (process.env.SIGHTENGINE_API_SECRET || "").trim();

  // In development without credentials, log warning and permit upload
  if (!apiUser || !apiSecret) {
    console.warn(
      "[Sightengine] SIGHTENGINE_API_USER or SIGHTENGINE_API_SECRET is missing from environment. Skipping AI check."
    );
    return { approved: true, reason: null };
  }

  try {
    console.log(`[Sightengine] Checking image (${mimeType}, ${(imageBuffer.length / 1024).toFixed(1)} KB) with API User: ${apiUser.substring(0, 4)}***`);

    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: mimeType });
    formData.append("media", blob, fileName);
    formData.append("models", "nudity-2.0,wad,offensive,scam,gore");
    formData.append("api_user", apiUser);
    formData.append("api_secret", apiSecret);

    const response = await fetch("https://api.sightengine.com/1.0/check.json", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Sightengine] HTTP error ${response.status}:`, errorText);
      return { approved: false, reason: "Image moderation service is temporarily unavailable. Please try again later." };
    }

    const data = await response.json();
    console.log("[Sightengine] Response data:", JSON.stringify(data));

    if (data.status !== "success") {
      console.error("[Sightengine] Moderation failed:", data.error?.message || data);
      return { approved: false, reason: data.error?.message || "Failed to moderate image." };
    }

    // Inspect nudity scores (nudity-2.0)
    const nudity = data.nudity || {};
    const sexualActivity = nudity.sexual_activity || 0;
    const sexualDisplay = nudity.sexual_display || 0;
    const erotica = nudity.erotica || 0;
    const verySuggestive = nudity.very_suggestive || 0;
    const suggestive = nudity.suggestive || 0;
    const mildlySuggestive = nudity.mildly_suggestive || 0;
    const safeScore = nudity.safe !== undefined ? nudity.safe : 1;

    const isNsfw =
      sexualActivity > 0.08 ||
      sexualDisplay > 0.08 ||
      erotica > 0.15 ||
      verySuggestive > 0.25 ||
      suggestive > 0.45 ||
      mildlySuggestive > 0.70 ||
      safeScore < 0.50;

    if (isNsfw) {
      console.warn(`[Sightengine] BLOCKED NSFW: act=${sexualActivity}, disp=${sexualDisplay}, ero=${erotica}, very_sugg=${verySuggestive}, safe=${safeScore}`);
      return {
        approved: false,
        reason: "Image was flagged for containing explicit, suggestive, or NSFW content.",
      };
    }

    // Inspect gore / violence
    if ((data.gore?.prob || 0) > 0.35) {
      console.warn(`[Sightengine] BLOCKED GORE: ${data.gore?.prob}`);
      return {
        approved: false,
        reason: "Image was flagged for containing graphic violence or gore.",
      };
    }

    // Inspect offensive / hate symbols
    if ((data.offensive?.prob || 0) > 0.35) {
      console.warn(`[Sightengine] BLOCKED OFFENSIVE: ${data.offensive?.prob}`);
      return {
        approved: false,
        reason: "Image was flagged for containing offensive, hateful, or inappropriate content.",
      };
    }

    // Inspect scam / fraud
    if ((data.scam?.prob || 0) > 0.50) {
      console.warn(`[Sightengine] BLOCKED SCAM: ${data.scam?.prob}`);
      return {
        approved: false,
        reason: "Image was flagged for containing deceptive or fraudulent content.",
      };
    }

    // Inspect weapons / drugs
    if ((data.weapon || 0) > 0.65 || (data.drugs || 0) > 0.65) {
      console.warn(`[Sightengine] BLOCKED WEAPONS/DRUGS`);
      return {
        approved: false,
        reason: "Image was flagged for containing prohibited materials.",
      };
    }

    console.log("[Sightengine] Image APPROVED.");
    return { approved: true, reason: null };
  } catch (error) {
    console.error("[Sightengine] Unexpected moderation error:", error);
    return {
      approved: false,
      reason: "An error occurred while moderating the image. Please try again.",
    };
  }
}
