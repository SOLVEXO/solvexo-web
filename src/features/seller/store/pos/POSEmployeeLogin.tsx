import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import type { PinLoginResult } from '@/api/services/pos/posPinLogin';
import { PosSessionProvider, usePosSession } from './context/PosSessionContext';
import { PinLoginScreen } from './components/gate/PinLoginScreen';
import { PosTerminal } from './components/PosTerminal';

function POSEmployeeLoginInner() {
  const { storeId, employee, isReady, hydrating, login, autoAssignRegister, logout } = usePosSession();
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState('');

  // PIN login only identifies the employee — the register/session is always
  // resolved automatically right after, same as the owner flow. No
  // register-picker screen for anyone.
  async function handlePinSuccess(result: PinLoginResult) {
    setResolving(true);
    setError('');
    try {
      if (result.activeSession) {
        login(result.employee, result.activeSession);
      } else {
        await autoAssignRegister(result.employee);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open POS.');
    } finally {
      setResolving(false);
    }
  }

  if (hydrating || resolving) {
    return (
      <div className="flex-1 flex items-center justify-center bg-pos-bg">
        <p className="text-[13px] text-pos-muted">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-pos-bg">
        <p className="text-[13px] text-error text-center max-w-[360px]">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-carbon border border-carbon rounded-lg text-[12px] text-white cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!employee) {
    return <PinLoginScreen storeId={storeId} onSuccess={handlePinSuccess} />;
  }

  if (!isReady) return null;

  return <PosTerminal onShiftClosed={logout} />;
}

export function POSEmployeeLogin() {
  usePageTitle('POS Employee Login');
  const { storeId } = useParams<{ storeId: string }>();

  if (!storeId) return null;

  return (
    <div className="flex flex-col h-screen bg-pos-bg">
      <PosSessionProvider storeId={storeId} mode="employee">
        <POSEmployeeLoginInner />
      </PosSessionProvider>
    </div>
  );
}
