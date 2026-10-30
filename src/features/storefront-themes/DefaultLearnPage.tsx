/* eslint-disable jsx-a11y/media-has-caption -- lesson videos are seller uploads and carry no caption track */
import { useCallback, useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { TokenStorage } from '@/api/services/auth';
import {
  apiCompleteLesson, apiCourseOutline, apiLessonMedia, apiMyCourses, apiOpenCertificate, apiSubmitQuiz,
  type CourseOutline, type CourseSummary, type LessonView,
} from '@/api/services/courses';

const msg = (e: any, d: string) => e?.response?.data?.message ?? e?.message ?? d;
const btn = 'rounded-lg border border-current/40 px-3 py-1.5 text-sm disabled:opacity-50';

function Lesson({ storeId, courseId, lesson, onChange }: { storeId: string; courseId: string; lesson: LessonView; onChange: () => void }) {
  const [media, setMedia] = useState<string | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function run(fn: () => Promise<void>) {
    setBusy(true); setError(null);
    try { await fn(); } catch (e: any) { setError(msg(e, 'Something went wrong')); } finally { setBusy(false); }
  }

  if (lesson.locked) {
    return <li className="rounded-lg border border-current/10 p-3 text-sm opacity-70">{lesson.title} · opens {lesson.unlockAt ? new Date(lesson.unlockAt).toLocaleDateString() : 'later'}</li>;
  }
  return (
    <li className="rounded-lg border border-current/20 p-3 text-sm flex flex-col gap-2">
      <p className="font-medium">{lesson.title} {lesson.completed && <span className="opacity-60">· done{lesson.score != null ? ` (${lesson.score}%)` : ''}</span>}</p>
      {error && <p role="alert" className="text-red-600">{error}</p>}
      {lesson.type === 'text' && <p className="whitespace-pre-wrap">{lesson.text}</p>}
      {lesson.type === 'video' && (media
        ? <video src={media} controls controlsList="nodownload" className="w-full rounded-lg" onContextMenu={(e) => e.preventDefault()} />
        : <button className={`${btn} self-start`} disabled={busy} onClick={() => void run(async () => setMedia((await apiLessonMedia(storeId, courseId, lesson.id)).url))}>Play video</button>)}
      {lesson.type === 'file' && <button className={`${btn} self-start`} disabled={busy} onClick={() => void run(async () => { window.open((await apiLessonMedia(storeId, courseId, lesson.id)).url, '_blank', 'noopener'); })}>Download {lesson.fileName}</button>}
      {lesson.type === 'quiz' && lesson.quiz && (
        <div className="flex flex-col gap-3">
          {lesson.quiz.questions.map((q, qi) => (
            <fieldset key={qi} className="flex flex-col gap-1">
              <legend className="font-medium">{q.q}</legend>
              {q.options.map((o, oi) => (
                <label key={oi} className="flex items-center gap-2"><input type="radio" name={`${lesson.id}-${qi}`} checked={answers[qi] === oi} onChange={() => setAnswers((a) => { const n = [...a]; n[qi] = oi; return n; })} /> {o}</label>
              ))}
            </fieldset>
          ))}
          <button className={`${btn} self-start`} disabled={busy || answers.filter((a) => a !== undefined).length < lesson.quiz.questions.length} onClick={() => void run(async () => {
            const r = await apiSubmitQuiz(storeId, courseId, lesson.id, answers);
            setResult(r.passed ? `Passed with ${r.score}%` : `Score ${r.score}%. You need ${lesson.quiz?.passScore}% to pass.`);
            if (r.passed) onChange();
          })}>Submit answers</button>
          {result && <p role="status">{result}</p>}
        </div>
      )}
      {lesson.type !== 'quiz' && !lesson.completed && <button className={`${btn} self-start`} disabled={busy} onClick={() => void run(async () => { await apiCompleteLesson(storeId, courseId, lesson.id); onChange(); })}>Mark as done</button>}
    </li>
  );
}

/** Theme-neutral learner page (route key `learn`): course list and the course player. */
export function DefaultLearnPage() {
  const { store } = useStorefront();
  const storeId = store.storeId;
  const signedIn = !!TokenStorage.getToken();
  const [params, setParams] = useSearchParams();
  const courseId = params.get('course');
  const [courses, setCourses] = useState<CourseSummary[] | null>(null);
  const [outline, setOutline] = useState<CourseOutline | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      if (courseId) setOutline(await apiCourseOutline(storeId, courseId));
      else setCourses(await apiMyCourses(storeId));
    } catch (e: any) { setError(msg(e, 'Could not load')); if (!courseId) setCourses([]); }
  }, [storeId, courseId]);
  useEffect(() => { setOutline(null); if (signedIn) void load(); }, [signedIn, load]);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10">
      <meta name="robots" content="noindex" />
      <h1 className="text-2xl font-semibold mb-6">{outline ? outline.title : 'My courses'}</h1>
      {error && <p role="alert" className="mb-4 text-sm text-red-600">{error}</p>}
      {!signedIn && <p className="text-sm"><Link to="/login" className="underline">Sign in</Link> to see your courses.</p>}

      {signedIn && !courseId && courses === null && <p aria-busy="true" className="text-sm opacity-70">Loading...</p>}
      {!courseId && courses?.length === 0 && !error && <p className="text-sm opacity-70">You have no courses yet.</p>}
      {!courseId && (
        <ul className="flex flex-col gap-3">
          {courses?.map((c) => (
            <li key={c.courseId} className="rounded-xl border border-current/20 p-4 text-sm flex items-center gap-3">
              <div className="flex-1"><p className="font-medium">{c.title}</p><p className="opacity-70">{c.done} of {c.lessons} lessons{c.completed ? ' · completed' : ''}</p></div>
              <button className={btn} onClick={() => setParams({ course: c.courseId })}>{c.done ? 'Continue' : 'Start'}</button>
            </li>
          ))}
        </ul>
      )}

      {courseId && (
        <div className="flex flex-col gap-5">
          <button className={`${btn} self-start`} onClick={() => setParams({})}>All courses</button>
          {!outline && !error && <p aria-busy="true" className="text-sm opacity-70">Loading...</p>}
          {outline?.completed && <button className={`${btn} self-start`} onClick={() => void apiOpenCertificate(storeId, outline.courseId).catch((e) => setError(msg(e, 'Could not open the certificate')))}>Download certificate</button>}
          {outline?.modules.map((m) => (
            <section key={m.id}>
              <h2 className="font-medium mb-2">{m.title}</h2>
              <ul className="flex flex-col gap-2">{m.lessons.map((l) => <Lesson key={l.id} storeId={storeId} courseId={outline.courseId} lesson={l} onChange={() => void load()} />)}</ul>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}
