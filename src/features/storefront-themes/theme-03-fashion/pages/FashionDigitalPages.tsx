import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Download, GraduationCap, KeyRound, Library, Crown, Play, Lock } from 'lucide-react';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { TokenStorage } from '@/api/services/auth';
import { apiDownloadUrl, apiGetLibrary, apiRecoverLibrary, type LibraryItem } from '@/api/services/digitalLibrary';
import { apiChangePlan, apiJoinPlan, apiMembershipAction, apiMyMemberships, apiPublicPlans, type MySubscription, type PublicPlan } from '@/api/services/memberships';
import { apiCompleteLesson, apiCourseOutline, apiLessonMedia, apiMyCourses, apiOpenCertificate, apiSubmitQuiz, type CourseOutline, type LessonView } from '@/api/services/courses';
import client from '@/api/client';
import { fashionTheme as t } from '../theme.config';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { useLoad } from '../../core/pageHooks';
import { AccountLayout } from '../ui/AccountLayout';
import { Card, EmptyState, ErrorState, Field, Notice, PillButton, SkeletonBlock, StatusPill, TextInput } from '../ui/primitives';
import { RequireAccount } from './orders/OrderParts';

const msg = (e: any, d: string) => e?.response?.data?.message ?? e?.message ?? d;
const muted = { color: t.colors.inkMuted } as const;
const RECENT_DAYS = 14;
const isRecent = (iso: string | null) => !!iso && Date.now() - new Date(iso).getTime() < RECENT_DAYS * 86_400_000;
const mb = (n: number | null) => (n ? `${(n / 1024 / 1024).toFixed(1)} MB` : '');
const LIVE = ['trialing', 'active', 'past_due', 'paused'];

// ---------------------------------------------------------------- library

function Library_() {
  useStorefrontSeo({ title: 'My library', noindex: true });
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
    catch (e) { setError(msg(e, 'Download failed')); } finally { setBusy(null); }
  }
  async function recover(e: React.FormEvent) {
    e.preventDefault(); setError(null);
    try { await apiRecoverLibrary(storeId, form.orderRef, form.email); setSent(true); } catch (err) { setError(msg(err, 'Something went wrong')); }
  }

  const body = !signedIn && !recovery ? (
    sent ? <Notice tone="success">If we found a matching order, we emailed you a link to your downloads. It works for 30 minutes.</Notice> : (
      <Card><form onSubmit={recover} className="flex max-w-md flex-col gap-4">
        <p className="m-0 text-sm" style={muted}><Link to="/login" style={{ color: t.colors.ink }}>Sign in</Link> to see your downloads, or ask for a link with your order number and email.</p>
        <Field label="Order number" required>{(f) => <TextInput {...f} required value={form.orderRef} onChange={(e) => setForm({ ...form, orderRef: e.target.value })} />}</Field>
        <Field label="Email used at checkout" required>{(f) => <TextInput {...f} required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />}</Field>
        <PillButton type="submit">Email me a link</PillButton>
      </form></Card>
    )
  ) : loading ? <SkeletonBlock h={120} rows={2} />
    : loadError ? <ErrorState message="We could not load your downloads." onRetry={retry} />
    : !data?.length ? <EmptyState icon={<Library size={24} />} title="No downloads yet" text="Digital products you buy will show up here." />
    : (
      <ul className="m-0 flex list-none flex-col gap-3 p-0">
        {data.map((it) => (
          <li key={it.accessId}><Card>
            <div className="mb-3 flex items-center gap-3">
              {it.image && <img src={it.image} alt="" className="size-14 object-cover" style={{ borderRadius: 12 }} />}
              <div className="min-w-0 flex-1">
                <p className="m-0 text-base font-semibold">{it.name}</p>
                <p className="m-0 text-[13px]" style={muted}>{it.downloadLimit === 'unlimited' ? 'Unlimited downloads' : `${it.downloadsUsed} of ${it.downloadLimit} downloads used`}{it.expiresAt ? ` · expires ${new Date(it.expiresAt).toLocaleDateString()}` : ''}</p>
              </div>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {it.files.map((f) => (
                <li key={f.fileIndex} className="flex flex-wrap items-center gap-3 py-2" style={{ borderTop: `1px solid ${t.colors.border}` }}>
                  <span className="min-w-0 flex-1 text-sm">
                    {f.label || f.name}{f.version && <span style={muted}> v{f.version}</span>} {isRecent(f.updatedAt) && <StatusPill tone="good">Updated</StatusPill>}
                    <span style={muted}> {mb(f.size)}</span>
                    {isRecent(f.updatedAt) && f.changelog && <span className="block text-xs" style={muted}>{f.changelog}</span>}
                  </span>
                  <PillButton variant="outline" disabled={busy === `${it.productId}:${f.fileIndex}`} onClick={() => void download(it.productId, f.fileIndex)}><Download size={15} aria-hidden /> Download</PillButton>
                </li>
              ))}
            </ul>
          </Card></li>
        ))}
      </ul>
    );

  return (
    <AccountLayout title="My *library*" subtitle="Your digital downloads, always up to date.">
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      {body}
    </AccountLayout>
  );
}
export const FashionLibraryPage = () => <Library_ />;

// ---------------------------------------------------------------- memberships

function Memberships_() {
  useStorefrontSeo({ title: 'Memberships', noindex: true });
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
  const price = (p: PublicPlan) => (p.type === 'free' ? 'Free' : `${p.currency} ${p.amount}${p.type === 'recurring' ? ` / ${p.intervalCount > 1 ? p.intervalCount + ' ' : ''}${p.interval}` : ' one-time'}`);

  async function run(fn: () => Promise<unknown>, done?: string) {
    setBusy(true); setError(null); setNote(null);
    try { await fn(); if (done) setNote(done); retry(); } catch (e) { setError(msg(e, 'Something went wrong')); } finally { setBusy(false); }
  }

  return (
    <AccountLayout title="My *memberships*" subtitle="Plans you have joined and plans you can join.">
      {error && <div className="mb-4"><Notice tone="error">{error}</Notice></div>}
      {note && <div className="mb-4"><Notice tone="success">{note}</Notice></div>}
      {loading ? <SkeletonBlock h={110} rows={2} /> : loadError ? <ErrorState message="We could not load memberships." onRetry={retry} /> : (
        <div className="flex flex-col gap-8">
          {subs.length > 0 && (
            <section><h2 className="mb-3 text-lg font-semibold">Your memberships</h2>
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {subs.map((s) => {
                  const p = planOf(s.planId);
                  const switches = plans.filter((x) => p && x.type === 'recurring' && x._id !== s.planId);
                  return (
                    <li key={s._id}><Card>
                      <div className="flex flex-wrap items-center gap-2"><p className="m-0 text-base font-semibold">{p?.name ?? 'Plan'}</p>
                        <StatusPill tone={s.status === 'active' || s.status === 'trialing' ? 'good' : s.status === 'past_due' ? 'warn' : 'neutral'}>{s.status.replace('_', ' ')}</StatusPill></div>
                      {s.awaitingFirstPayment && <p className="m-0 mt-1 text-sm" style={muted}>Waiting for the store to confirm your payment.</p>}
                      {s.currentPeriodEnd && <p className="m-0 mt-1 text-sm" style={muted}>{s.cancelAtPeriodEnd ? 'Ends' : 'Renews'} on {new Date(s.currentPeriodEnd).toLocaleDateString()}</p>}
                      {s.amountDue > 0 && <p className="m-0 mt-1 text-sm" style={muted}>Upgrade amount due: {p?.currency} {s.amountDue}</p>}
                      {LIVE.includes(s.status) && (
                        <div className="mt-4 flex flex-wrap gap-2">
                          {s.status === 'active' && <PillButton variant="outline" disabled={busy} onClick={() => void run(() => apiMembershipAction(storeId, s._id, 'pause'))}>Pause</PillButton>}
                          {s.status === 'paused' && <PillButton variant="outline" disabled={busy} onClick={() => void run(() => apiMembershipAction(storeId, s._id, 'resume'))}>Resume</PillButton>}
                          {!s.cancelAtPeriodEnd && <PillButton variant="ghost" disabled={busy} onClick={() => void run(() => apiMembershipAction(storeId, s._id, 'cancel'), 'Cancellation saved. Access continues until the end of the period.')}>Cancel</PillButton>}
                          {s.status === 'active' && switches.map((u) => (
                            <PillButton key={u._id} variant="outline" disabled={busy} onClick={() => void run(async () => { const r = await apiChangePlan(storeId, s._id, u._id); setNote(r.effective === 'now' ? `Switched. Amount due now: ${r.amountDue}` : 'Your plan will change at the end of this period.'); })}>Switch to {u.name}</PillButton>
                          ))}
                        </div>
                      )}
                    </Card></li>
                  );
                })}
              </ul>
            </section>
          )}
          {plans.length === 0 ? <EmptyState icon={<Crown size={24} />} title="No plans yet" text="This store has no membership plans right now." /> : (
            <section><h2 className="mb-3 text-lg font-semibold">Available plans</h2>
              <ul className="m-0 grid list-none gap-4 p-0 sm:grid-cols-2">
                {plans.map((p) => {
                  const has = subs.some((s) => s.planId === p._id && LIVE.includes(s.status));
                  return (
                    <li key={p._id}><Card className="flex h-full flex-col gap-2">
                      <p className="m-0 text-base font-semibold">{p.name}</p>
                      <p className="m-0 text-sm font-medium">{price(p)}{p.trialDays > 0 ? ` · ${p.trialDays}-day trial` : ''}</p>
                      {p.description && <p className="m-0 text-sm" style={muted}>{p.description}</p>}
                      {p.benefits.length > 0 && <ul className="m-0 ps-5 text-sm">{p.benefits.map((b) => <li key={b}>{b}</li>)}</ul>}
                      <div className="mt-auto pt-3"><PillButton full disabled={busy || has} onClick={() => void run(() => apiJoinPlan(storeId, p._id), p.type === 'free' ? 'You are in.' : 'Request sent. The store will confirm your payment.')}>{has ? 'Joined' : 'Join'}</PillButton></div>
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
  useStorefrontSeo({ title: 'My licenses', noindex: true });
  const { store } = useStorefront();
  const [copied, setCopied] = useState<string | null>(null);
  const { data, loading, error, retry } = useLoad<{ id: string; key: string; activationLimit: number; activations: number }[]>(
    () => client.get('/api/licenses/me', { params: { storeId: store.storeId } }) as Promise<any>, [store.storeId]);
  return (
    <AccountLayout title="My *licenses*" subtitle="Keys for the software you bought.">
      {loading ? <SkeletonBlock h={84} rows={2} /> : error ? <ErrorState message="We could not load your licenses." onRetry={retry} />
        : !data?.length ? <EmptyState icon={<KeyRound size={24} />} title="No license keys yet" text="Keys for your purchases will show up here." />
        : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {data.map((r) => (
              <li key={r.id}><Card className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1"><code className="select-all text-base font-semibold">{r.key}</code>
                  <p className="m-0 text-[13px]" style={muted}>{r.activations} of {r.activationLimit} devices activated</p></div>
                <PillButton variant="outline" onClick={() => { void navigator.clipboard?.writeText(r.key).then(() => setCopied(r.id)).catch(() => undefined); }}>{copied === r.id ? 'Copied' : 'Copy'}</PillButton>
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
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function run(fn: () => Promise<void>) { setBusy(true); setError(null); try { await fn(); } catch (e) { setError(msg(e, 'Something went wrong')); } finally { setBusy(false); } }

  if (lesson.locked) return <li><Card tone="soft" className="flex items-center gap-2 text-sm"><Lock size={15} aria-hidden /> <span>{lesson.title}</span><span style={muted}>· opens {lesson.unlockAt ? new Date(lesson.unlockAt).toLocaleDateString() : 'later'}</span></Card></li>;
  return (
    <li><Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2"><p className="m-0 text-base font-semibold">{lesson.title}</p>{lesson.completed && <StatusPill tone="good">Done{lesson.score != null ? ` · ${lesson.score}%` : ''}</StatusPill>}</div>
      {error && <Notice tone="error">{error}</Notice>}
      {lesson.type === 'text' && <p className="m-0 whitespace-pre-wrap text-sm leading-relaxed">{lesson.text}</p>}
      {lesson.type === 'video' && (media ? <video src={media} controls controlsList="nodownload" className="w-full" style={{ borderRadius: 12 }} onContextMenu={(e) => e.preventDefault()} />
        : <PillButton variant="outline" disabled={busy} onClick={() => void run(async () => setMedia((await apiLessonMedia(storeId, courseId, lesson.id)).url))}><Play size={15} aria-hidden /> Play video</PillButton>)}
      {lesson.type === 'file' && <PillButton variant="outline" disabled={busy} onClick={() => void run(async () => { window.open((await apiLessonMedia(storeId, courseId, lesson.id)).url, '_blank', 'noopener'); })}><Download size={15} aria-hidden /> {lesson.fileName}</PillButton>}
      {lesson.type === 'quiz' && lesson.quiz && (
        <div className="flex flex-col gap-4">
          {lesson.quiz.questions.map((q, qi) => (
            <fieldset key={qi} className="m-0 flex flex-col gap-2 border-0 p-0">
              <legend className="mb-1 text-sm font-medium">{q.q}</legend>
              {q.options.map((o, oi) => (
                <label key={oi} className="flex items-center gap-2 text-sm"><input type="radio" name={`${lesson.id}-${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; })} style={{ accentColor: t.colors.accent }} /> {o}</label>
              ))}
            </fieldset>
          ))}
          <div><PillButton disabled={busy || answers.filter((a) => a !== undefined).length < lesson.quiz.questions.length} onClick={() => void run(async () => {
            const r = await apiSubmitQuiz(storeId, courseId, lesson.id, answers);
            setResult(r.passed ? `Passed with ${r.score}%` : `Score ${r.score}%. You need ${lesson.quiz?.passScore}% to pass.`);
            if (r.passed) onChange();
          })}>Submit answers</PillButton></div>
          {result && <Notice tone={result.startsWith('Passed') ? 'success' : 'info'}>{result}</Notice>}
        </div>
      )}
      {lesson.type !== 'quiz' && !lesson.completed && <div><PillButton variant="ghost" disabled={busy} onClick={() => void run(async () => { await apiCompleteLesson(storeId, courseId, lesson.id); onChange(); })}>Mark as done</PillButton></div>}
    </Card></li>
  );
}

function Learn_() {
  useStorefrontSeo({ title: 'My courses', noindex: true });
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
    try { setOutline(await apiCourseOutline(storeId, courseId)); } catch (e) { setOutlineError(msg(e, 'Could not load this course')); }
  }, [storeId, courseId]);
  useEffect(() => { setOutline(null); void loadOutline(); }, [loadOutline]);

  if (courseId) {
    return (
      <AccountLayout title={outline?.title ?? 'Course'} actions={<PillButton variant="outline" onClick={() => setParams({})}>All courses</PillButton>}>
        {outlineError ? <ErrorState message={outlineError} onRetry={() => void loadOutline()} /> : !outline ? <SkeletonBlock h={96} rows={3} /> : (
          <div className="flex flex-col gap-6">
            {outline.completed && <div><PillButton onClick={() => void apiOpenCertificate(storeId, outline.courseId).catch((e) => setOutlineError(msg(e, 'Could not open the certificate')))}><GraduationCap size={16} aria-hidden /> Download certificate</PillButton></div>}
            {outline.modules.map((m) => (
              <section key={m.id}><h2 className="mb-3 text-lg font-semibold">{m.title}</h2>
                <ul className="m-0 flex list-none flex-col gap-3 p-0">{m.lessons.map((l) => <LessonCard key={l.id} storeId={storeId} courseId={outline.courseId} lesson={l} onChange={() => void loadOutline()} />)}</ul>
              </section>
            ))}
          </div>
        )}
      </AccountLayout>
    );
  }
  return (
    <AccountLayout title="My *courses*" subtitle="Pick up where you left off.">
      {list.loading ? <SkeletonBlock h={90} rows={2} /> : list.error ? <ErrorState message="We could not load your courses." onRetry={list.retry} />
        : !list.data?.length ? <EmptyState icon={<GraduationCap size={24} />} title="No courses yet" text="Courses you buy will show up here." />
        : (
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {list.data.map((c) => (
              <li key={c.courseId}><Card className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1"><p className="m-0 text-base font-semibold">{c.title}</p><p className="m-0 text-[13px]" style={muted}>{c.done} of {c.lessons} lessons{c.completed ? ' · completed' : ''}</p></div>
                <PillButton onClick={() => setParams({ course: c.courseId })}>{c.done ? 'Continue' : 'Start'}</PillButton>
              </Card></li>
            ))}
          </ul>
        )}
    </AccountLayout>
  );
}
export const FashionLearnPage = () => <RequireAccount><Learn_ /></RequireAccount>;

