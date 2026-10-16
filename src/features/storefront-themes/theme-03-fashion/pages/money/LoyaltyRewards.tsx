import { useState } from 'react';
import { Award, Check, Copy, Gift } from 'lucide-react';
import { apiRedeemReward, type LoyaltyBalance, type Reward } from '@/api/services/loyalty';
import { fashionTheme as t } from '../../theme.config';
import { Card, Notice, PillButton, SectionHeading } from '../../ui/primitives';

/** Compact loyalty view: points + tier, optional redeemed voucher, and the reward list. */
export function LoyaltyRewards({ storeId, balance, rewards }: { storeId: string; balance: LoyaltyBalance | null; rewards: Reward[] }) {
  const [points, setPoints] = useState<number | null>(null);
  const [redeeming, setRedeeming] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<{ code: string; name: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const current = points ?? balance?.pointsBalance ?? 0;

  const redeem = async (reward: Reward) => {
    setError(''); setRedeeming(reward._id);
    try {
      const res = await apiRedeemReward(storeId, reward._id);
      setVoucher({ code: res.data.voucherCode, name: reward.name });
      setPoints(res.data.remainingBalance);
      setCopied(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not redeem this reward.');
    } finally { setRedeeming(null); }
  };

  const copy = async () => {
    if (!voucher) return;
    try { await navigator.clipboard.writeText(voucher.code); setCopied(true); } catch { setError('Copy is not available here. Select the code instead.'); }
  };

  return (
    <div className="flex flex-col gap-6">
      <Card tone="soft">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>Your balance</p>
            <p className="m-0 mt-1 text-4xl font-medium tracking-tight" aria-live="polite">{current.toLocaleString()} <span className="text-base font-normal" style={{ color: t.colors.inkMuted }}>points</span></p>
          </div>
          {balance?.currentTier && <span className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold" style={{ background: t.colors.bg, border: `1px solid ${t.colors.border}` }}><Award size={15} aria-hidden />{balance.currentTier}</span>}
        </div>
        {balance?.nextTier && <p className="m-0 mt-4 text-sm" style={{ color: t.colors.inkMuted }}>{balance.nextTier.pointsNeeded.toLocaleString()} more points to reach <strong style={{ color: t.colors.ink }}>{balance.nextTier.name}</strong></p>}
      </Card>

      {error && <Notice tone="error">{error}</Notice>}
      {voucher && (
        <Notice tone="success" action={<PillButton variant="outline" onClick={() => void copy()} style={{ height: 40, padding: '0 16px' }}>{copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}{copied ? 'Copied' : 'Copy code'}</PillButton>}>
          <p className="m-0">Redeemed {voucher.name}. Use this code in the promo field at checkout.</p>
          <p className="m-0 mt-1 font-mono text-base font-semibold">{voucher.code}</p>
        </Notice>
      )}

      <section aria-labelledby="loyalty-rewards">
        <SectionHeading><span id="loyalty-rewards">Available rewards</span></SectionHeading>
        {rewards.length === 0 ? <p className="m-0 text-sm" style={{ color: t.colors.inkMuted }}>No rewards available right now.</p> : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {rewards.map(r => {
              const can = current >= r.pointsCost;
              return (
                <li key={r._id} className="flex flex-wrap items-center justify-between gap-3 p-4 md:p-5" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 18 }}>
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-full" style={{ background: t.colors.bgAlt }}><Gift size={17} aria-hidden /></span>
                    <div className="min-w-0">
                      <p className="m-0 text-[15px] font-medium">{r.name}</p>
                      {r.description && <p className="m-0 text-[13px]" style={{ color: t.colors.inkMuted }}>{r.description}</p>}
                      <p className="m-0 text-[13px] font-semibold">{r.pointsCost.toLocaleString()} points</p>
                    </div>
                  </div>
                  <PillButton disabled={!can} loading={redeeming === r._id} onClick={() => void redeem(r)} aria-label={can ? `Redeem ${r.name}` : `Not enough points to redeem ${r.name}`}>{can ? 'Redeem' : 'Not enough points'}</PillButton>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
