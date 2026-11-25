import { compressImage } from '@/components/comman/ui/imageCompress';
import { apiUploadMediaAsset } from '@/api/services/mediaLibrary';
import { isNetworkError } from '@/api/client';

/** Matches the backend image ceiling (upload-file-validation.ts) and the main gallery uploader. */
export const MAX_PHOTO_BYTES = 20 * 1024 * 1024;
export const PHOTO_ACCEPT = 'image/png,image/jpeg,image/webp';
/** A product holds up to 250 photos. */
export const MAX_PRODUCT_PHOTOS = 250;
const ALLOWED = /^image\/(jpeg|png|webp)$/;

/**
 * Splits what the seller picked into files we can upload and plain-language notes about the rest
 * (wrong type, over 20 MB, over the 250-photo limit). `room` = how many more photos the product can take.
 */
export function checkPhotos(picked: File[], room: number): { files: File[]; notes: string[] } {
  const notes: string[] = [];
  const wrongType = picked.filter(f => !ALLOWED.test(f.type));
  if (wrongType.length) notes.push(`${wrongType.length} ${wrongType.length === 1 ? 'file is' : 'files are'} not JPG, PNG or WebP and was skipped.`);
  const typed = picked.filter(f => ALLOWED.test(f.type));
  const sized = typed.filter(f => f.size <= MAX_PHOTO_BYTES);
  const tooBig = typed.filter(f => f.size > MAX_PHOTO_BYTES);
  if (tooBig.length) notes.push(`${tooBig.map(f => `"${f.name}" (${(f.size / 1048576).toFixed(1)} MB)`).join(', ')} ${tooBig.length === 1 ? 'is' : 'are'} over 20 MB. Please compress and try again.`);
  const files = sized.slice(0, Math.max(0, room));
  if (sized.length > files.length) notes.push(`A product can hold ${MAX_PRODUCT_PHOTOS} photos, so ${sized.length - files.length} ${sized.length - files.length === 1 ? 'file was' : 'files were'} skipped.`);
  return { files, notes };
}

/**
 * Uploads photos to the store's Files Library (the same path the main product gallery uses): shrinks big
 * phone photos first, four uploads at a time, retries a dropped connection, and one bad file never drops
 * the others. `onResult` fires for EACH file the moment it finishes (url on success, an error text on failure),
 * so the screen can show every photo as soon as it is ready instead of waiting for the whole batch.
 */
export async function uploadPhotoFiles(
  storeId: string,
  files: File[],
  onResult: (index: number, url: string | null, error: string) => void,
  concurrency = 4,
): Promise<void> {
  const uploadOne = async (original: File): Promise<string> => {
    const file = await compressImage(original);
    for (let attempt = 0; ; attempt++) {
      try { return (await apiUploadMediaAsset(storeId, file)).data.url; }
      catch (e) {
        if (attempt >= 2 || !isNetworkError(e)) throw e;
        await new Promise(r => setTimeout(r, 800 * (attempt + 1)));
      }
    }
  };
  let next = 0;
  const worker = async () => {
    while (next < files.length) {
      const i = next++;
      try { onResult(i, await uploadOne(files[i]), ''); }
      catch (e) { onResult(i, null, e instanceof Error ? e.message : ''); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
}
