/** Shrinks big photos in the browser before upload (phone photos are 3–8 MB;
 *  the storefront never shows more than ~2560px). Falls back to the original
 *  file on any problem, and never touches gif/svg/small files. */
export async function compressImage(file: File): Promise<File> {
  try {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size < 500 * 1024) return file;
    const bitmap = await createImageBitmap(file);
    const MAX = 2000;
    const scale = Math.min(1, MAX / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    bitmap.close?.();
    // Keep PNG/WebP transparency; photos (jpeg) stay jpeg.
    const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/webp';
    const blob = await new Promise<Blob | null>(res => canvas.toBlob(res, type, 0.8));
    if (!blob || blob.size >= file.size) return file;
    const ext = type === 'image/jpeg' ? 'jpg' : 'webp';
    return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.' + ext, { type });
  } catch {
    return file;
  }
}
