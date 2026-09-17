import { useState, useCallback } from 'react';
import {
  apiUploadPublicFile, apiUploadPrivateFile, apiUploadFromUrl,
  type PublicUploadData, type PrivateUploadData,
} from '@/api/upload';

type UploadType = 'public' | 'private';
type Result<T extends UploadType> = T extends 'public' ? PublicUploadData : PrivateUploadData;

export function useUpload<T extends UploadType>(type: T) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const upload = useCallback((file: File, purpose?: string): Promise<Result<T>> => {
    setUploading(true);
    setError('');
    const promise = type === 'public' ? apiUploadPublicFile(file) : apiUploadPrivateFile(file, purpose);
    return promise
      .then(res => res.data as Result<T>)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Upload failed');
        throw err;
      })
      .finally(() => setUploading(false));
  }, [type]);

  /** "Paste an image URL" alternative to `upload()` — public images only. */
  const uploadUrl = useCallback((url: string): Promise<PublicUploadData> => {
    setUploading(true);
    setError('');
    return apiUploadFromUrl(url)
      .then(res => res.data)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Could not load that image URL');
        throw err;
      })
      .finally(() => setUploading(false));
  }, []);

  const clearError = useCallback(() => setError(''), []);

  return { upload, uploadUrl, uploading, error, clearError };
}
