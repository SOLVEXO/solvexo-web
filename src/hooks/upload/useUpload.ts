import { useState, useCallback } from 'react';
import {
  apiUploadPublicFile, apiUploadPrivateFile,
  type PublicUploadData, type PrivateUploadData,
} from '@/api/upload';

type UploadType = 'public' | 'private';
type Result<T extends UploadType> = T extends 'public' ? PublicUploadData : PrivateUploadData;

export function useUpload<T extends UploadType>(type: T) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState('');

  const upload = useCallback((file: File): Promise<Result<T>> => {
    setUploading(true);
    setError('');
    const fn = type === 'public' ? apiUploadPublicFile : apiUploadPrivateFile;
    return fn(file)
      .then(res => res.data as Result<T>)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Upload failed');
        throw err;
      })
      .finally(() => setUploading(false));
  }, [type]);

  const clearError = useCallback(() => setError(''), []);

  return { upload, uploading, error, clearError };
}
