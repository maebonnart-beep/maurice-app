// Détoure le poulpe retravaillé (scripts/octopus-src.png) : fond blanc → transparent,
// rogne. Puis génère l'emblème + toutes les icônes (emblème centré sur fond crème).
import sharp from "sharp";

const SRC = "scripts/octopus-src.png";
const CREAM = "#f6f1e3";

// 1. Détourage : blanc → transparent (alpha selon la distance à la couleur de fond).
const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const corners = [0, (width - 1) * channels, (height - 1) * width * channels, ((height - 1) * width + (width - 1)) * channels];
const ref = [0, 1, 2].map((c) => Math.round(corners.reduce((s, o) => s + data[o + c], 0) / 4));
const lo = 30, hi = 72;
for (let i = 0; i < width * height; i++) {
  const o = i * channels;
  const d = Math.hypot(data[o] - ref[0], data[o + 1] - ref[1], data[o + 2] - ref[2]);
  const a = d <= lo ? 0 : d >= hi ? 255 : Math.round(((d - lo) / (hi - lo)) * 255);
  data[o + 3] = Math.min(data[o + 3], a);
}
const detoured = await sharp(Buffer.from(data), { raw: { width, height, channels } }).png().toBuffer();

// 2. Rogner la bordure transparente → emblème serré (pour l'en-tête, transparent).
await sharp(detoured).trim({ threshold: 12 }).png().toFile("public/octopus-emblem.png");
console.log("✓ public/octopus-emblem.png");

// 3. Icônes : emblème centré sur fond crème (carré), + variante maskable (plus de marge).
async function icon(out, size, pad) {
  const inner = Math.round(size * (1 - pad));
  const emb = await sharp("public/octopus-emblem.png")
    .resize({ width: inner, height: inner, fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer();
  await sharp({ create: { width: size, height: size, channels: 4, background: CREAM } })
    .composite([{ input: emb, gravity: "center" }])
    .png()
    .toFile(out);
  console.log("✓", out, size + "px");
}
await icon("public/icon-512.png", 512, 0.14);
await icon("public/icon-512-maskable.png", 512, 0.28);
await icon("public/icon-192.png", 192, 0.14);
await icon("app/apple-icon.png", 180, 0.14);
await icon("app/icon.png", 32, 0.1);
