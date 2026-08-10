// Génère les icônes de l'appli (favicon, iOS, manifest 192/512 + maskable) à partir
// du poulpe KOTÉ MORIS — poulpe blanc + pin/yeux jaunes sur fond teal.
// Usage : node scripts/gen-icons.mjs
import sharp from "sharp";

const TEAL = "#087e8b";
const WHITE = "#ffffff";
const YELLOW = "#f4c95d";

// Mêmes tentacules que le composant Logo (repère 0..24).
const ARM_DIRS = [
  [-0.96, 0.28], [-0.68, 0.74], [-0.38, 0.95], [-0.13, 1.02],
  [0.13, 1.02], [0.38, 0.95], [0.68, 0.74], [0.96, 0.28],
];
const CX = 12;
const CY = 11;

function armPath([dx, dy]) {
  const len = Math.hypot(dx, dy);
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const at = (d, o) =>
    `${(CX + ux * d + px * o).toFixed(2)} ${(CY + uy * d + py * o).toFixed(2)}`;
  const amp = 1.5;
  return `M ${at(2.8, 0)} Q ${at(4.4, amp)} ${at(6.2, 0)} Q ${at(8.0, -amp)} ${at(9.4, -amp * 0.55)}`;
}

function octopus() {
  const arms = ARM_DIRS.map((d) => `<path d="${armPath(d)}"/>`).join("");
  return `
    <g fill="none" stroke="${WHITE}" stroke-width="1.5" stroke-linecap="round">${arms}</g>
    <path d="M12 0.6 C 10.8 0.6 9.8 1.6 9.8 2.9 C 9.8 4.2 12 6 12 6 C 12 6 14.2 4.2 14.2 2.9 C 14.2 1.6 13.2 0.6 12 0.6 Z" fill="${YELLOW}"/>
    <path d="M12 2.8 C 7.9 2.8 5.1 5.9 5.1 9.7 C 5.1 11.8 6.1 13 7.5 13.2 C 9 13.4 15 13.4 16.5 13.2 C 17.9 13 18.9 11.8 18.9 9.7 C 18.9 5.9 16.1 2.8 12 2.8 Z" fill="${WHITE}"/>
    <circle cx="9.9" cy="9.2" r="1.1" fill="${YELLOW}"/>
    <circle cx="14.1" cy="9.2" r="1.1" fill="${YELLOW}"/>
    <path d="M10.4 11.1 C 11.3 12 12.7 12 13.6 11.1" fill="none" stroke="${TEAL}" stroke-width="1.2" stroke-linecap="round"/>
  `;
}

// Centre le poulpe (bbox ~ centre (12, 10.7)) dans un canvas 100×100.
function iconSvg({ maskable = false } = {}) {
  const s = maskable ? 2.9 : 3.5; // plus de marge pour le maskable (zone de sécurité)
  const tx = (50 - 12 * s).toFixed(2);
  const ty = (50 - 10.7 * s).toFixed(2);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <rect width="100" height="100" fill="${TEAL}"/>
    <g transform="translate(${tx}, ${ty}) scale(${s})">${octopus()}</g>
  </svg>`;
}

async function render(svg, out, size) {
  await sharp(Buffer.from(svg), { density: 640 }).resize(size, size).png().toFile(out);
  console.log("✓", out, size + "px");
}

const std = iconSvg();
const mask = iconSvg({ maskable: true });

await render(std, "public/icon-512.png", 512);
await render(mask, "public/icon-512-maskable.png", 512);
await render(std, "public/icon-192.png", 192);
await render(std, "app/apple-icon.png", 180);
await render(std, "app/icon.png", 32);
