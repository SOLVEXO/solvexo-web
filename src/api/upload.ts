import client from './client';
import { ENDPOINTS } from './endpoints';

export interface PublicUploadData {
  url:          string;
  publicId:     string;
  resourceType: string;
}

export interface PrivateUploadData {
  publicId:     string;
  resourceType: string;
  fileName:     string;
  fileSize:     number;
  mimeType:     string;
}

interface UploadApiResponse<T> { success: boolean; message: string; data: T }

export function apiUploadPublicFile(file: File) {
  const fd = new FormData();
  fd.append('file', file);
  return client.post<never, UploadApiResponse<PublicUploadData>>(ENDPOINTS.UPLOAD.PUBLIC_FILE, fd);
}

/** `purpose` scopes the private storage folder server-side (e.g. 'kyc_document'
 *  for seller-verification documents) — omit for the original digital-products
 *  upload flow, which keeps its existing default folder. */
export function apiUploadPrivateFile(file: File, purpose?: string) {
  const fd = new FormData();
  fd.append('file', file);
  if (purpose) fd.append('purpose', purpose);
  return client.post<never, UploadApiResponse<PrivateUploadData>>(ENDPOINTS.UPLOAD.PRIVATE_FILE, fd);
}
