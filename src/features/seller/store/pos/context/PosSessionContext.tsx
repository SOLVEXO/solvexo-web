import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { apiGetEmployees, apiAddEmployee, type PosEmployee } from '@/api/services/pos/posEmployees';
import { apiListRegisters, apiAddRegister, type PosRegister } from '@/api/services/pos/posRegisters';
import { apiGetActiveSession, apiOpenSession, type RegisterSession } from '@/api/services/pos/posSessions';
import { TokenStorage } from '@/api/services/auth';

interface StoredPosSession {
  employee:     PosEmployee;
  registerId:   string;
  registerName: string;
  sessionId:    string;
}

export type PosSessionMode = 'owner' | 'employee';

interface PosSessionContextValue {
  storeId:      string;
  mode:         PosSessionMode;
  employee:     PosEmployee | null;
  registerId:   string | null;
  registerName: string;
  sessionId:    string | null;
  session:      RegisterSession | null;
  hydrating:    boolean;
  isReady:      boolean;   // employee + open register session
  needsRegister: boolean;  // employee logged in, no open session yet
  login:        (employee: PosEmployee, activeSession: RegisterSession | null, registerName?: string) => void;
  autoOpenPos:  () => Promise<void>;
  autoAssignRegister: (employee: PosEmployee) => Promise<void>;
  openRegister: (registerId: string, registerName: string, session: RegisterSession) => void;
  setSession:   (session: RegisterSession) => void;
  refreshSession: () => Promise<void>;
  logout:       () => void;
}

const Ctx = createContext<PosSessionContextValue | null>(null);

// Owner and employee entry points are two independent sessions on the same
// device/browser — they must never share (or overwrite) each other's storage.
function storageKey(storeId: string, mode: PosSessionMode) {
  return `pos_session_${mode}_${storeId}`;
}

export function PosSessionProvider({ storeId, mode, children }: { storeId: string; mode: PosSessionMode; children: ReactNode }) {
  const [employee,     setEmployee]     = useState<PosEmployee | null>(null);
  const [registerId,   setRegisterId]   = useState<string | null>(null);
  const [registerName, setRegisterName] = useState('');
  const [sessionId,    setSessionId]    = useState<string | null>(null);
  const [session,      setSessionState] = useState<RegisterSession | null>(null);
  const [hydrating,    setHydrating]    = useState(true);

  // Hydrate from sessionStorage on mount — verify the session is still open server-side.
  useEffect(() => {
    let cancelled = false;
    const raw = sessionStorage.getItem(storageKey(storeId, mode));
    if (!raw) { setHydrating(false); return; }

    try {
      const stored: StoredPosSession = JSON.parse(raw);
      apiGetActiveSession(storeId, stored.registerId)
        .then(res => {
          if (cancelled) return;
          if (res.data && res.data._id === stored.sessionId && res.data.status === 'open') {
            setEmployee(stored.employee);
            setRegisterId(stored.registerId);
            setRegisterName(stored.registerName);
            setSessionId(stored.sessionId);
            setSessionState(res.data);
          } else {
            sessionStorage.removeItem(storageKey(storeId, mode));
          }
        })
        .catch(() => sessionStorage.removeItem(storageKey(storeId, mode)))
        .finally(() => { if (!cancelled) setHydrating(false); });
    } catch {
      sessionStorage.removeItem(storageKey(storeId, mode));
      setHydrating(false);
    }

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeId, mode]);

  function persist(next: Partial<StoredPosSession>) {
    const raw = sessionStorage.getItem(storageKey(storeId, mode));
    const current: Partial<StoredPosSession> = raw ? JSON.parse(raw) : {};
    sessionStorage.setItem(storageKey(storeId, mode), JSON.stringify({ ...current, ...next }));
  }

  function login(emp: PosEmployee, activeSession: RegisterSession | null, regName = '') {
    setEmployee(emp);
    persist({ employee: emp });
    if (activeSession) {
      setRegisterId(activeSession.registerId);
      setRegisterName(regName);
      setSessionId(activeSession._id);
      setSessionState(activeSession);
      persist({ registerId: activeSession.registerId, registerName: regName, sessionId: activeSession._id });
    }
  }

  // Shared by the owner and employee auto-entry flows: find a register this
  // employee already has open, or the first free one, opening a fresh
  // session on it if needed. No user interaction — no register-picker screen.
  async function resolveRegisterSession(employeeId: string): Promise<{ register: PosRegister; session: RegisterSession }> {
    const regList = await apiListRegisters(storeId);
    const regListData = regList.data ?? [];
    let registers = regListData.filter(r => r.status === 'active');
    if (registers.length === 0 && regListData.length > 0) registers = regListData;
    if (registers.length === 0) {
      const created = await apiAddRegister(storeId, { name: 'Register 1', defaultFloatCash: 0 });
      registers = created.data ?? [];
    }

    let register: PosRegister = registers[0];
    let activeSession: RegisterSession | null = null;
    for (const r of registers) {
      const res = await apiGetActiveSession(storeId, r._id);
      if (!res.data) { register = r; activeSession = null; break; }
      if (res.data.employeeId === employeeId) { register = r; activeSession = res.data; break; }
      register = r; // last resort: stays on the last-checked (possibly occupied) register
    }

    if (!activeSession) {
      const opened = await apiOpenSession({
        storeId,
        registerId: register._id,
        employeeId,
        openingCash: register.defaultFloatCash ?? 0,
      });
      activeSession = opened.data;
    }

    return { register, session: activeSession };
  }

  // Fully automatic entry: resolve (or provision) the owner's own employee
  // record, resolve (or open) a register session, and land straight on the
  // terminal — no PIN screen, no register-picker, no user interaction.
  async function autoOpenPos() {
    const user = TokenStorage.getUser<{ email?: string; firstName?: string; lastName?: string }>();
    if (!user?.email) throw new Error('Could not resolve your account email. Please log in again.');

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || 'Store Owner';
    const email = user.email.toLowerCase();

    const empList = await apiGetEmployees(storeId);
    let ownerEmployee = (empList.data ?? []).find(e => e.email.toLowerCase() === email);
    if (!ownerEmployee) {
      const pin = String(Math.floor(1000 + Math.random() * 9000));
      const created = await apiAddEmployee({ storeId, name, email: user.email, pin, role: 'manager' });
      ownerEmployee = created.data;
    }

    const { register, session: activeSession } = await resolveRegisterSession(ownerEmployee._id);
    login(ownerEmployee, activeSession, register.name);
  }

  // After a real employee logs in with their PIN and has no session waiting
  // for them already, silently assign them a register too — no picker screen.
  async function autoAssignRegister(emp: PosEmployee) {
    const { register, session: activeSession } = await resolveRegisterSession(emp._id);
    login(emp, activeSession, register.name);
  }

  function openRegister(regId: string, regName: string, sess: RegisterSession) {
    setRegisterId(regId);
    setRegisterName(regName);
    setSessionId(sess._id);
    setSessionState(sess);
    persist({ registerId: regId, registerName: regName, sessionId: sess._id });
  }

  function setSession(sess: RegisterSession) {
    setSessionState(sess);
  }

  async function refreshSession() {
    if (!registerId) return;
    try {
      const res = await apiGetActiveSession(storeId, registerId);
      if (res.data) setSessionState(res.data);
    } catch {
      // ignore — non-critical refresh
    }
  }

  function logout() {
    sessionStorage.removeItem(storageKey(storeId, mode));
    setEmployee(null);
    setRegisterId(null);
    setRegisterName('');
    setSessionId(null);
    setSessionState(null);
  }

  const value: PosSessionContextValue = {
    storeId,
    mode,
    employee,
    registerId,
    registerName,
    sessionId,
    session,
    hydrating,
    isReady:       !!employee && !!sessionId,
    needsRegister: !!employee && !sessionId,
    login,
    autoOpenPos,
    autoAssignRegister,
    openRegister,
    setSession,
    refreshSession,
    logout,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePosSession(): PosSessionContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePosSession must be used inside PosSessionProvider');
  return ctx;
}
