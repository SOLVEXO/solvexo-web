import { createContext, useContext, useCallback, useState, useRef, type ReactNode } from 'react';
import { TokenStorage } from '@/api/services/auth';

// Guards a guest-only action (add to cart, wishlist, follow, message) behind
// an inline "sign in to continue" prompt instead of letting it hit the API,
// 401, and fall through to client.ts's hard `window.location.href` redirect
// — that redirect is still correct for a real session expiring mid-task
// elsewhere in the app, but a never-logged-in guest should never reach it
// from these specific actions in the first place.
interface PendingAction {
  reason: string;
  run:    () => void;
}

interface AuthGateContextValue {
  // First-queued action's reason, for the modal to display — see `queueRef`
  // below for why this can represent more than one pending action.
  pending:     PendingAction | null;
  // Returns true and runs `run` immediately if already logged in; otherwise
  // queues it and opens the prompt, returning false.
  requireAuth: (run: () => void, reason: string) => boolean;
  cancel:      () => void;
  resolve:     () => void; // called by the modal right after a successful sign-in
}

const AuthGateContext = createContext<AuthGateContextValue | null>(null);

export function useAuthGate(): AuthGateContextValue {
  const ctx = useContext(AuthGateContext);
  if (!ctx) throw new Error('useAuthGate must be used inside AuthGateProvider');
  return ctx;
}

export function AuthGateProvider({ children }: { children: ReactNode }) {
  // A queue, not a single slot — a guest can trigger more than one guarded
  // call before ever seeing the modal (e.g. "Buy Now" with quantity > 1 fires
  // one addToCart plus several sequential updateQty calls). Queuing all of
  // them means a single sign-in resolves every one in the original order,
  // instead of a second call silently overwriting the first's pending action.
  const queueRef = useRef<PendingAction[]>([]);
  const [pending, setPending] = useState<PendingAction | null>(null);

  const requireAuth = useCallback((run: () => void, reason: string) => {
    if (TokenStorage.isLoggedIn()) { run(); return true; }
    queueRef.current.push({ reason, run });
    setPending(current => current ?? queueRef.current[0]);
    return false;
  }, []);

  const cancel = useCallback(() => {
    queueRef.current = [];
    setPending(null);
  }, []);

  const resolve = useCallback(() => {
    const queue = queueRef.current;
    queueRef.current = [];
    setPending(null);
    queue.forEach(item => item.run());
  }, []);

  const value: AuthGateContextValue = { pending, requireAuth, cancel, resolve };

  return (
    <AuthGateContext.Provider value={value}>
      {children}
    </AuthGateContext.Provider>
  );
}
