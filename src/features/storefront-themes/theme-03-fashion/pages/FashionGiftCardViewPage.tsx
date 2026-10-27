import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Copy, Gift } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { apiGetGiftCardView, type GiftCardView } from '@/api/services/giftCards';
import { fashionTheme as t } from '../theme.config';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useLoad } from '../../core/pageHooks';
import { moneyText } from '../../core/money';
import { formatOrderDate } from '../../orderUi';
import { Card, EmptyState, ErrorState, Page, PageTitle, SkeletonBlock } from '../ui/primitives';

/** `null` = the link is wrong, forged or expired (a real answer, not something to retry). */
async function loadGiftCard(token: string): Promise<GiftCardView | null> {
  try {
    const res = await apiGetGiftCardView(token);
    return res.data ?? null;
  } catch (err) {
    const e = err as { status?: number; response?: { status?: number } };
    const status = e?.status ?? e?.response?.status;
    if (status === 404 || status === 400 || status === 403) return null;
    throw err;
  }
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setFailed(false);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setFailed(true);
    }
  };
  return (
    <div className="flex flex-col items-center gap-2">
      <button type="button" onClick={copy} className="fx-pill inline-flex cursor-pointer items-center gap-2"
        aria-label={ts('pg.copy_code_code', 'Copy code {{code}}', { code })}
        style={{ background: 'transparent', color: 'inherit', border: '1.5px solid currentColor', borderRadius: t.buttonRadiusPx }}>
        {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
        <span aria-live="polite">{copied ? ts('pg.word_copied', 'Copied') : ts('pg.copy_code', 'Copy code')}</span>
      </button>
      {failed && <p role="status" className="m-0 text-xs opacity-80">{ts('pg.copy_is_not_available_here_select_the', 'Copy is not available here. Select the code instead.')}</p>}
    </div>
  );
}

function GiftCardBody({ card }: { card: GiftCardView }) {
  const inactive = card.status !== 'active';
  const note = card.status === 'disabled' ? ts('pg.gift_card_disabled', 'This gift card is no longer active.') : card.status === 'expired' ? ts('pg.gift_card_expired', 'This gift card has expired.') : null;
  return (
    <div className="flex flex-col gap-6">
      <div className="mx-auto w-full max-w-[560px] overflow-hidden text-center" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: 28, padding: 'clamp(24px, 5vw, 44px)', opacity: inactive ? 0.6 : 1 }}>
        <p className="fx-bidi m-0 inline-flex items-center gap-2 text-sm font-medium opacity-90"><Gift size={16} aria-hidden />{ts('pg.gift_card_from_store', 'A gift card from {{store}}', { store: card.storeName })}</p>
        <p className="m-0 mt-5 text-[clamp(40px,9vw,64px)] font-semibold leading-none tracking-tight" style={{ fontFamily: t.fonts.display }}>{moneyText(card.balance, card.currency)}</p>
        {card.message && <p className="fx-bidi m-0 mt-5 text-base italic opacity-90">“<bdi>{card.message}</bdi>”</p>}
        <p dir="ltr" className="m-0 mt-7 select-all text-[clamp(20px,5vw,28px)] font-semibold tracking-[0.12em]" aria-label={ts('checkout.giftCardCode', 'Gift card code')}>{card.code}</p>
        {!inactive && <div className="mt-5"><CopyCode code={card.code} /></div>}
      </div>
      {note
        ? <p role="status" className="m-0 text-center text-base font-medium" style={{ color: t.colors.danger }}>{note}</p>
        : (
          <Card tone="soft" className="mx-auto w-full max-w-[560px] text-center">
            <p className="m-0 text-base font-medium">{ts('pg.gift_card_redeem_hint', 'Enter this code at checkout to use it.')}</p>
            {card.expiresAt && <p className="m-0 mt-1 text-sm" style={{ color: t.colors.inkMuted }}>{ts('pg.gift_card_valid_until', 'Valid until {{date}}', { date: formatOrderDate(card.expiresAt) })}</p>}
          </Card>
        )}
      <div className="text-center">
        <Link to="/" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('cart.continueShoppingLower', 'Continue shopping')}</Link>
      </div>
    </div>
  );
}

/** `/gift-cards/view/:token` - the page behind the button in the gift card email (no login): the code, the balance and how to use it. */
export function FashionGiftCardViewPage() {
  const { token = '' } = useParams<{ token: string }>();
  const { data: card, loading, error, retry } = useLoad(() => loadGiftCard(token), [token]);
  useStorefrontSeo({ title: ts('pg.gift_cards', 'Gift cards'), noindex: true });

  return (
    <Page>
      <PageTitle>{ts('h.gift_card_view', 'Your *gift card*')}</PageTitle>
      {loading ? (
        <div role="status" aria-label={ts('pg.loading_gift_cards', 'Loading gift cards')}><SkeletonBlock h={200} rows={2} /></div>
      ) : error ? (
        <ErrorState message={ts('pg.we_could_not_load_this_gift_card', 'We could not load this gift card.')} onRetry={retry} />
      ) : !card ? (
        <EmptyState icon={<Gift size={24} />} title={ts('pg.gift_card_not_found', 'We could not find this gift card')} text={ts('pg.gift_card_link_invalid', 'This link may be invalid or expired. Check the link in your gift card email.')}
          action={<Link to="/" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('cart.continueShoppingLower', 'Continue shopping')}</Link>} />
      ) : (
        <GiftCardBody card={card} />
      )}
    </Page>
  );
}
