import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const POKEAPI_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/';
const OUTPUT_DIR = path.join(projectRoot, 'public', 'Sprites', 'trimmed', 'pokemon');

async function collectAllSpriteUrls() {
  const urlMap = new Map(); // url -> relativePath

  function addUrl(url) {
    if (!url || typeof url !== 'string') return;
    if (!url.includes(POKEAPI_BASE)) return;

    const relative = url.replace(POKEAPI_BASE, '');
    if (!urlMap.has(url)) {
      urlMap.set(url, relative);
    }
  }

  // 1. Base Pokemon
  const pokemonPath = path.join(projectRoot, 'src', 'data', 'pokemon.json');
  if (fs.existsSync(pokemonPath)) {
    const pokemonList = JSON.parse(fs.readFileSync(pokemonPath, 'utf8'));
    for (const p of pokemonList) {
      if (p.sprites) {
        addUrl(p.sprites.front_default);
        addUrl(p.sprites.front_shiny);
        addUrl(p.sprites.home_default);
        addUrl(p.sprites.home_shiny);
      }
    }
  }

  // 2. Forms
  const formsDir = path.join(projectRoot, 'src', 'data', 'forms');
  if (fs.existsSync(formsDir)) {
    const files = fs.readdirSync(formsDir);
    for (const file of files) {
      if (!file.endsWith('.json')) continue;
      const formList = JSON.parse(fs.readFileSync(path.join(formsDir, file), 'utf8'));
      for (const f of formList) {
        if (f.sprites) {
          addUrl(f.sprites.front_default);
          addUrl(f.sprites.front_shiny);
          addUrl(f.sprites.home_default);
          addUrl(f.sprites.home_shiny);
        }
      }
    }
  }

  return urlMap;
}

async function fetchWithRetry(url, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) {
        if (res.status === 404) return null; // Not found on PokeAPI
        throw new Error(`HTTP ${res.status}`);
      }
      const arrayBuffer = await res.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 500 * attempt));
    }
  }
  return null;
}

async function processSprite(url, relativePath) {
  const destPath = path.join(OUTPUT_DIR, relativePath);

  // Skip if already processed and non-empty
  if (fs.existsSync(destPath)) {
    const stat = fs.statSync(destPath);
    if (stat.size > 100) {
      return { status: 'skipped' };
    }
  }

  fs.mkdirSync(path.dirname(destPath), { recursive: true });

  const buffer = await fetchWithRetry(url);
  if (!buffer) {
    return { status: 'not_found' };
  }

  try {
    // Proportional cushion: 2px for pixel sprites, 8px for high-res Home sprites
    const metadata = await sharp(buffer).metadata();
    const pad = (metadata.width && metadata.width > 200) ? 6 : 2;

    const trimmedBuffer = await sharp(buffer)
      .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .extend({
        top: pad,
        bottom: pad,
        left: pad,
        right: pad,
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png({ compressionLevel: 9 })
      .toBuffer();

    fs.writeFileSync(destPath, trimmedBuffer);
    return { status: 'trimmed' };
  } catch {
    // If trimming fails (e.g. fully transparent or single color), write original
    fs.writeFileSync(destPath, buffer);
    return { status: 'original_fallback' };
  }
}

async function main() {
  console.log('Collecting sprite URLs from pokemon.json and forms...');
  const urlMap = await collectAllSpriteUrls();
  const items = Array.from(urlMap.entries());
  console.log(`Found ${items.length} total unique sprite URLs to download & trim.`);

  const CONCURRENCY = 20;
  let completed = 0;
  let skipped = 0;
  let trimmed = 0;
  let failed = 0;

  async function worker(queue) {
    while (queue.length > 0) {
      const [url, relativePath] = queue.shift();
      try {
        const result = await processSprite(url, relativePath);
        if (result.status === 'skipped') skipped++;
        else trimmed++;
      } catch (err) {
        failed++;
        console.warn(`Failed: ${relativePath} (${err.message})`);
      }
      completed++;
      if (completed % 100 === 0 || completed === items.length) {
        console.log(`[${completed}/${items.length}] Trimmed: ${trimmed}, Skipped: ${skipped}, Failed: ${failed}`);
      }
    }
  }

  const queue = [...items];
  const workers = Array.from({ length: CONCURRENCY }, () => worker(queue));
  await Promise.all(workers);

  console.log('\n--- Sprite Trimming Complete ---');
  console.log(`Total: ${items.length} | Processed/Trimmed: ${trimmed} | Already existed: ${skipped} | Failed: ${failed}`);
  console.log(`Sprites saved to: ${OUTPUT_DIR}`);
}

main().catch(err => {
  console.error('Fatal error trimming sprites:', err);
  process.exit(1);
});
