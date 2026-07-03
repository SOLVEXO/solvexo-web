import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/hooks/usePageTitle';
import { PosSessionProvider, usePosSession } from './context/PosSessionContext';
import { PosTerminal } from './components/PosTerminal';

function POSRegisterInner() {
  const { storeId, employee, isReady, hydrating, autoOpenPos, logout } = usePosSession();
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Owner entry — no PIN screen, no register picker. Resolve everything
  // silently (own employee identity + a register + a session) and land
  // straight on the terminal dashboard.
  useEffect(() => {
    if (hydrating || employee) return;
    setError('');
    autoOpenPos().catch(err => setError(err instanceof Error ? err.message : 'Failed to open POS.'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrating, employee]);

  function handleShiftClosed() {
    logout();
    navigate(`/seller/store/${storeId}/pos`, { replace: true });
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

  if (!isReady) {
    return (
      <div className="flex-1 flex items-center justify-center bg-pos-bg">
        <p className="text-[13px] text-pos-muted">Loading POS terminal…</p>
      </div>
    );
  }

  return <PosTerminal onShiftClosed={handleShiftClosed} />;
}

export function POSRegister() {
  usePageTitle('POS Register');
  const { storeId } = useParams<{ storeId: string }>();

  if (!storeId) return null;

  return (
    <div className="flex flex-col h-screen bg-pos-bg">
      <PosSessionProvider storeId={storeId} mode="owner">
        <POSRegisterInner />
      </PosSessionProvider>
    </div>
  );
}
