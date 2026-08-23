// Détoure le nouveau bandeau (poulpe réduit, fourni 2026-08-23) : fond blanc → transparent,
// rogne, exporte en webp pour remplacer public/bandeau-kotemoris-clair.webp.
import sharp from "sharp";

const SRC = "public/Icones DEF/V4/_check4/ChatGPT Image 23 août 2026, 05_23_03.png";
const OUT = "public/bandeau-kotemoris-clair.webp";

const { data, info } = await sharp(SRC).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const corners = [0, (width - 1) * channels, (height - 1) * width * channels, ((height - 1) * width + (width - 1)) * channels];
const ref = [0, 1, 2].map((c) => Math.round(corners.reduce((s, o) => s + data[o + c], 0) / 4));
const lo = 8, hi = 30;
for (let i = 0; i < width * height; i++) {
  const o = i * channels;
  const d = Math.hypot(data[o] - ref[0], data[o + 1] - ref[1], data[o + 2] - ref[2]);
  const a = d <= lo ? 0 : d >= hi ? 255 : Math.round(((d - lo) / (hi - lo)) * 255);
  data[o + 3] = Math.min(data[o + 3], a);
}
const detoured = await sharp(Buffer.from(data), { raw: { width, height, channels } }).png().toBuffer();
const trimmed = sharp(detoured).trim({ threshold: 10 });
const meta = await trimmed.metadata();
await trimmed.webp({ quality: 92 }).toFile(OUT);
console.log("✓", OUT, meta.width + "x" + meta.height, "aspect", (meta.width / meta.height).toFixed(3));
