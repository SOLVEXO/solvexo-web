import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Bell, CheckCircle2, ExternalLink, FileText, History, MessageCircle, MessageSquareWarning,
  ScanSearch, ShieldAlert, ShieldCheck, UserRound, XCircle,
} from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAnalyticsQuery } from '@/hooks/useAnalyticsQuery';
import { useToast } from '@/contexts/ToastContext';
import { can } from '@/hooks/auth/useCan';
import { whatsappHref } from '@/utils/whatsapp';
import { AdminPageHeader, Badge, Button, Modal, SkeletonBox, StatusBadge, Textarea } from '@/components/comman/ui';
import { AnalyticsErrorState } from '@/components/comman/analytics/AnalyticsErrorState';
import {
  apiGetSellerTrustStore, apiTrustApprove, apiTrustMarkUnderReview, apiTrustNtnCheck, apiTrustReject, apiTrustRequestInfo,
  type NtnCheckResult, type SellerTrustDetail,
} from '@/api/services/admin/adminSellerTrust';
import { NtnValue, PayoutHoldModal, PayoutHoldNote, RiskPill, RiskSignals, VerificationPill } from './TrustBits';
import {
  BUSINESS_TYPE, FBR_NTN_CHECK_URL, NTN_CHECK, countryName, deadlineText, docLabel, fieldLabel, fmtDate, fmtDateTime,
  historyLabel, questionnaireRows, taxIdLabel, whatsappReminderText,
} from './trust.utils';
import { useTrustActions } from './useTrustActions';

const errMsg = (e: unknown, fallback: string) => (e instanceof Error && e.message ? e.message : fallback);
const ID_TYPE: Record<string, string> = { cnic: 'CNIC', passport: 'Passport', national_id: 'National ID / Emirates ID' };
const REVIEWABLE = ['pending', 'under_review'];

function Panel({ title, icon, aside, children }: { title: string; icon: ReactNode; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="bg-white border border-bone rounded-[10px] p-5 flex flex-col gap-3 min-w-0" aria-label={title}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-brand-orange">{icon}</span>
        <h2 className="text-[13.5px] font-semibold text-charcoal">{title}</h2>
        {aside && <div className="ml-auto flex items-center gap-1.5">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

function Rows({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(120px,38%)_1fr] gap-x-4 text-[12.5px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-slate py-[7px] border-b border-bone/70">{k}</dt>
          <dd className="text-charcoal py-[7px] border-b border-bone/70 min-w-0 break-words">{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  );
}

const orNot = (v: string | null | undefined) => v || <span className="text-slate">Not provided</span>;

type Dialog = null | 'approve' | 'info' | 'reject' | 'hold';

/** Seller trust → one store: everything the seller submitted, documents, NTN check, answers, risk and history,
 *  with the review actions. */
export function SellerTrustReview() {
  const { storeId = '' } = useParams<{ storeId: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const canManage = can('marketplace.manage');
  const { data: d, loading, error, refetch } = useAnalyticsQuery((p: { storeId: string }) => apiGetSellerTrustStore(p.storeId), { storeId });
  usePageTitle(d ? `Review: ${d.storeName}` : 'Seller trust review');
  const trust = useTrustActions(refetch);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<unknown>, done: string) {
    setBusy(key);
    try {
      await fn();
      toast.success(done);
      setDialog(null);
      setText('');
      refetch();
    } catch (e) {
      toast.error(errMsg(e, 'That did not work. Try again.'));
    } finally {
      setBusy(null);
    }
  }

  const back = (
    <button type="button" onClick={() => navigate('/admin/seller-trust')}
      className="mt-3 ml-4 sm:ml-7 text-[12px] font-semibold text-slate hover:text-carbon inline-flex items-center gap-1.5 bg-transparent border-0 cursor-pointer">
      <ArrowLeft size={12} /> Back to Seller trust
    </button>
  );

  if (loading && !d) {
    return <><AdminPageHeader title="Seller trust review" />{back}<div className="p-6 grid lg:grid-cols-[1fr_360px] gap-4"><SkeletonBox height={420} rounded="10px" /><SkeletonBox height={420} rounded="10px" /></div></>;
  }
  if (error || !d) {
    return <><AdminPageHeader title="Seller trust review" />{back}<div className="p-6"><AnalyticsErrorState message={error || 'Store not found'} onRetry={refetch} /></div></>;
  }

  return <ReviewBody d={d} back={back} canManage={canManage} dialog={dialog} setDialog={setDialog} text={text} setText={setText} busy={busy} run={run} trust={trust} />;
}

function ReviewBody({ d, back, canManage, dialog, setDialog, text, setText, busy, run, trust }: {
  d: SellerTrustDetail;
  back: ReactNode;
  canManage: boolean;
  dialog: Dialog;
  setDialog: (d: Dialog) => void;
  text: string;
  setText: (t: string) => void;
  busy: string | null;
  run: (key: string, fn: () => Promise<unknown>, done: string) => Promise<void>;
  trust: ReturnType<typeof useTrustActions>;
}) {
  const v = d.verification;
  const country = (d.country ?? 'PK').toUpperCase();
  const pk = country === 'PK';
  const taxLabel = taxIdLabel(country);
  const reviewable = REVIEWABLE.includes(d.verificationStatus);
  const held = !!d.payoutHold?.active;
  const verified = d.verificationStatus === 'verified';
  const phone = d.seller.phone || v.authorizedContact?.phone || null;
  const wa = phone && !verified ? whatsappHref(phone, whatsappReminderText(d.storeName, d.deadline.dueAt)) : null;
  const missing = [...d.missingFields.map(fieldLabel), ...d.missingDocuments.map(docLabel)];
  const left = deadlineText(d.deadline.dueAt);
  const history = [...(v.history ?? [])].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  const closeDialog = () => { setDialog(null); setText(''); };

  const ntnCheck = v.ntnCheck;
  const contact = v.authorizedContact;

  return (
    <>
      <AdminPageHeader
        title={d.storeName}
        subtitle={[d.slug ? `${d.slug}.solvexo.store` : null, countryName(d.country), d.businessType ? BUSINESS_TYPE[d.businessType] : null].filter(Boolean).join(' · ')}
        actions={<div className="flex items-center gap-2"><StatusBadge status={d.status} size="sm" /><VerificationPill status={d.verificationStatus} showDeadline={false} /><RiskPill level={d.riskLevel} /></div>}
      />
      {back}

      <div className="px-4 sm:px-7 py-6 grid lg:grid-cols-[minmax(0,1fr)_360px] gap-4 items-start">
        <div className="flex flex-col gap-4 min-w-0">
          <Panel title="Business details" icon={<ShieldCheck size={15} />} aside={d.submittedAt ? <span className="text-[11.5px] text-slate">Submitted {fmtDate(d.submittedAt)}</span> : undefined}>
            <Rows rows={[
              ['Legal name', orNot(v.legalBusinessName)],
              ['Seller type', d.businessType ? BUSINESS_TYPE[d.businessType] : orNot(null)],
              ['ID type', v.idDocumentType ? ID_TYPE[v.idDocumentType] ?? v.idDocumentType : orNot(null)],
              ...(pk ? [['CNIC', orNot(v.cnicNumber)] as [string, ReactNode]] : []),
              [taxLabel, <span className="inline-flex items-center gap-2 flex-wrap"><NtnValue hasNtn={!!v.taxId} ntn={v.taxId} />{pk && v.taxId && (ntnCheck ? <Badge color={NTN_CHECK[ntnCheck.result].color} size="sm">{NTN_CHECK[ntnCheck.result].label}</Badge> : <Badge color="gray" size="sm">Not checked</Badge>)}</span>],
              ...(pk ? [['STRN', v.strn || <span className="text-slate">Not given (optional)</span>] as [string, ReactNode]] : []),
              [pk ? 'Registration no.' : 'Trade licence no.', orNot(v.registrationNumber)],
              [`${taxLabel} on invoices`, d.invoiceTaxId || <span className="text-slate">Store Settings: empty</span>],
              ['Business address', orNot(v.businessAddress)],
              ['Authorized contact', contact?.name ? [contact.name, contact.designation, contact.email, contact.phone].filter(Boolean).join(' · ') : orNot(null)],
              ...(d.categoryName ? [['Store category', d.categoryName] as [string, ReactNode]] : []),
            ]} />
            {d.rejectionReason && d.verificationStatus === 'rejected' && (
              <p className="text-[12px] text-error bg-error-bg rounded-lg px-3 py-2">Rejected: {d.rejectionReason}</p>
            )}
          </Panel>

          {pk && (
            <Panel title="NTN check" icon={<ScanSearch size={15} />}>
              <p className="text-[12.5px] text-graphite leading-[1.6]">
                FBR has no public API. Open FBR's Active Taxpayer List, search <strong className="tabular-nums">{v.taxId || 'the NTN'}</strong>, then record what you found. We save who checked it and when.
              </p>
              {ntnCheck && (
                <p className="text-[12px] text-graphite">
                  Last check: <Badge color={NTN_CHECK[ntnCheck.result].color} size="sm">{NTN_CHECK[ntnCheck.result].label}</Badge> on {fmtDateTime(ntnCheck.checkedAt)}{ntnCheck.checkedByName ? ` by ${ntnCheck.checkedByName}` : ''}
                </p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <a href={FBR_NTN_CHECK_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-deep-orange border border-bone rounded-lg px-3 py-[6px] hover:bg-cream">
                  <ExternalLink size={13} /> Check NTN on FBR
                </a>
                {canManage && v.taxId && (
                  <div role="group" aria-label="Record NTN result" className="inline-flex items-center gap-1.5 flex-wrap">
                    <span className="text-[12px] text-slate">Record result:</span>
                    {(Object.keys(NTN_CHECK) as NtnCheckResult[]).map(r => (
                      <Button key={r} size="xs" variant={ntnCheck?.result === r ? 'secondary' : 'outline'} loading={busy === `ntn:${r}`}
                        onClick={() => run(`ntn:${r}`, () => apiTrustNtnCheck(d.storeId, r), 'NTN check recorded.')}>
                        {r === 'active' ? 'Active' : r === 'not_found' ? 'Not found' : 'Inactive'}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </Panel>
          )}

          <Panel title="Documents" icon={<FileText size={15} />}>
            {d.documents.length === 0 ? <p className="text-[12.5px] text-slate">No documents are needed for this store.</p> : (
              <ul className="flex flex-col divide-y divide-bone/70">
                {d.documents.map(doc => (
                  <li key={doc.type} className="flex items-center gap-3 py-2.5 flex-wrap">
                    <FileText size={14} className="text-slate shrink-0" />
                    <div className="flex-1 min-w-[180px]">
                      <p className="text-[12.5px] text-charcoal">{docLabel(doc.type)} <span className="text-slate">· {doc.required ? 'required' : 'optional'}</span></p>
                      {doc.fileName && <p className="text-[11px] text-slate truncate">{doc.fileName}{doc.uploadedAt ? ` · ${fmtDate(doc.uploadedAt)}` : ''}</p>}
                    </div>
                    {doc.state === 'uploaded'
                      ? (doc.viewUrl
                        ? <a href={doc.viewUrl} target="_blank" rel="noopener noreferrer" className="text-[12px] font-semibold text-brand-orange hover:underline inline-flex items-center gap-1">View <ExternalLink size={11} /></a>
                        : <Badge color="green" size="sm">Uploaded</Badge>)
                      : doc.state === 'missing' ? <Badge color="red" size="sm">Not uploaded</Badge> : <Badge color="gray" size="sm">Not needed</Badge>}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-[11px] text-slate">Links expire after a few minutes. Reload the page for fresh ones.</p>
          </Panel>

          <Panel title="Products and services" icon={<MessageSquareWarning size={15} />}>
            <Rows rows={questionnaireRows(v.businessProfile).map(r => [r.label, r.value === 'Not answered' ? <span className="text-slate">Not answered</span> : r.value])} />
          </Panel>
        </div>

        <div className="flex flex-col gap-4 min-w-0">
          <Panel title="Decision" icon={<CheckCircle2 size={15} />}>
            <Rows rows={[
              ['Deadline', verified ? 'Verified' : d.deadline.dueAt ? `${fmtDate(d.deadline.dueAt)}${left ? ` (${left})` : ''}` : d.deadline.enforcementStarted ? '—' : 'Enforcement not started'],
              ['Marketplace', d.deadline.limited ? <span className="text-error font-medium">Limited: hidden, payouts held</span> : 'Normal'],
              ['Payouts', held ? <span className="text-error font-medium">On hold</span> : d.stripeConnect ? 'Stripe Connect (paid by Stripe)' : 'Normal'],
              ['Last reminder', d.lastTrustReminderAt ? fmtDateTime(d.lastTrustReminderAt) : 'Never'],
            ]} />
            <PayoutHoldNote hold={d.payoutHold} />
            {missing.length > 0 && !verified && (
              <div className="rounded-lg bg-warning-bg px-3 py-2">
                <p className="text-[12px] font-semibold text-warning mb-1">Still missing ({missing.length})</p>
                <ul className="text-[12px] text-charcoal list-disc ps-4">{missing.map(m => <li key={m}>{m}</li>)}</ul>
              </div>
            )}

            {canManage && (
              <div className="flex flex-col gap-2">
                {d.verificationStatus === 'pending' && (
                  <Button size="sm" variant="outline" fullWidth loading={busy === 'under_review'} onClick={() => run('under_review', () => apiTrustMarkUnderReview(d.storeId), 'Marked under review.')}>
                    Mark under review
                  </Button>
                )}
                {reviewable && (
                  dialog === 'approve' ? (
                    <div role="alertdialog" aria-label="Confirm approval" className="rounded-lg border border-success/30 bg-success-bg px-3 py-2.5 flex flex-col gap-2">
                      <p className="text-[12.5px] text-charcoal">Approve <strong>{d.storeName}</strong>? It gets the Verified badge, shows on the marketplace and payouts go back to normal (unless you hold them).</p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" loading={busy === 'approve'} onClick={() => run('approve', () => apiTrustApprove(d.storeId), 'Store approved and verified.')}>Yes, approve</Button>
                        <Button size="sm" variant="ghost" onClick={closeDialog}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <Button size="sm" variant="primary" fullWidth icon={<CheckCircle2 size={13} />} onClick={() => setDialog('approve')}>Approve</Button>
                  )
                )}
                {reviewable && <Button size="sm" variant="outline" fullWidth icon={<MessageSquareWarning size={13} />} onClick={() => setDialog('info')}>Ask for more info</Button>}
                {reviewable && <Button size="sm" variant="danger" fullWidth icon={<XCircle size={13} />} onClick={() => setDialog('reject')}>Reject with reason</Button>}
                <Button size="sm" variant={held ? 'secondary' : 'outline'} fullWidth icon={<ShieldAlert size={13} />} onClick={() => setDialog('hold')}>{held ? 'Release payout hold' : 'Hold payouts'}</Button>
                {!verified && (
                  <Button size="sm" variant="ghost" fullWidth icon={<Bell size={13} />} loading={trust.busy === `remind:${d.storeId}`} onClick={() => trust.remind(d.storeId)}>Send reminder (email + in-app)</Button>
                )}
              </div>
            )}
          </Panel>

          <Panel title="Seller" icon={<UserRound size={15} />}>
            <Rows rows={[
              ['Name', d.seller.name || '—'],
              ['Email', d.seller.email || '—'],
              ['Phone', d.seller.phone || '—'],
              ['Store created', fmtDate(d.createdAt)],
            ]} />
            <div className="flex flex-wrap gap-2">
              {wa && (
                <a href={wa} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-success border border-bone rounded-lg px-3 py-[6px] hover:bg-cream">
                  <MessageCircle size={13} /> WhatsApp seller
                </a>
              )}
              <Link to={`/admin/clients/${d.seller.id}`} className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-brand-deep-orange border border-bone rounded-lg px-3 py-[6px] hover:bg-cream">
                Open client
              </Link>
            </div>
          </Panel>

          <Panel title="Risk signals" icon={<ShieldAlert size={15} />} aside={<RiskPill level={d.riskLevel} />}>
            <RiskSignals reasons={d.riskReasons ?? []} />
          </Panel>

          <Panel title="History" icon={<History size={15} />}>
            {history.length === 0 ? <p className="text-[12.5px] text-slate">Nothing yet.</p> : (
              <ol className="relative border-s border-bone ms-1.5 flex flex-col gap-3">
                {history.map((h, i) => (
                  <li key={`${h.at}-${i}`} className="ps-4 relative">
                    <span className={`absolute -start-[5px] top-1.5 w-2.5 h-2.5 rounded-full ${h.actorRole === 'admin' ? 'bg-brand-orange' : 'bg-info'}`} aria-hidden />
                    <p className="text-[12.5px] text-charcoal font-medium">{historyLabel(h.action)} <span className="text-slate font-normal">· {h.actorRole === 'admin' ? 'Solvexo' : 'Seller'}</span></p>
                    {h.note && <p className="text-[12px] text-graphite mt-0.5 whitespace-pre-line">{h.note}</p>}
                    <p className="text-[11px] text-slate mt-0.5">{fmtDateTime(h.at)}</p>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>
      </div>

      {(dialog === 'info' || dialog === 'reject') && (
        <Modal
          title={dialog === 'info' ? 'Ask for more info' : 'Reject verification'}
          onClose={closeDialog}
          footer={<>
            <Button variant="ghost" onClick={closeDialog}>Cancel</Button>
            <Button variant={dialog === 'reject' ? 'danger' : 'primary'} disabled={text.trim().length < 5} loading={busy === dialog}
              onClick={() => (dialog === 'info'
                ? run('info', () => apiTrustRequestInfo(d.storeId, text.trim()), 'Request sent to the seller.')
                : run('reject', () => apiTrustReject(d.storeId, text.trim()), 'Verification rejected.'))}>
              {dialog === 'info' ? 'Send request' : 'Reject'}
            </Button>
          </>}
        >
          <div className="flex flex-col gap-3">
            <p className="text-[12.5px] text-graphite leading-[1.6]">
              {dialog === 'info'
                ? 'The seller sees this message on their verification page and gets an email. Their submission goes back to them until they resubmit.'
                : 'The seller sees this reason and can fix it and resubmit. The store keeps working (own store, POS, cash on delivery), limited as unverified.'}
            </p>
            <Textarea
              label={dialog === 'info' ? 'Message to the seller' : 'Reason'}
              value={text}
              onChange={e => setText(e.target.value)}
              rows={4}
              placeholder={dialog === 'info' ? 'e.g. Please upload a clearer copy of the back of your CNIC.' : 'e.g. The trade licence has expired.'}
            />
          </div>
        </Modal>
      )}

      {dialog === 'hold' && (
        <PayoutHoldModal
          storeName={d.storeName}
          holding={held}
          stripeConnect={d.stripeConnect}
          busy={trust.busy === `hold:${d.storeId}`}
          onCancel={closeDialog}
          onConfirm={async reason => { if (await trust.setHold(d.storeId, !held, reason)) closeDialog(); }}
        />
      )}
    </>
  );
}
