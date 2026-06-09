import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { apiGetMyStores, type MyStoreItem } from '@/api/store';

const STORAGE_KEY = 'solvexo_active_store';

interface ActiveStoreContextValue {
  stores:        MyStoreItem[];
  activeStoreId: string;
  activeStore:   MyStoreItem | null;
  loading:       boolean;
  switchStore:   (id: string) => void;
}

const Ctx = createContext<ActiveStoreContextValue | null>(null);

export function ActiveStoreProvider({ children }: { children: ReactNode }) {
  const [stores,        setStores]        = useState<MyStoreItem[]>([]);
  const [activeStoreId, setActiveStoreId] = useState<string>(
    () => localStorage.getItem(STORAGE_KEY) ?? 'all'
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGetMyStores()
      .then(res => {
        if (cancelled) return;
        setStores(res.data);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && saved !== 'all' && !res.data.find(s => s._id === saved)) {
          setActiveStoreId('all');
          localStorage.removeItem(STORAGE_KEY);
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const switchStore = (id: string) => {
    setActiveStoreId(id);
    if (id === 'all') localStorage.removeItem(STORAGE_KEY);
    else              localStorage.setItem(STORAGE_KEY, id);
  };

  const activeStore =
    activeStoreId === 'all' ? null : (stores.find(s => s._id === activeStoreId) ?? null);

  return (
    <Ctx.Provider value={{ stores, activeStoreId, activeStore, loading, switchStore }}>
      {children}
    </Ctx.Provider>
  );
}

export function useActiveStore(): ActiveStoreContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useActiveStore must be inside ActiveStoreProvider');
  return ctx;
}
