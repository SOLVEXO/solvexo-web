import { useState, useEffect } from 'react';
import { Gift, Check, AlertCircle } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import {
  apiGetGiftCardPublicSettings, apiCreateGiftCardPurchaseIntent, type GiftCardPublicSettings,
} from '@/api/services/giftCards';
import { StripeCardPayment, isStripeConfigured } from '@/features/buyer/components/StripeCardPayment';
import { currencySymbol } from '@/utils/currency';
import { NovaButton } from '../components/NovaButton';
import { novaTheme as t } from '../theme.config';

/** Theme 02's own Gift Card purchase page — ported functionally 1:1 from
 *  `AtelierGiftCardsPage`, restyled with Nova's rounded/pill vocabulary. */
export function NovaGiftCardsPage() {
  useStorefrontSeo({ title: 'Gift Cards', noindex: true });
  const { store } = useStorefront();
  const [settings, setSettings] = useState<GiftCardPublicSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [message, setMessage] = useState('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    apiGetGiftCardPublicSettings(store.storeId)
      .then(res => setSettings(res.data))
      .catch(() => setSettings({ purchaseEnabled: false, denominations: [], currency: store.baseCurrency ?? 'USD' }))
      .finally(() => setLoading(false));
  }, [store.storeId, store.baseCurrency]);

  const symbol = currencySymbol(settings?.currency ?? store.baseCurrency);

  const handleContinue = async () => {
    if (!amount) { setError('Choose an amount.'); return; }
    if (!recipientEmail.trim()) { setError("Enter the recipient's email."); return; }
    setError('');
    setCreating(true);
    try {
      const res = await apiCreateGiftCardPurchaseIntent(store.storeId, {
        amount, recipientEmail: recipientEmail.trim(), recipientName: recipientName.trim() || undefined, message: message.trim() || undefined,
      });
      setClientSecret(res.data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start purchase.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <main className="mx-auto" style={{ maxWidth: '520px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink, marginBottom: '8px' }}>Gift Cards</h1>
      <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginBottom: '28px' }}>
        Buy a gift card for yourself or someone else at {store.name}.
      </p>

      {loading ? (
        <div className="animate-pulse" style={{ height: '320px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />
      ) : !settings?.purchaseEnabled ? (
        <div className="flex flex-col items-center text-center" style={{ padding: '64px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <Gift size={28} style={{ color: t.colors.inkMuted, marginBottom: '14px' }} />
          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink }}>Gift cards aren't available</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>{store.name} hasn't enabled gift card purchases.</p>
        </div>
      ) : done ? (
        <div className="flex flex-col items-center text-center" style={{ padding: '64px 0', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <Check size={28} style={{ color: t.colors.success, marginBottom: '14px' }} />
          <p style={{ fontFamily: t.fonts.display, fontSize: '16px', fontWeight: 700, color: t.colors.ink }}>Payment received</p>
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.inkMuted, marginTop: '6px' }}>
            The gift card code is being emailed to {recipientEmail}.
          </p>
        </div>
      ) : clientSecret ? (
        isStripeConfigured() ? (
          <StripeCardPayment clientSecret={clientSecret} amount={amount ?? 0} currency={settings.currency} onConfirmed={() => setDone(true)} />
        ) : (
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>Payments aren't configured yet.</p>
        )
      ) : (
        <>
          <p style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.ink, marginBottom: '10px' }}>Choose an amount</p>
          <div className="grid grid-cols-3 gap-2.5" style={{ marginBottom: '22px' }}>
            {settings.denominations.map(d => (
              <button
                key={d} type="button" onClick={() => setAmount(d)}
                className="cursor-pointer"
                style={{
                  fontFamily: t.fonts.body, fontSize: '14px', fontWeight: 700, padding: '14px 0', borderRadius: t.radius.sm,
                  border: `1.5px solid ${amount === d ? t.colors.accent : t.colors.border}`,
                  background: amount === d ? t.colors.accent : 'transparent',
                  color: amount === d ? '#FFFFFF' : t.colors.ink,
                }}
              >
                {symbol}{d}
              </button>
            ))}
          </div>

          <label htmlFor="nova-gc-email" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.ink, display: 'block', marginBottom: '5px' }}>Recipient email</label>
          <input
            id="nova-gc-email" type="email" value={recipientEmail} onChange={e => setRecipientEmail(e.target.value)}
            className="w-full" style={{ fontFamily: t.fonts.body, fontSize: '13px', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.sm, padding: '10px 12px', marginBottom: '14px', color: t.colors.ink }}
          />
          <label htmlFor="nova-gc-name" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.ink, display: 'block', marginBottom: '5px' }}>Recipient name <span style={{ color: t.colors.inkMuted, fontWeight: 400 }}>(optional)</span></label>
          <input
            id="nova-gc-name" value={recipientName} onChange={e => setRecipientName(e.target.value)}
            className="w-full" style={{ fontFamily: t.fonts.body, fontSize: '13px', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.sm, padding: '10px 12px', marginBottom: '14px', color: t.colors.ink }}
          />
          <label htmlFor="nova-gc-msg" style={{ fontFamily: t.fonts.body, fontSize: '12px', fontWeight: 700, color: t.colors.ink, display: 'block', marginBottom: '5px' }}>Message <span style={{ color: t.colors.inkMuted, fontWeight: 400 }}>(optional)</span></label>
          <textarea
            id="nova-gc-msg" value={message} onChange={e => setMessage(e.target.value)} rows={3}
            className="w-full" style={{ fontFamily: t.fonts.body, fontSize: '13px', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.sm, padding: '10px 12px', marginBottom: '18px', resize: 'vertical', color: t.colors.ink }}
          />

          {error && (
            <p className="flex items-center gap-1.5" style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.danger, marginBottom: '14px' }}>
              <AlertCircle size={13} /> {error}
            </p>
          )}

          <NovaButton onClick={handleContinue} loading={creating}>Continue to Payment</NovaButton>
        </>
      )}
    </main>
  );
}
