/* eslint-disable jsx-a11y/media-has-caption -- lesson videos are seller uploads and carry no caption track */
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, GraduationCap, KeyRound, Library, Crown, Play, Lock } from 'lucide-react';
import { ts } from '@/utils/tStatic';
import { errorMessage } from '@/api/errorMessage';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { TokenStorage } from '@/api/services/auth';
import { apiDownloadUrl, apiGetLibrary, apiRecoverLibrary, type LibraryItem } from '@/api/services/digitalLibrary';
import { apiChangePlan, apiJoinPlan, apiMembershipAction, apiMyMemberships, apiPublicPlans, type MySubscription, type PublicPlan } from '@/api/services/memberships';
import { apiCompleteLesson, apiCourseOutline, apiLessonMedia, apiMyCourses, apiOpenCertificate, apiSubmitQuiz, type CourseOutline, type LessonView } from '@/api/services/courses';
import client from '@/api/client';
import { fashionTheme as t } from '../theme.config';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useLoad } from '../../core/pageHooks';
import { activeLocale } from '../../core/locale';
import { AccountLayout } from '../ui/AccountLayout';
import { Card, EmptyState, ErrorState, Field, Notice, PillButton, SkeletonBlock, StatusPill, TextInput } from '../ui/primitives';
import { RequireAccount } from './orders/OrderParts';

const msg = errorMessage;
const muted = { color: t.colors.inkMuted } as const;
const RECENT_DAYS = 14;
const isRecent = (iso: string | null) => !!iso && Date.now() - new Date(iso).getTime() < RECENT_DAYS * 86_400_000;
const mb = (n: number | null) => (n ? `${(n / 1024 / 1024).toFixed(1)} MB` : '');
const day = (iso: string | Date) => new Date(iso).toLocaleDateString(activeLocale());
const LIVE = ['trialing', 'active', 'past_due', 'paused'];
const generic = () => ts('dg.something_went_wrong', 'Something went wrong');

// ---------------------------------------------------------------- library

function Library_() {
  useStorefrontSeo({ title: ts('dg.my_library_seo', 'My library'), noindex: true });
  const { store } = useStorefront();
  const storeId = store.storeId;
  const [params] = useSearchParams();
  const recovery = params.get('recovery') || undefined;
  const signedIn = !!TokenStorage.getToken();
  const [form, setForm] = useState({ orderRef: '', email: '' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const { data, loading, error: loadError, retry } = useLoad<LibraryItem[]>(() => (signedIn || recovery ? apiGetLibrary(storeId, recovery) : Promise.resolve([])), [storeId, recovery, signedIn]);

  async function download(productId: string, fileIndex: number) {
    setBusy(`${productId}:${fileIndex}`); setError(null);
    try { window.location.assign(await apiDownloadUrl(storeId, productId, fileIndex, recovery)); setTimeout(retry, 3000); }
    catch (e) { setError(msg(e, ts('dg.download_failed', 'Download failed'))); } finally { setBusy(null); }
  }
  async function recover(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    try { await apiRecoverLibrary(storeId, form.orderRef, form.email); setSent(true); } catch (err) { setError(msg(err, generic())); }
  }

  const body = !signedIn && !recovery ? (
    sent ? <Notice tone="success">{ts('dg.link_sent', 'If we found a matching order, we emailed you a link to your downloads. It works for 30 minutes.')}</Notice> : (
      <Card><form onSubmit={recover} className="flex max-w-md flex-col gap-4">
        <p className="m-0 text-sm" style={muted}>{ts('dg.recover_intro', 'Sign in to see your downloads, or ask for a link with your order number and email.')} <Link to="/login" style={{ color: t.colors.ink }}>{ts('dg.sign_in', 'Sign in')}</Link></p>
        <Field label={ts('dg.order_number', 'Order number')} required>{(f) => <TextInput {...f} required value={form.orderRef} onChange={(e) => setForm({ ...form, orderRef: e.target.value })} />}</Field>
        <Field label={ts('dg.checkout_email', 'Email used at checkout')} required>{(f) => <TextInput {...f} required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
        <PillButton type="submit">{ts('dg.email_me_link', 'Email me a link')}</PillButton>
      </form></Card>
    )
  ) : loading ? <SkeletonBlock h={120} rows={2} />
    : loadError ? <ErrorState message={ts('dg.library_load_error', 'We could not load your downloads.')} onRetry={retry} />
    : !data?.length ? <EmptyState icon={<Library size={24} />} title={ts('dg.no_downloads', 'No downloads yet')} text={ts('dg.no_downloads_text', 'Digital products you buy will show up here.')} />
    : (
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {data.map((it) => (
          <li key={it.accessId}><Card>
            <div className="mb-3 flex items-center gap-3">
              {it.image && <img src={it.image} alt="" className="size-14 object-cover" style={{ borderRadius: 12 }} />}
              <div className="min-w-0 flex-1">
                <p className="m-0 text-base font-semibold fx-bidi">{it.name}</p>
                <p className="m-0 text-[13px]" style={muted}>
                  {it.downloadLimit === 'unlimited' ? ts('dg.unlimited_downloads', 'Unlimited downloads') : ts('dg.downloads_used', '{{used}} of {{limit}} downloads used', { used: it.downloadsUsed, limit: it.downloadLimit })}
                  {it.expiresAt ? ` · ${ts('dg.expires_on', 'expires {{date}}', { date: day(it.expiresAt) })}` : ''}
                </p>
              </div>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {it.files.map((f) => (
                <li key={f.fileIndex} className="flex flex-wrap items-center gap-3 py-2" style={{ borderTop: `1px solid ${t.colors.border}` }}>
                  <span className="min-w-0 flex-1 text-sm">
                    <span className="fx-bidi">{f.label || f.name}</span>{f.version && <bdi style={muted}> v{f.version}</bdi>} {isRecent(f.updatedAt) && <StatusPill tone="good">{ts('dg.updated', 'Updated')}</StatusPill>}
                    <bdi style={muted}> {mb(f.size)}</bdi>
                    {isRecent(f.updatedAt) && f.changelog && <span className="block text-xs fx-bidi" style={muted}>{f.changelog}</span>}
                  </span>
                  <PillButton variant="outline" disabled={busy === `${it.productId}:${f.fileIndex}`} onClick={() => void download(it.productId, f.fileIndex)}><Download size={15} aria-hidden /> {ts('dg.download', 'Download')}</PillButton>
                </li>
              ))}
            </ul>
          </Card></li>
        ))}
      </ul>
    );

  return (
    <AccountLayout title={ts('dg.library_title', 'My *library*')} subtitle={ts('dg.library_subtitle', 'Your digital downloads, always up to date.')}>
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      {body}
    </AccountLayout>
  );
}
export const FashionLibraryPage = () => <Library_ />;

// ---------------------------------------------------------------- memberships

function Memberships_() {
  useStorefrontSeo({ title: ts('dg.memberships_seo', 'Memberships'), noindex: true });
  const { store } = useStorefront();
  const storeId = store.storeId;
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, loading, error: loadError, retry } = useLoad<{ plans: PublicPlan[]; subs: MySubscription[] }>(
    async () => ({ plans: await apiPublicPlans(storeId), subs: await apiMyMemberships(storeId) }), [storeId]);
  const plans = data?.plans ?? [];
  const subs = data?.subs ?? [];
  const planOf = (id: string) => plans.find((p) => p._id === id);
  const price = (p: PublicPlan) => {
    if (p.type === 'free') return ts('dg.free', 'Free');
    const amount = `${p.currency} ${p.amount}`;
    if (p.type !== 'recurring') return ts('dg.price_one_time', '{{amount}} one-time', { amount });
    if (p.interval === 'week') return ts('dg.price_per_week', '{{amount}} every {{n}} week(s)', { amount, n: p.intervalCount });
    if (p.interval === 'year') return ts('dg.price_per_year', '{{amount}} every {{n}} year(s)', { amount, n: p.intervalCount });
    return ts('dg.price_per_month', '{{amount}} every {{n}} month(s)', { amount, n: p.intervalCount });
  };
  const statusText = (s: string) => {
    if (s === 'active') return ts('dg.status_active', 'active');
    if (s === 'trialing') return ts('dg.status_trialing', 'trial');
    if (s === 'past_due') return ts('dg.status_past_due', 'payment due');
    if (s === 'paused') return ts('dg.status_paused', 'paused');
    if (s === 'cancelled') return ts('dg.status_cancelled', 'cancelled');
    return ts('dg.status_expired', 'expired');
  };

  async function run(fn: () => Promise<unknown>, done?: string) {
    setBusy(true); setError(null); setNote(null);
    try { await fn(); if (done) setNote(done); retry(); } catch (e) { setError(msg(e, generic())); } finally { setBusy(false); }
  }

  return (
    <AccountLayout title={ts('dg.memberships_title', 'My *memberships*')} subtitle={ts('dg.memberships_subtitle', 'Plans you have joined and plans you can join.')}>
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      {note && <div className="mb-4"><Notice tone="success">{note}</Notice></div>}
      {loading ? <SkeletonBlock h={110} rows={2} /> : loadError ? <ErrorState message={ts('dg.memberships_load_error', 'We could not load memberships.')} onRetry={retry} /> : (
        <div className="flex flex-col gap-8">
          {subs.length > 0 && (
            <section><h2 className="mb-3 text-lg font-semibold">{ts('dg.your_memberships', 'Your memberships')}</h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {subs.map((s) => {
                  const p = planOf(s.planId);
                  const switches = plans.filter((x) => p && x.type === 'recurring' && x._id !== s.planId);
                  return (
                    <li key={s._id}><Card>
                      <div className="flex flex-wrap items-center gap-2"><p className="m-0 text-base font-semibold fx-bidi">{p?.name ?? ts('dg.plan', 'Plan')}</p>
                        <StatusPill tone={s.status === 'active' || s.status === 'trialing' ? 'good' : s.status === 'past_due' ? 'warn' : 'neutral'}>{statusText(s.status)}</StatusPill></div>
                      {s.awaitingFirstPayment && <p className="m-0 mt-1 text-sm" style={muted}>{ts('dg.waiting_payment', 'Waiting for the store to confirm your payment.')}</p>}
                      {s.currentPeriodEnd && <p className="m-0 mt-1 text-sm" style={muted}>{s.cancelAtPeriodEnd ? ts('dg.ends_on', 'Ends on {{date}}', { date: day(s.currentPeriodEnd) }) : ts('dg.renews_on', 'Renews on {{date}}', { date: day(s.currentPeriodEnd) })}</p>}
                      {s.amountDue > 0 && <p className="m-0 mt-1 text-sm" style={muted}>{ts('dg.upgrade_due', 'Upgrade amount due: {{amount}}', { amount: `${p?.currency ?? ''} ${s.amountDue}` })}</p>}
                      {LIVE.includes(s.status) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {s.status === 'active' && <PillButton variant="outline" disabled={busy} onClick={() => void run(() => apiMembershipAction(storeId, s._id, 'pause'))}>{ts('dg.pause', 'Pause')}</PillButton>}
                          {s.status === 'paused' && <PillButton variant="outline" disabled={busy} onClick={() => void run(() => apiMembershipAction(storeId, s._id, 'resume'))}>{ts('dg.resume', 'Resume')}</PillButton>}
                          {!s.cancelAtPeriodEnd && <PillButton variant="ghost" disabled={busy} onClick={() => void run(() => apiMembershipAction(storeId, s._id, 'cancel'), ts('dg.cancel_saved', 'Cancellation saved. Access continues until the end of the period.'))}>{ts('dg.cancel', 'Cancel')}</PillButton>}
                          {s.status === 'active' && switches.map((u) => (
                            <PillButton key={u._id} variant="outline" disabled={busy} onClick={() => void run(async () => { const r = await apiChangePlan(storeId, s._id, u._id); setNote(r.effective === 'now' ? ts('dg.switched_due', 'Switched. Amount due now: {{amount}}', { amount: r.amountDue }) : ts('dg.switch_at_end', 'Your plan will change at the end of this period.')); })}>{ts('dg.switch_to', 'Switch to {{name}}', { name: u.name })}</PillButton>
                          ))}
                        </div>
                      )}
                    </Card></li>
                  );
                })}
              </ul>
            </section>
          )}
          {plans.length === 0 ? <EmptyState icon={<Crown size={24} />} title={ts('dg.no_plans', 'No plans yet')} text={ts('dg.no_plans_text', 'This store has no membership plans right now.')} /> : (
            <section><h2 className="mb-3 text-lg font-semibold">{ts('dg.available_plans', 'Available plans')}</h2>
              <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
                {plans.map((p) => {
                  const has = subs.some((s) => s.planId === p._id && LIVE.includes(s.status));
                  return (
                    <li key={p._id}><Card className="flex h-full flex-col gap-2">
                      <p className="m-0 text-base font-semibold fx-bidi">{p.name}</p>
                      <p className="m-0 text-sm font-medium">{price(p)}{p.trialDays > 0 ? ` · ${ts('dg.trial_days', '{{n}}-day trial', { n: p.trialDays })}` : ''}</p>
                      {p.description && <p className="m-0 text-sm fx-bidi" style={muted}>{p.description}</p>}
                      {p.benefits.length > 0 && <ul className="m-0 ps-5 text-sm">{p.benefits.map((b) => <li key={b} className="fx-bidi">{b}</li>)}</ul>}
                      <div className="mt-auto pt-3">{p.type !== 'free' && p.productSlug ? <Link to={`/product/${p.productSlug}`} className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx, width: '100%' }}>{has ? ts('dg.renew', 'Renew') : ts('dg.buy', 'Buy')}</Link> : <PillButton full disabled={busy || has} onClick={() => void run(() => apiJoinPlan(storeId, p._id), p.type === 'free' ? ts('dg.you_are_in', 'You are in.') : ts('dg.request_sent', 'Request sent. The store will confirm your payment.'))}>{has ? ts('dg.joined', 'Joined') : ts('dg.join', 'Join')}</PillButton>}</div>
                    </Card></li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}
    </AccountLayout>
  );
}
export const FashionMembershipsPage = () => <RequireAccount><Memberships_ /></RequireAccount>;

// ---------------------------------------------------------------- licenses

function Licenses_() {
  useStorefrontSeo({ title: ts('dg.licenses_seo', 'My licenses'), noindex: true });
  const { store } = useStorefront();
  const [copied, setCopied] = useState<string | null>(null);
  const { data, loading, error, retry } = useLoad<{ id: string; key: string; activationLimit: number; activations: number }[]>(
    () => client.get('/api/licenses/me', { params: { storeId: store.storeId } }) as Promise<{ id: string; key: string; activationLimit: number; activations: number }[]>, [store.storeId]);
  return (
    <AccountLayout title={ts('dg.licenses_title', 'My *licenses*')} subtitle={ts('dg.licenses_subtitle', 'Keys for the software you bought.')}>
      {loading ? <SkeletonBlock h={84} rows={2} /> : error ? <ErrorState message={ts('dg.licenses_load_error', 'We could not load your licenses.')} onRetry={retry} />
        : !data?.length ? <EmptyState icon={<KeyRound size={24} />} title={ts('dg.no_licenses', 'No license keys yet')} text={ts('dg.no_licenses_text', 'Keys for your purchases will show up here.')} />
        : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {data.map((r) => (
              <li key={r.id}><Card className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1"><bdi><code className="select-all text-base font-semibold">{r.key}</code></bdi>
                  <p className="m-0 text-[13px]" style={muted}>{ts('dg.devices_activated', '{{used}} of {{limit}} devices activated', { used: r.activations, limit: r.activationLimit })}</p></div>
                <PillButton variant="outline" onClick={() => { void navigator.clipboard?.writeText(r.key).then(() => setCopied(r.id)).catch(() => undefined); }}>{copied === r.id ? ts('dg.copied', 'Copied') : ts('dg.copy', 'Copy')}</PillButton>
              </Card></li>
            ))}
          </ul>
        )}
    </AccountLayout>
  );
}
export const FashionLicensesPage = () => <RequireAccount><Licenses_ /></RequireAccount>;

// ---------------------------------------------------------------- learn

function LessonCard({ storeId, courseId, lesson, onChange }: { storeId: string; courseId: string; lesson: LessonView; onChange: () => void }) {
  const [media, setMedia] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ passed: boolean; text: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<void>) { setBusy(true); setError(null); try { await fn(); } catch (e) { setError(msg(e, generic())); } finally { setBusy(false); } }

  if (lesson.locked) return <li><Card tone="soft" className="flex items-center gap-2 text-sm"><Lock size={15} aria-hidden /> <span className="fx-bidi">{lesson.title}</span><span style={muted}>· {lesson.unlockAt ? ts('dg.opens_on', 'opens {{date}}', { date: day(lesson.unlockAt) }) : ts('dg.opens_later', 'opens later')}</span></Card></li>;
  return (
    <li><Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2"><p className="m-0 text-base font-semibold fx-bidi">{lesson.title}</p>{lesson.completed && <StatusPill tone="good">{lesson.score != null ? ts('dg.done_score', 'Done · {{score}}%', { score: lesson.score }) : ts('dg.done', 'Done')}</StatusPill>}</div>
      {error && <Notice tone="error">{error}</Notice>}
      {lesson.type === 'text' && <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed fx-bidi">{lesson.text}</p>}
      {lesson.type === 'video' && (media ? <video src={media} controls controlsList="nodownload" className="w-full" style={{ borderRadius: 12 }} onContextMenu={(e) => e.preventDefault()} />
        : <PillButton variant="outline" disabled={busy} onClick={() => void run(async () => setMedia((await apiLessonMedia(storeId, courseId, lesson.id)).url))}><Play size={15} aria-hidden /> {ts('dg.play_video', 'Play video')}</PillButton>)}
      {lesson.type === 'file' && <PillButton variant="outline" disabled={busy} onClick={() => void run(async () => { window.open((await apiLessonMedia(storeId, courseId, lesson.id)).url, '_blank', 'noopener'); })}><Download size={15} aria-hidden /> <bdi>{lesson.fileName}</bdi></PillButton>}
      {lesson.type === 'quiz' && lesson.quiz && (
        <div className="flex flex-col gap-4">
          {lesson.quiz.questions.map((q, qi) => (
            <fieldset key={qi} className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-1 text-sm font-medium fx-bidi">{q.q}</legend>
              {q.options.map((o, oi) => (
                <label key={oi} className="flex items-center gap-2 text-sm"><input type="radio" name={`${lesson.id}-${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; })} style={{ accentColor: t.colors.accent }} /> <span className="fx-bidi">{o}</span></label>
              ))}
            </fieldset>
          ))}
          <div><PillButton disabled={busy || answers.filter((a) => a !== undefined).length < lesson.quiz.questions.length} onClick={() => void run(async () => {
            const r = await apiSubmitQuiz(storeId, courseId, lesson.id, answers);
            setResult({ passed: r.passed, text: r.passed ? ts('dg.quiz_passed', 'Passed with {{score}}%', { score: r.score }) : ts('dg.quiz_failed', 'Score {{score}}%. You need {{pass}}% to pass.', { score: r.score, pass: lesson.quiz?.passScore ?? 0 }) });
            if (r.passed) onChange();
          })}>{ts('dg.submit_answers', 'Submit answers')}</PillButton></div>
          {result && <Notice tone={result.passed ? 'success' : 'info'}>{result.text}</Notice>}
        </div>
      )}
      {lesson.type !== 'quiz' && !lesson.completed && <div><PillButton variant="ghost" disabled={busy} onClick={() => void run(async () => { await apiCompleteLesson(storeId, courseId, lesson.id); onChange(); })}>{ts('dg.mark_done', 'Mark as done')}</PillButton></div>}
    </Card></li>
  );
}

function Learn_() {
  useStorefrontSeo({ title: ts('dg.courses_seo', 'My courses'), noindex: true });
  const { store } = useStorefront();
  const storeId = store.storeId;
  const [params, setParams] = useSearchParams();
  const courseId = params.get('course');
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [outlineError, setOutlineError] = useState<string | null>(null);
  const list = useLoad(() => apiMyCourses(storeId), [storeId]);

  const loadOutline = useCallback(async () => {
    if (!courseId) return;
    setOutlineError(null);
    try { setOutline(await apiCourseOutline(storeId, courseId)); } catch (e) { setOutlineError(msg(e, ts('dg.course_load_error', 'Could not load this course'))); }
  }, [storeId, courseId]);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- loads once per key; the state is only set after the request resolves
  useEffect(() => { setOutline(null); void loadOutline(); }, [loadOutline]);

  if (courseId) {
    return (
      <AccountLayout title={outline?.title ?? ts('dg.course', 'Course')} actions={<PillButton variant="outline" onClick={() => setParams({})}>{ts('dg.all_courses', 'All courses')}</PillButton>}>
        {outlineError ? <ErrorState message={outlineError} onRetry={() => void loadOutline()} /> : !outline ? <SkeletonBlock h={96} rows={3} /> : (
          <div className="flex flex-col gap-6">
            {outline.completed && <div><PillButton onClick={() => void apiOpenCertificate(storeId, outline.courseId).catch((e) => setOutlineError(msg(e, ts('dg.certificate_error', 'Could not open the certificate'))))}><GraduationCap size={16} aria-hidden /> {ts('dg.download_certificate', 'Download certificate')}</PillButton></div>}
            {outline.modules.map((m) => (
              <section key={m.id}><h2 className="mb-3 text-lg font-semibold fx-bidi">{m.title}</h2>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">{m.lessons.map((l) => <LessonCard key={l.id} storeId={storeId} courseId={outline.courseId} lesson={l} onChange={() => void loadOutline()} />)}</ul>
              </section>
            ))}
          </div>
        )}
      </AccountLayout>
    );
  }
  return (
    <AccountLayout title={ts('dg.courses_title', 'My *courses*')} subtitle={ts('dg.courses_subtitle', 'Pick up where you left off.')}>
      {list.loading ? <SkeletonBlock h={90} rows={2} /> : list.error ? <ErrorState message={ts('dg.courses_load_error', 'We could not load your courses.')} onRetry={list.retry} />
        : !list.data?.length ? <EmptyState icon={<GraduationCap size={24} />} title={ts('dg.no_courses', 'No courses yet')} text={ts('dg.no_courses_text', 'Courses you buy will show up here.')} />
        : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {list.data.map((c) => (
              <li key={c.courseId}><Card className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1"><p className="m-0 text-base font-semibold fx-bidi">{c.title}</p><p className="m-0 text-[13px]" style={muted}>{ts('dg.lessons_progress', '{{done}} of {{total}} lessons', { done: c.done, total: c.lessons })}{c.completed ? ` · ${ts('dg.completed', 'completed')}` : ''}</p></div>
                <PillButton onClick={() => setParams({ course: c.courseId })}>{c.done ? ts('dg.continue', 'Continue') : ts('dg.start', 'Start')}</PillButton>
              </Card></li>
            ))}
          </ul>
        )}
    </AccountLayout>
  );
}
export const FashionLearnPage = () => <RequireAccount><Learn_ /></RequireAccount>;
