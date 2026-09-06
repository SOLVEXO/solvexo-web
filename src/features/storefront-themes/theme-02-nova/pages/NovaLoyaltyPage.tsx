import { useState, useEffect } from 'react';
import { Award, Gift, Check, Loader2, Copy, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import {
  apiGetMyBalance, apiGetRewards, apiRedeemReward,
  type LoyaltyBalance, type Reward,
} from '@/api/services/loyalty';
import { novaTheme as t } from '../theme.config';

/** Theme 02's own Loyalty/Rewards page — ported functionally 1:1 from
 *  `AtelierLoyaltyPage`, restyled with Nova's rounded/pill vocabulary. */
export function NovaLoyaltyPage() {
  useStorefrontSeo({ title: 'Loyalty & Rewards', noindex: true });
  const { store } = useStorefront();
  const [balance, setBalance] = useState<LoyaltyBalance | null>(null);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [voucher, setVoucher] = useState<{ code: string; rewardName: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    Promise.all([apiGetMyBalance(store.storeId), apiGetRewards(store.storeId)])
      .then(([balRes, rewardsRes]) => {
        if (cancelled) return;
        setBalance(balRes.data);
        setRewards(rewardsRes.data ?? []);
      })
      .catch(() => { if (!cancelled) setUnavailable(true); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [store.storeId]);

  const handleRedeem = async (reward: Reward) => {
    setError('');
    setRedeemingId(reward._id);
    try {
      const res = await apiRedeemReward(store.storeId, reward._id);
      setVoucher({ code: res.data.voucherCode, rewardName: reward.name });
      setBalance(b => b ? { ...b, pointsBalance: res.data.remainingBalance } : b);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to redeem reward.');
    } finally {
      setRedeemingId(null);
    }
  };

  const copyCode = () => {
    if (!voucher) return;
    navigator.clipboard.writeText(voucher.code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  return (
    <main className="mx-auto" style={{ maxWidth: '720px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink, marginBottom: '28px' }}>
        Loyalty &amp; Rewards
      </h1>

      {loading ? (
        <div className="animate-pulse" style={{ height: '280px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />
      ) : unavailable ? (
        <div className="flex flex-col items-center text-center" style={{ padding: '64px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <Award size={28} style={{ color: t.colors.inkMuted, marginBottom: '14px' }} />
          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink }}>No loyalty program yet</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
            {store.name} hasn't set up a rewards program — check back later.
          </p>
        </div>
      ) : (
        <>
          <section style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '24px', marginBottom: '32px' }}>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <p style={{ fontFamily: t.fonts.body, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: t.colors.inkMuted }}>Your balance</p>
                <p style={{ fontFamily: t.fonts.display, fontSize: '32px', fontWeight: 700, color: t.colors.ink, marginTop: '4px' }}>
                  {balance?.pointsBalance.toLocaleString() ?? 0} <span style={{ fontSize: '14px', fontWeight: 400, color: t.colors.inkMuted }}>points</span>
                </p>
              </div>
              {balance?.currentTier && (
                <span className="flex items-center gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.accent, border: `1.5px solid ${t.colors.accent}`, borderRadius: '9999px', padding: '6px 14px' }}>
                  <Award size={13} /> {balance.currentTier}
                </span>
              )}
            </div>
            {balance?.nextTier && (
              <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginTop: '14px' }}>
                {balance.nextTier.pointsNeeded.toLocaleString()} more points to reach <strong style={{ color: t.colors.ink }}>{balance.nextTier.name}</strong>
              </p>
            )}
          </section>

          {error && (
            <p className="flex items-center gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger, marginBottom: '16px' }}>
              <AlertCircle size={13} /> {error}
            </p>
          )}

          {voucher && (
            <div className="flex items-center justify-between gap-3 flex-wrap" style={{ border: `1.5px solid ${t.colors.accent}`, background: t.colors.bgAlt, borderRadius: t.radius.md, padding: '16px 20px', marginBottom: '24px' }}>
              <div>
                <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>Redeemed — "{voucher.rewardName}"</p>
                <p style={{ fontFamily: 'monospace', fontSize: '16px', fontWeight: 700, color: t.colors.ink, marginTop: '2px' }}>{voucher.code}</p>
              </div>
              <button
                type="button" onClick={copyCode}
                className="flex items-center gap-1.5 cursor-pointer bg-transparent"
                style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.ink, border: `1.5px solid ${t.colors.border}`, borderRadius: '9999px', padding: '8px 14px' }}
              >
                {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied' : 'Copy code'}
              </button>
            </div>
          )}

          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink, marginBottom: '16px' }}>Available Rewards</p>
          {rewards.length === 0 ? (
            <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted }}>No rewards available right now.</p>
          ) : (
            <div className="flex flex-col gap-3">
              {rewards.map(r => {
                const canAfford = (balance?.pointsBalance ?? 0) >= r.pointsCost;
                const isRedeeming = redeemingId === r._id;
                return (
                  <div key={r._id} className="flex items-center justify-between gap-3 flex-wrap" style={{ border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, padding: '16px 20px' }}>
                    <div className="flex items-center gap-3 min-w-0">
                      <Gift size={18} style={{ color: t.colors.accent, flexShrink: 0 }} />
                      <div className="min-w-0">
                        <p style={{ fontFamily: t.fonts.display, fontSize: '14px', fontWeight: 700, color: t.colors.ink }}>{r.name}</p>
                        {r.description && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginTop: '2px' }}>{r.description}</p>}
                        <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.accent, marginTop: '4px', fontWeight: 700 }}>{r.pointsCost.toLocaleString()} points</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRedeem(r)}
                      disabled={!canAfford || isRedeeming}
                      className="flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                      style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: '#FFFFFF', background: t.colors.accent, border: 'none', borderRadius: '9999px', padding: '9px 18px' }}
                    >
                      {isRedeeming ? <Loader2 size={13} className="animate-spin" /> : null}
                      {canAfford ? 'Redeem' : 'Not enough points'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </main>
  );
}
