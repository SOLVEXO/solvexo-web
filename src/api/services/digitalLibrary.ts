import client from '../client';

export interface LibraryFile {
  fileIndex: number;
  name: string;
  label: string | null;
  version: string | null;
  updatedAt: string | null;
  changelog: string | null;
  size: number | null;
}

export interface LibraryItem {
  accessId: string;
  productId: string;
  name: string;
  image: string | null;
  expiresAt: string | null;
  downloadLimit: string;
  downloadsUsed: number;
  files: LibraryFile[];
}

const BASE = '/api/digital';

/** Buyer is signed in (JWT) or holds a guest recovery token; both return the same shapes. */
export const apiGetLibrary = (storeId: string, recoveryToken?: string): Promise<LibraryItem[]> =>
  recoveryToken
    ? (client.get(`${BASE}/recovered/${encodeURIComponent(recoveryToken)}/library`) as Promise<LibraryItem[]>)
    : (client.get(`${BASE}/library`, { params: { storeId } }) as Promise<LibraryItem[]>);

export const apiRecoverLibrary = (storeId: string, orderRef: string, email: string): Promise<{ recoveryToken: string }> =>
  client.post(`${BASE}/recover`, { storeId, orderRef, email }) as Promise<{ recoveryToken: string }>;

/** Mints a single-use token, then returns the browser download URL for it. */
export async function apiDownloadUrl(storeId: string, productId: string, fileIndex: number, recoveryToken?: string): Promise<string> {
  const res = (recoveryToken
    ? await client.post(`${BASE}/recovered/${encodeURIComponent(recoveryToken)}/download-token`, { productId, fileIndex })
    : await client.post(`${BASE}/download-token`, { storeId, productId, fileIndex })) as { token: string };
  const base = (client.defaults.baseURL ?? '').replace(/\/$/, '');
  return `${base}${BASE}/download/${encodeURIComponent(res.token)}`;
}
