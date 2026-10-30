import { useCallback, useEffect, useState } from 'react';
import client from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { FileUpload } from '@/components/comman/ui';

interface Lesson {
  id?: string; title: string; type: 'text' | 'video' | 'file' | 'quiz'; text?: string; videoPublicId?: string | null; filePublicId?: string | null; fileName?: string | null;
  dripMode: 'none' | 'date' | 'days'; unlockAt?: string | null; unlockAfterDays?: number | null;
  quiz?: { passScore: number; questions: { q: string; options: string[]; correctIndex: number }[] } | null;
}
interface Module { id?: string; title: string; lessons: Lesson[] }
interface CourseForm { _id?: string; title: string; description: string; status: 'draft' | 'published'; productId: string; modules: Module[] }

const errText = (e: any) => e?.response?.data?.message ?? e?.message ?? 'Something went wrong';
const inp = 'h-9 rounded-lg border border-bone px-3 text-[13px] bg-white text-carbon outline-none focus:ring-2 focus:ring-brand-orange/30';
const btn = 'rounded-md border border-bone bg-white text-carbon px-2.5 py-1 text-[12px] hover:bg-cream disabled:opacity-50 cursor-pointer';
const blank = (): CourseForm => ({ title: '', description: '', status: 'draft', productId: '', modules: [{ title: 'Module 1', lessons: [] }] });
const newLesson = (): Lesson => ({ title: '', type: 'text', text: '', dripMode: 'none' });
const dateInput = (v?: string | null) => (v ? String(v).slice(0, 10) : '');

function LessonEditor({ l, onChange, onRemove }: { l: Lesson; onChange: (l: Lesson) => void; onRemove: () => void }) {
  const set = (p: Partial<Lesson>) => onChange({ ...l, ...p });
  const q = l.quiz ?? { passScore: 70, questions: [] };
  return (
    <div className="rounded-lg border border-bone p-2 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 items-end">
        <label className="text-[12px] flex-1 min-w-40">Title<input className={`${inp} w-full`} value={l.title} maxLength={160} onChange={(e) => set({ title: e.target.value })} /></label>
        <label className="text-[12px]">Type
          <select className={`${inp} block`} value={l.type} onChange={(e) => set({ type: e.target.value as Lesson['type'], quiz: e.target.value === 'quiz' ? { passScore: 70, questions: [{ q: '', options: ['', ''], correctIndex: 0 }] } : null })}>
            <option value="text">Text</option><option value="video">Video</option><option value="file">File</option><option value="quiz">Quiz</option>
          </select>
        </label>
        <label className="text-[12px]">Opens
          <select className={`${inp} block`} value={l.dripMode} onChange={(e) => set({ dripMode: e.target.value as Lesson['dripMode'] })}>
            <option value="none">Immediately</option><option value="days">N days after joining</option><option value="date">On a date</option>
          </select>
        </label>
        {l.dripMode === 'days' && <input aria-label="Days after joining" type="number" min={0} max={3650} className={`${inp} w-24`} value={l.unlockAfterDays ?? 0} onChange={(e) => set({ unlockAfterDays: Number(e.target.value) })} />}
        {l.dripMode === 'date' && <input aria-label="Unlock date" type="date" className={inp} value={dateInput(l.unlockAt)} onChange={(e) => set({ unlockAt: e.target.value })} />}
        <button type="button" className={`${btn} text-error`} onClick={onRemove}>Remove</button>
      </div>
      {l.type === 'text' && <textarea aria-label="Lesson text" className="rounded-lg border border-bone p-2 text-[13px] min-h-24" maxLength={50000} value={l.text ?? ''} onChange={(e) => set({ text: e.target.value })} />}
      {(l.type === 'video' || l.type === 'file') && (
        <div>
          <p className="text-[12px] mb-1">{(l.type === 'video' ? l.videoPublicId : l.filePublicId) ? `Uploaded: ${l.fileName ?? 'file'}` : 'Upload the file'}</p>
          <FileUpload value={null} label={l.type === 'video' ? 'Upload video' : 'Upload file'} onChange={(u: any) => u && set(l.type === 'video' ? { videoPublicId: u.publicId, fileName: u.fileName } : { filePublicId: u.publicId, fileName: u.fileName })} />
        </div>
      )}
      {l.type === 'quiz' && (
        <div className="flex flex-col gap-2">
          <label className="text-[12px]">Pass score %<input type="number" min={0} max={100} className={`${inp} w-24 ms-2`} value={q.passScore} onChange={(e) => set({ quiz: { ...q, passScore: Number(e.target.value) } })} /></label>
          {q.questions.map((qq, i) => (
            <div key={i} className="flex flex-col gap-1 rounded-lg bg-black/5 p-2">
              <input aria-label="Question" placeholder="Question" className={inp} value={qq.q} onChange={(e) => set({ quiz: { ...q, questions: q.questions.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) } })} />
              <textarea aria-label="Options, one per line" placeholder="Options, one per line" className="rounded-lg border border-bone p-2 text-[13px]" value={qq.options.join('\n')} onChange={(e) => set({ quiz: { ...q, questions: q.questions.map((x, j) => (j === i ? { ...x, options: e.target.value.split('\n') } : x)) } })} />
              <label className="text-[12px]">Correct option number<input type="number" min={1} max={6} className={`${inp} w-20 ms-2`} value={qq.correctIndex + 1} onChange={(e) => set({ quiz: { ...q, questions: q.questions.map((x, j) => (j === i ? { ...x, correctIndex: Number(e.target.value) - 1 } : x)) } })} /></label>
            </div>
          ))}
          <button type="button" className={`${btn} self-start`} onClick={() => set({ quiz: { ...q, questions: [...q.questions, { q: '', options: ['', ''], correctIndex: 0 }] } })}>Add question</button>
        </div>
      )}
    </div>
  );
}

export function CoursesTab({ storeId }: { storeId: string }) {
  const toast = useToast();
  const base = `/api/courses/store/${storeId}`;
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    setError(null); setList(null);
    (client.get(base) as Promise<any[]>).then(setList).catch((e) => setError(errText(e)));
  }, [base]);
  useEffect(load, [load]);

  async function edit(id: string) {
    try {
      const c: any = await client.get(`${base}/${id}`);
      setForm({ ...c, productId: c.productId ?? '', modules: c.modules });
    } catch (e) { toast.error(errText(e)); }
  }
  async function save() {
    if (!form) return;
    setBusy(true);
    try {
      const body = { ...form, productId: form.productId || null };
      if (form._id) await client.patch(`${base}/${form._id}`, body); else await client.post(base, body);
      toast.success('Course saved');
      setForm(null); load();
    } catch (e) { toast.error(errText(e)); } finally { setBusy(false); }
  }
  const setMod = (mi: number, p: Partial<Module>) => form && setForm({ ...form, modules: form.modules.map((m, i) => (i === mi ? { ...m, ...p } : m)) });

  if (!form) {
    return (
      <div className="flex flex-col gap-3">
        <button className={`${btn} self-start`} onClick={() => setForm(blank())}>New course</button>
        {error && <p role="alert" className="text-[13px] text-error">{error} <button className="underline" onClick={load}>Retry</button></p>}
        {!list && !error && <p aria-busy="true" className="text-[13px] text-slate">Loading...</p>}
        {list?.length === 0 && <p className="text-[13px] text-slate">No courses yet.</p>}
        <ul className="flex flex-col gap-2">
          {list?.map((c) => (
            <li key={c._id} className="surface-panel rounded-xl p-3 flex items-center gap-3 text-[13px]">
              <span className="flex-1"><b>{c.title}</b> · {c.status}</span>
              <button className={btn} onClick={() => void edit(c._id)}>Edit</button>
            </li>
          ))}
        </ul>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-3">
      <div className="surface-panel rounded-xl p-3 grid md:grid-cols-2 gap-2">
        <label className="text-[12px]">Title<input className={`${inp} w-full`} maxLength={120} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></label>
        <label className="text-[12px]">Status
          <select className={`${inp} w-full`} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CourseForm['status'] })}><option value="draft">Draft</option><option value="published">Published</option></select>
        </label>
        <label className="text-[12px] md:col-span-2">Description<textarea className="w-full rounded-lg border border-bone p-2 text-[13px]" maxLength={2000} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
        <label className="text-[12px] md:col-span-2">Sold by product ID (optional: buyers of this digital product get the course)<input className={`${inp} w-full`} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })} /></label>
      </div>
      {form.modules.map((m, mi) => (
        <section key={mi} className="surface-panel rounded-xl p-3 flex flex-col gap-2">
          <div className="flex gap-2">
            <input aria-label="Module title" className={`${inp} flex-1`} value={m.title} maxLength={120} onChange={(e) => setMod(mi, { title: e.target.value })} />
            <button className={`${btn} text-error`} onClick={() => setForm({ ...form, modules: form.modules.filter((_, i) => i !== mi) })}>Remove module</button>
          </div>
          {m.lessons.map((l, li) => <LessonEditor key={l.id ?? li} l={l} onChange={(nl) => setMod(mi, { lessons: m.lessons.map((x, i) => (i === li ? nl : x)) })} onRemove={() => setMod(mi, { lessons: m.lessons.filter((_, i) => i !== li) })} />)}
          <button className={`${btn} self-start`} onClick={() => setMod(mi, { lessons: [...m.lessons, newLesson()] })}>Add lesson</button>
        </section>
      ))}
      <div className="flex gap-2">
        <button className={btn} onClick={() => setForm({ ...form, modules: [...form.modules, { title: `Module ${form.modules.length + 1}`, lessons: [] }] })}>Add module</button>
        <button className={`${btn} bg-brand-orange text-white border-brand-orange hover:bg-brand-deep-orange`} disabled={busy || !form.title.trim()} onClick={() => void save()}>Save course</button>
        <button className={btn} onClick={() => setForm(null)}>Cancel</button>
      </div>
    </div>
  );
}
