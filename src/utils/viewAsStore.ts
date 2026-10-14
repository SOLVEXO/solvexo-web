import { TokenStorage } from '@/api/services/auth';
import { apiViewAsStore } from '@/api/services/adminTeam';

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
