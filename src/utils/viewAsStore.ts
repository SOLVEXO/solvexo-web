import { TokenStorage } from '@/api/services/auth';
import { apiViewAsStore } from '@/api/services/adminTeam';
import { hostMode } from '@/utils/platformHost';
import { platformOrigin } from '@/utils/storefrontUrl';

const BACKUP_KEY = 'solvexo:view-as-backup';

interface Backup { accessToken: string | null; refreshToken: string | null; user: unknown; storeName: string }

const readBackup = (): Backup | null => {
  try { const raw = window.sessionStorage.getItem(BACKUP_KEY); return raw ? (JSON.parse(raw) as Backup) : null; } catch { return null; }
};

/** True while an admin is looking at a store through the read-only "view as store" session. */
export const isViewingAsAdmin = () => !!readBackup() && TokenStorage.getUser<{ viewOnly?: boolean }>()?.viewOnly === true;

export const viewAsStoreName = () => readBackup()?.storeName ?? '';

/** Swaps the admin session for a 30-minute, read-only staff token of the store. The admin session is kept in
 *  sessionStorage (this tab only) so Exit can put it back. Returns the store id to open. */
export async function startViewAsStore(storeId: string): Promise<string> {
  const res = await apiViewAsStore(storeId);
  const { accessToken, storeName, staff } = res.data;
  try {
    // Never overwrite a backup that already exists (opening a second store keeps the ORIGINAL admin session).
    if (!readBackup()) {
      const backup: Backup = { accessToken: TokenStorage.getToken(), refreshToken: TokenStorage.getRefresh(), user: TokenStorage.getUser(), storeName };
      window.sessionStorage.setItem(BACKUP_KEY, JSON.stringify(backup));
    } else {
      window.sessionStorage.setItem(BACKUP_KEY, JSON.stringify({ ...readBackup(), storeName }));
    }
  } catch { throw new Error('Your browser blocked session storage, so the read-only view cannot be opened.'); }
  TokenStorage.save(accessToken, accessToken);
  TokenStorage.saveUser({ ...staff, viewOnly: true });
  return res.data.storeId;
}

/** Opens the read-only store view. From the superadmin host it opens a NEW tab on the seller host (cookies are per
 *  host) and hands the 30-minute token over in the URL hash; the admin session in this tab is never touched. */
export async function openViewAsStore(storeId: string): Promise<void> {
  if (hostMode() !== 'superadmin') {
    const id = await startViewAsStore(storeId);
    window.location.assign(`/store/${id}`);
    return;
  }
  const res = await apiViewAsStore(storeId);
  const payload = encodeURIComponent(JSON.stringify({ accessToken: res.data.accessToken, staff: res.data.staff, storeName: res.data.storeName }));
  window.open(`${platformOrigin('seller')}/store/${res.data.storeId}/dashboard#vas=${payload}`, '_blank');
}

/** Seller host, first load: takes the read-only token handed over by `openViewAsStore` out of the URL hash. */
export function consumeViewAsHandoff(): void {
  if (!window.location.hash.startsWith('#vas=')) return;
  try {
    const { accessToken, staff, storeName } = JSON.parse(decodeURIComponent(window.location.hash.slice(5)));
    window.sessionStorage.setItem(BACKUP_KEY, JSON.stringify({ accessToken: null, refreshToken: null, user: null, storeName, handoff: true }));
    TokenStorage.save(accessToken, accessToken);
    TokenStorage.saveUser({ ...staff, viewOnly: true });
  } catch { /* bad hash: ignore */ }
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}

/** Puts the admin session back and forgets the read-only one. */
export function exitViewAsStore(): void {
  const backup = readBackup();
  try { window.sessionStorage.removeItem(BACKUP_KEY); } catch { /* storage unavailable */ }
  if (backup?.accessToken && backup.user) {
    TokenStorage.save(backup.accessToken, backup.refreshToken ?? backup.accessToken);
    TokenStorage.saveUser(backup.user as object);
  } else {
    TokenStorage.clear();
  }
}
