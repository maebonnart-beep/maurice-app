/** Redimensionne/recompresse une image côté client avant envoi en pièce jointe
 *  (évite de dépasser la limite de taille des requêtes serverless Vercel, et
 *  garde les e-mails légers — un jpeg 1400px/qualité 0.75 suffit largement
 *  pour une vérification manuelle avant intégration à l'annuaire). */
async function loadImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    return await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("image load failed"));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function toJpegBlob(img: HTMLImageElement, maxDim: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(img.width * scale));
  canvas.height = Math.max(1, Math.round(img.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas 2d context unavailable");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/jpeg", quality);
  });
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(new Error("readAsDataURL failed"));
    reader.readAsDataURL(blob);
  });
}

const MAX_BASE64_LENGTH = 3_000_000; // ~2.2 Mo décodés, marge sous la limite de payload Vercel.

/** Retourne le contenu base64 (sans préfixe data:) d'une version compressée
 *  du fichier, ou null si même la passe la plus agressive reste trop lourde
 *  (l'appelant doit alors retomber sur le partage natif / mailto). */
export async function compressImageToBase64(file: File): Promise<string | null> {
  const img = await loadImage(file);
  for (const [maxDim, quality] of [
    [1400, 0.75],
    [1000, 0.6],
    [700, 0.5],
  ] as const) {
    const blob = await toJpegBlob(img, maxDim, quality);
    const base64 = await blobToBase64(blob);
    if (base64.length <= MAX_BASE64_LENGTH) return base64;
  }
  return null;
}
