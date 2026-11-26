import { useRef, useState } from 'react';
import { apiUploadPublicFile } from '@/api/upload';
import { ts } from '@/utils/tStatic';
import { checkReviewMediaFile, REVIEW_MEDIA_LIMITS, reviewMediaCounts, type ReviewMediaKind } from './reviewMedia';

/**
 * Shared upload/remove state for the review form (all three themes).
 *
 * Photos, one audio note and one video are uploaded through the same public
 * upload route the rest of the storefront uses; the API stores the returned URLs
 * in `Rating.media`, so the caller only has to keep the array.
 */
export function useReviewMedia(initial: string[] | null | undefined) {
  const [media, setMedia] = useState<string[]>(initial ?? []);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const counts = reviewMediaCounts(media);

  function openPicker(kind: ReviewMediaKind) {
    const input = inputRef.current;
    if (!input) return;
    input.accept = kind === 'audio' ? 'audio/*' : kind === 'video' ? 'video/*' : 'image/*';
    input.multiple = kind === 'image';
    input.dataset.kind = kind;
    input.value = '';
    input.click();
  }

  async function addFiles(files: FileList | null) {
    const kind = (inputRef.current?.dataset.kind as ReviewMediaKind) || 'image';
    const picked = Array.from(files ?? []);
    if (picked.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const accepted: string[] = [];
      for (const file of picked) {
        const problem = checkReviewMediaFile(file, kind, [...media, ...accepted]);
        if (problem) { setError(problem); continue; }
        const result = await apiUploadPublicFile(file);
        accepted.push(result.data.url);
      }
      if (accepted.length) setMedia(m => [...m, ...accepted]);
    } catch (err) {
      setError(err instanceof Error ? err.message : ts('reviews.err.upload', 'Could not upload the file.'));
    } finally {
      setUploading(false);
    }
  }

  function remove(url: string) {
    setMedia(m => m.filter(x => x !== url));
  }

  return { media, setMedia, uploading, error, setError, counts, inputRef, openPicker, addFiles, remove, limits: REVIEW_MEDIA_LIMITS };
}