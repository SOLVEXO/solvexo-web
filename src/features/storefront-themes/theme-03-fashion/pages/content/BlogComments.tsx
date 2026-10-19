import { useState, type FormEvent } from 'react';
import { ts } from '@/utils/tStatic';
import { MessageSquare } from 'lucide-react';
import { apiListPublicBlogComments, apiSubmitPublicBlogComment } from '@/api/services/storeBlog';
import { fashionTheme as t } from '../../theme.config';
import { Card, ErrorState, Field, Notice, PillButton, SkeletonBlock, TextArea, TextInput } from '../../ui/primitives';
import { timeAgo } from '../../../core/community/communityFormat';
import { useLoad } from '../../../core/pageHooks';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Approved comments for a post plus the "leave a comment" form (comments are moderated by the seller). */
export function BlogComments({ storeId, postId }: { storeId: string; postId: string }) {
  const { data, loading, error, retry } = useLoad(() => apiListPublicBlogComments(storeId, postId).then(r => r.data ?? []), [storeId, postId]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);

  const errors = {
    name: name.trim() ? null : 'Please enter your name',
    email: EMAIL_RE.test(email.trim()) ? null : 'Please enter a valid email',
    body: body.trim() ? null : 'Please write a comment',
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (errors.name || errors.email || errors.body) return;
    setBusy(true);
    setResult(null);
    try {
      await apiSubmitPublicBlogComment(storeId, postId, { authorName: name.trim(), authorEmail: email.trim(), body: body.trim() });
      setResult({ tone: 'success', text: 'Thanks. Your comment will appear once it has been approved.' });
      setName(''); setEmail(''); setBody(''); setTouched(false);
    } catch (err) {
      setResult({ tone: 'error', text: err instanceof Error && err.message ? err.message : 'We could not send your comment. Please try again.' });
    } finally { setBusy(false); }
  };

  return (
    <section aria-labelledby="comments-title" className="mt-14 pt-10" style={{ borderTop: `1px solid ${t.colors.border}` }}>
      <h2 id="comments-title" className="m-0 mb-6 flex items-center gap-2.5 text-2xl font-medium tracking-tight"><MessageSquare size={22} aria-hidden />Comments{data && data.length > 0 ? ` (${data.length})` : ''}</h2>

      {loading ? <div role="status" aria-label={ts('pg.loading_comments', 'Loading comments')}><SkeletonBlock h={72} rows={2} /></div>
        : error ? <ErrorState message={ts('pg.we_couldn_t_load_the_comments', 'We couldn\'t load the comments.')} onRetry={retry} />
        : data && data.length > 0 ? (
          <ul className="m-0 mb-8 flex list-none flex-col gap-3 p-0">
            {data.map((c, i) => (
              <li key={i} className="p-4 sm:p-5" style={{ borderRadius: 20, background: t.colors.bgAlt }}>
                <p className="m-0 text-sm font-semibold">{c.authorName} <span className="font-normal" style={{ color: t.colors.inkMuted }}>· {timeAgo(c.createdAt)}</span></p>
                <p className="m-0 mt-1.5 whitespace-pre-wrap break-words text-[15px] leading-relaxed">{c.body}</p>
              </li>
            ))}
          </ul>
        ) : <p className="m-0 mb-8 text-[15px]" style={{ color: t.colors.inkMuted }}>{ts('pg.no_comments_yet_be_the_first_to_share_yo', 'No comments yet. Be the first to share your thoughts.')}</p>}

      <Card tone="soft">
        <form onSubmit={e => void submit(e)} noValidate className="flex flex-col gap-4">
          <h3 className="m-0 text-lg font-semibold">{ts('pg.leave_a_comment', 'Leave a comment')}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={touched ? errors.name : null}>{p => <TextInput {...p} value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={80} invalid={p['aria-invalid']} />}</Field>
            <Field label={ts('auth.email', 'Email')} required hint={ts('pg.never_shown_publicly', 'Never shown publicly')} error={touched ? errors.email : null}>{p => <TextInput {...p} type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" invalid={p['aria-invalid']} />}</Field>
          </div>
          <Field label={ts('pg.comment', 'Comment')} required error={touched ? errors.body : null}>{p => <TextArea {...p} rows={4} value={body} onChange={e => setBody(e.target.value)} maxLength={2000} invalid={p['aria-invalid']} />}</Field>
          {result && <Notice tone={result.tone}>{result.text}</Notice>}
          <div><PillButton type="submit" loading={busy}>{ts('pg.post_comment', 'Post comment')}</PillButton></div>
        </form>
      </Card>
    </section>
  );
}
