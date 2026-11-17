/** The API refuses photos over 700 KB (and the whole request over 1 MB); aim well under that. */
export const PHOTO_TARGET_BYTES = 550 * 1024;

const dataUrlBytes = (d: string) => Math.ceil(((d.length - d.indexOf(',') - 1) * 3) / 4);

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('This file is not a photo the phone can read.')); };
    img.src = url;
  });
}

/**
 * Shrinks a camera photo to a JPEG small enough to send on a weak connection and to keep on the phone while offline:
 * longest side 1280 px, then smaller and lower quality until it fits.
 */
export async function shrinkPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo.');
  const img = await loadImage(file);
  for (const [side, quality] of [[1280, 0.72], [1024, 0.62], [800, 0.55], [640, 0.5]] as const) {
    const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('This phone cannot prepare the photo.');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const out = canvas.toDataURL('image/jpeg', quality);
    if (dataUrlBytes(out) <= PHOTO_TARGET_BYTES) return out;
  }
  throw new Error('The photo is too large. Take it again a little further away.');
}
