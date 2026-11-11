import { useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { BadgeCheck, Bell, ExternalLink, MessageCircle, ShieldAlert, ShieldCheck, UserRound } from 'lucide-react';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import { Badge, Button, SkeletonBox, StatusBadge } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import { can } from '@/hooks/auth/useCan';
import { whatsappHref } from '@/utils/whatsapp';
import {
  apiGetClientBusinessProfile, type ClientBusinessProfile, type ClientTrustStore,
} from '@/api/services/admin/adminSellerTrust';
import { NtnValue, PayoutHoldModal, PayoutHoldNote, RiskPill, RiskSignals, VerificationPill } from '../sellerTrust/TrustBits';
import { BUSINESS_TYPE, countryName, deadlineText, fmtDate, taxIdLabel, whatsappReminderText } from '../sellerTrust/trust.utils';
import { useTrustActions } from '../sellerTrust/useTrustActions';

const PROVIDER: Record<string, string> = { local: 'Email and password', google: 'Google', facebook: 'Facebook', apple: 'Apple' };

const humanize = (k: string) => k.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
const answerText = (v: unknown): string | null => {
  if (v == null || v === '') return null;
  if (Array.isArray(v)) return v.length ? v.map(x => humanize(String(x))).join(', ') : null;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') return null;
  return humanize(String(v));
};

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(120px,40%)_1fr] gap-x-4 text-[12.5px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-slate py-[7px] border-b border-bone/70">{k}</dt>
          <dd className="text-charcoal py-[7px] border-b border-bone/70 min-w-0 break-words">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

function Panel({ title, icon, aside, children }: { title: string; icon: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white border border-bone rounded-[10px] p-5 flex flex-col gap-3 min-w-0">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-brand-orange">{icon}</span>
        <h3 className="text-[13.5px] font-semibold text-charcoal">{title}</h3>
        {aside && <div className="ml-auto flex items-center gap-1.5">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

function ContactCard({ seller, stores }: { seller: ClientBusinessProfile['seller']; stores: ClientTrustStore[] }) {
  const acq = seller.acquisition;
  const cameFrom = acq ? [acq.source, acq.medium && `(${acq.medium})`, acq.campaign && `campaign "${acq.campaign}"`, acq.landingPage && `landing ${acq.landingPage}`].filter(Boolean).join(' · ') : '';
  const wa = seller.phone ? whatsappHref(seller.phone) : null;
  const answers = Object.entries(seller.onboardingAnswers ?? {})
    .map(([k, v]) => [humanize(k), answerText(v)] as const)
    .filter((e): e is readonly [string, string] => !!e[1]);

  const rows: [string, ReactNode][] = [
    ['Owner', seller.name],
    ['Email', <span className="inline-flex items-center gap-1.5 flex-wrap">{seller.email} {seller.emailVerified ? <Badge color="green" size="sm">Confirmed</Badge> : <Badge color="yellow" size="sm">Not confirmed</Badge>}</span>],
    ['Phone / WhatsApp', seller.phone ? (
      <span className="inline-flex items-center gap-2 flex-wrap">{seller.phone}
        {wa && <a href={wa} target="_blank" rel="noopener noreferrer" className="text-[12px] font-medium text-brand-orange hover:underline inline-flex items-center gap-1"><MessageCircle size={12} />WhatsApp</a>}
      </span>
    ) : 'Not provided'],
    ['Address', seller.address || 'Not provided'],
    ...stores.map((s): [string, ReactNode] => [
      stores.length > 1 ? `Store: ${s.name}` : 'Store',
      <span>{s.name}{s.slug ? ` · ${s.slug}.solvexo.store` : ''} · <StatusBadge status={s.status} size="sm" /></span>,
    ]),
    ...stores.filter(s => s.contactEmail || s.contactPhone).map((s): [string, ReactNode] => [
      stores.length > 1 ? `Contact: ${s.name}` : 'Store contact', [s.contactEmail, s.contactPhone].filter(Boolean).join(' · '),
    ]),
    ['Joined', fmtDate(seller.createdAt)],
    ['Language', seller.languagePreference ? seller.languagePreference.toUpperCase() : '—'],
    ...answers.map(([k, v]): [string, ReactNode] => [k, v]),
    ['Came from', cameFrom || 'Unknown'],
    ['Partner code', acq?.partnerCode || '—'],
  ];

  return (
    <Panel
      title="Contact and sign-up"
      icon={<UserRound size={15} />}
      aside={<Badge color="gray" size="sm">Signed up with {PROVIDER[seller.authProvider ?? 'local'] ?? humanize(seller.authProvider ?? 'local')}</Badge>}
    >
      <Rows rows={rows} />
    </Panel>
  );
}

function StoreTrustCard({ store, sellerPhone, canManage, actions, onOpenReview }: {
  store: ClientTrustStore;
  sellerPhone: string | null;
  canManage: boolean;
  actions: ReturnType<typeof useTrustActions>;
  onOpenReview: () => void;
}) {
  const [holdOpen, setHoldOpen] = useState(false);
  const pk = (store.country ?? 'PK').toUpperCase() === 'PK';
  const taxLabel = taxIdLabel(store.country);
  const held = !!store.payoutHold?.active;
  const verified = store.verificationStatus === 'verified';
  const left = deadlineText(store.dueAt);
  const phone = store.contactPhone || sellerPhone;
  const wa = phone && !verified ? whatsappHref(phone, whatsappReminderText(store.name, store.dueAt)) : null;

  const rows: [string, ReactNode][] = [
    ['Legal name', store.legalBusinessName || 'Not provided'],
    ...(pk ? [['CNIC', store.cnicNumber || 'Not provided'] as [string, ReactNode]] : []),
    [taxLabel, <NtnValue hasNtn={store.hasNtn} ntn={store.ntn} />],
    [`${taxLabel} on invoices`, store.invoiceTaxId || 'Store Settings: empty'],
    ['Country', countryName(store.country)],
    ['Seller type', store.businessType ? BUSINESS_TYPE[store.businessType] : 'Not chosen'],
    ['Category', store.categoryName || '—'],
    ['Deadline', verified ? 'Verified' : store.dueAt ? `${fmtDate(store.dueAt)}${left ? ` (${left})` : ''}` : 'No deadline yet (enforcement not started)'],
    ['Marketplace', store.limited ? <span className="text-error font-medium">Limited: hidden, payouts held</span> : 'Normal'],
  ];

  return (
    <Panel
      title={`Business verification · ${store.name}`}
      icon={<ShieldCheck size={15} />}
      aside={<><VerificationPill status={store.verificationStatus} showDeadline={false} /><RiskPill level={store.riskLevel} /></>}
    >
      <Rows rows={rows} />
      <PayoutHoldNote hold={store.payoutHold} />
      <div>
        <p className="text-[12px] font-semibold text-charcoal mb-2">Risk signals</p>
        <RiskSignals reasons={store.riskReasons ?? []} />
      </div>
      <div className="flex flex-wrap items-center gap-2 pt-1">
        {canManage && !verified && (
          <Button size="sm" variant="primary" icon={<Bell size={13} />} loading={actions.busy === `remind:${store.storeId}`} onClick={() => actions.remind(store.storeId)}>
            Send reminder
          </Button>
        )}
        {wa && (
          <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-success border border-bone rounded-lg px-3 py-[6px] hover:bg-cream">
            <MessageCircle size={13} /> WhatsApp seller
          </a>
        )}
        {canManage && (
          <Button size="sm" variant={held ? 'secondary' : 'outline'} icon={<ShieldAlert size={13} />} onClick={() => setHoldOpen(true)}>
            {held ? 'Release hold' : 'Hold payouts'}
          </Button>
        )}
        <Button size="sm" variant="ghost" icon={<ExternalLink size={13} />} onClick={onOpenReview}>Open review</Button>
      </div>
      {holdOpen && (
        <PayoutHoldModal
          storeName={store.name}
          holding={held}
          busy={actions.busy === `hold:${store.storeId}`}
          onCancel={() => setHoldOpen(false)}
          onConfirm={async reason => { if (await actions.setHold(store.storeId, !held, reason)) setHoldOpen(false); }}
        />
      )}
    </Panel>
  );
}

/** Client → Business profile: everything the seller told us (contact, sign-up answers, where they came from)
 *  plus each store's verification, risk and deadline, with the reminder / payout-hold actions. */
export function BusinessProfileTab({ sellerId }: { sellerId: string }) {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useAnalyticsQuery((p: { sellerId: string }) => apiGetClientBusinessProfile(p.sellerId), { sellerId });
  const actions = useTrustActions(refetch);
  const canManage = can('marketplace.manage');

  if (loading && !data) {
    return <div className="grid lg:grid-cols-2 gap-4"><SkeletonBox height={360} rounded="10px" /><SkeletonBox height={360} rounded="10px" /></div>;
  }
  if (error || !data) return <AnalyticsErrorState message={error || 'Could not load the business profile.'} onRetry={refetch} />;

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-start">
      <ContactCard seller={data.seller} stores={data.stores} />
      <div className="flex flex-col gap-4 min-w-0">
        {data.stores.length === 0 ? (
          <Panel title="Business verification" icon={<BadgeCheck size={15} />}>
            <p className="text-[12.5px] text-slate">This client has no store yet, so there is nothing to verify.</p>
          </Panel>
        ) : data.stores.map(s => (
          <StoreTrustCard
            key={s.storeId}
            store={s}
            sellerPhone={data.seller.phone}
            canManage={canManage}
            actions={actions}
            onOpenReview={() => navigate(`/admin/seller-trust/${s.storeId}`)}
          />
        ))}
      </div>
    </div>
  );
}
