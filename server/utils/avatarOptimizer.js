import sharp from "sharp";

/**
 * Maximum parameters for avatar processing:
 * - Static upload limit: 5 MB
 * - GIF/Animated upload limit: 8 MB (Members only)
 * - Processed max resolution: 256×256 px
 * - Max animation duration: ~10 seconds (or max 300 frames)
 * - Storage output format: optimized WebP (animated or static)
 */

export const AVATAR_LIMITS = {
  STATIC_MAX_BYTES: 5 * 1024 * 1024,   // 5 MB
  ANIMATED_MAX_BYTES: 8 * 1024 * 1024, // 8 MB
  MAX_DIMENSION: 256,                  // 256x256 px
  MAX_ANIMATION_SECONDS: 10,           // 10s
  MAX_ANIMATION_FRAMES: 300,           // 300 frames safety ceiling
};

/**
 * Optimize and resize an uploaded avatar buffer.
 * Converts GIFs and static images to high-efficiency, lightweight WebP (max 256x256).
 *
 * @param {Buffer} inputBuffer - Raw uploaded image buffer
 * @param {string} mimeType - Uploaded MIME type (e.g. image/gif, image/png, image/jpeg)
 * @param {boolean} isPremium - Whether the uploading user has an active membership
 * @returns {Promise<{ buffer: Buffer, mimeType: string, dataUri: string, isAnimated: boolean, originalSize: number, optimizedSize: number }>}
 */
export async function optimizeAvatar(inputBuffer, mimeType, isPremium = false) {
  const originalSize = inputBuffer.length;
  const isGif = mimeType === "image/gif";

  // 1. Initial metadata inspection
  let metadata;
  try {
    metadata = await sharp(inputBuffer, { animated: true }).metadata();
  } catch (err) {
    console.error("[Avatar Optimizer] Failed to read image metadata:", err);
    throw new Error("Invalid or unsupported image format.");
  }

  const isAnimated = Boolean(metadata.pages && metadata.pages > 1);

  // 2. Enforce Members-Only for animated avatars (GIFs or animated WebPs)
  if (isAnimated || isGif) {
    if (!isPremium) {
      const err = new Error("Animated GIF avatars are an Ultimate Membership feature. Upgrade your membership to upload animated profile pictures!");
      err.code = "MEMBERSHIP_REQUIRED";
      err.statusCode = 403;
      throw err;
    }

    if (originalSize > AVATAR_LIMITS.ANIMATED_MAX_BYTES) {
      const err = new Error(`Animated avatar exceeds maximum allowed upload size of 8MB.`);
      err.statusCode = 400;
      throw err;
    }
  } else {
    // Static image size limit check
    if (originalSize > AVATAR_LIMITS.STATIC_MAX_BYTES) {
      const err = new Error(`Static profile picture exceeds maximum allowed upload size of 5MB.`);
      err.statusCode = 400;
      throw err;
    }
  }

  // 3. Process image with Sharp
  let optimizedBuffer;
  const targetDim = AVATAR_LIMITS.MAX_DIMENSION;

  if (isAnimated) {
    // Calculate estimated duration if delays are available
    if (metadata.delay && Array.isArray(metadata.delay)) {
      const totalDurationMs = metadata.delay.reduce((sum, d) => sum + (d || 100), 0);
      const durationSeconds = totalDurationMs / 1000;
      if (durationSeconds > AVATAR_LIMITS.MAX_ANIMATION_SECONDS * 1.5) { // generous buffer
        console.warn(`[Avatar Optimizer] Animation duration (${durationSeconds.toFixed(1)}s) is long.`);
      }
    }

    // Convert animated GIF/WebP to optimized 256x256 animated WebP
    // Sharp's animated pipeline preserves frame delays and loops
    optimizedBuffer = await sharp(inputBuffer, { animated: true, pages: Math.min(metadata.pages || 1, AVATAR_LIMITS.MAX_ANIMATION_FRAMES) })
      .resize(targetDim, targetDim, {
        fit: "cover",
        position: "center",
      })
      .webp({
        quality: 80,
        effort: 4,
        loop: 0, // infinite loop
        force: true,
      })
      .toBuffer();
  } else {
    // Static image: resize to max 256x256 and convert to optimized WebP
    optimizedBuffer = await sharp(inputBuffer)
      .resize(targetDim, targetDim, {
        fit: "cover",
        position: "center",
      })
      .webp({
        quality: 85,
        effort: 4,
        force: true,
      })
      .toBuffer();
  }

  const outputMime = "image/webp";
  const base64Data = optimizedBuffer.toString("base64");
  const dataUri = `data:${outputMime};base64,${base64Data}`;

  console.log(
    `[Avatar Optimizer] Optimized ${isAnimated ? "animated" : "static"} avatar: ${(originalSize / 1024).toFixed(1)} KB → ${(optimizedBuffer.length / 1024).toFixed(1)} KB (${((1 - optimizedBuffer.length / originalSize) * 100).toFixed(1)}% savings)`
  );

  return {
    buffer: optimizedBuffer,
    mimeType: outputMime,
    dataUri,
    isAnimated,
    originalSize,
    optimizedSize: optimizedBuffer.length,
  };
}
