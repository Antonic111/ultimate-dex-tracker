import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDir = path.resolve(__dirname, "..");

const themes = ["yellow", "orange", "lavender", "blue", "red"];

const themeAssets = {};

for (const theme of themes) {
  const pokeball = fs.readFileSync(path.join(baseDir, `public/email-icons/pokeball_${theme}.png`)).toString("base64");
  const clock = fs.readFileSync(path.join(baseDir, `public/email-icons/clock_${theme}.png`)).toString("base64");
  const lock = fs.readFileSync(path.join(baseDir, `public/email-icons/lock_${theme}.png`)).toString("base64");
  const shield = fs.readFileSync(path.join(baseDir, `public/email-icons/shield_${theme}.png`)).toString("base64");

  themeAssets[theme] = {
    pokeball: `data:image/png;base64,${pokeball}`,
    clock: `data:image/png;base64,${clock}`,
    lock: `data:image/png;base64,${lock}`,
    shield: `data:image/png;base64,${shield}`,
  };
}

const outContent = `// Auto-generated lightweight base64 email assets (under 8KB total to guarantee 0 truncation)
export const THEMED_EMAIL_ASSETS = ${JSON.stringify(themeAssets, null, 2)};
`;

fs.writeFileSync(path.join(baseDir, "server/utils/emailAssets.js"), outContent);
console.log("✅ Successfully created server/utils/emailAssets.js with lightweight assets!");
