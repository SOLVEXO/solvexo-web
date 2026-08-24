import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileQuestion, Loader2, MessageSquare } from 'lucide-react';
import { SkeletonBox } from '@/components/comman/ui';
import {
  apiGetPublicBlogPost, apiListPublicBlogComments, apiSubmitPublicBlogComment,
  type BlogPostData,
} from '@/api/services/storeBlog';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { ContentBlocks } from '@/features/storefront/sections/ContentBlocks';

const inp = 'w-full px-3 py-2 text-[13px] border border-bone rounded-lg outline-none bg-white';

function CommentsSection({ storeId, postId, cfg }: { storeId: string; postId: string; cfg: { textColor: string; primaryColor: string } }) {
  const [comments, setComments] = useState<{ authorName: string; body: string; createdAt: string }[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState('');

  useEffect(() => {
    apiListPublicBlogComments(storeId, postId).then(res => setComments(res.data)).finally(() => setLoadingComments(false));
  }, [storeId, postId]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !body.trim()) return;
    setSubmitting(true);
    setSubmitMsg('');
    try {
      await apiSubmitPublicBlogComment(storeId, postId, { authorName: name.trim(), authorEmail: email.trim(), body: body.trim() });
      setSubmitMsg('Thanks — your comment will appear once approved.');
      setName(''); setEmail(''); setBody('');
    } catch (err) {
      setSubmitMsg(err instanceof Error ? err.message : 'Failed to submit comment.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-10 pt-8 border-t border-bone">
      <p className="text-[16px] font-bold flex items-center gap-2 mb-4" style={{ color: cfg.textColor }}>
        <MessageSquare size={16} /> Comments {comments.length > 0 ? `(${comments.length})` : ''}
      </p>

      {loadingComments ? (
        <p className="text-[12.5px] text-slate">Loading comments…</p>
      ) : comments.length === 0 ? (
        <p className="text-[12.5px] text-slate mb-5">No comments yet — be the first to share your thoughts.</p>
      ) : (
        <div className="flex flex-col gap-3 mb-6">
          {comments.map((c, i) => (
            <div key={i} className="bg-cream/60 rounded-lg p-3">
              <p className="text-[12.5px] font-semibold" style={{ color: cfg.textColor }}>{c.authorName} <span className="text-slate font-normal">· {new Date(c.createdAt).toLocaleDateString()}</span></p>
              <p className="text-[13px] mt-1 whitespace-pre-wrap" style={{ color: cfg.textColor }}>{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 max-w-[480px]">
        <div className="grid grid-cols-2 gap-2">
          <input className={inp} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <input className={inp} placeholder="Your email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <textarea className={`${inp} resize-y min-h-[80px]`} placeholder="Write a comment…" value={body} onChange={e => setBody(e.target.value)} />
        {submitMsg && <p className="text-[12px] text-slate">{submitMsg}</p>}
        <button
          type="button" onClick={handleSubmit} disabled={submitting}
          className="self-start px-4 py-2 rounded-lg text-[12.5px] font-bold text-white border-none cursor-pointer flex items-center gap-1.5"
          style={{ background: cfg.primaryColor }}
        >
          {submitting && <Loader2 size={13} className="animate-spin" />} Post Comment
        </button>
      </div>
    </div>
  );
}

export function StorefrontBlogPost() {
  const { postSlug } = useParams<{ postSlug: string }>();
  const { store, cfg } = useStorefront();
  const [post, setPost] = useState<(BlogPostData & { commentsEnabled: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!postSlug) return;
    setLoading(true);
    setNotFound(false);
    apiGetPublicBlogPost(store.storeId, postSlug)
      .then(res => setPost(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [store.storeId, postSlug]);

  useEffect(() => {
    document.title = post ? `${post.title} — ${store.name}` : store.name;
    return () => { document.title = 'Solvexo'; };
  }, [post, store.name]);

  if (loading) {
    return (
      <div className="px-4 sm:px-6 lg:px-10 py-10 max-w-[720px] mx-auto flex flex-col gap-4">
        <SkeletonBox width="60%" height={30} rounded="6px" />
        <SkeletonBox height={300} rounded="10px" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-16">
        <FileQuestion size={40} className="text-bone" />
        <p className="text-[14px] text-slate">This post doesn't exist.</p>
      </div>
    );
  }

  return (
    <article className="px-4 sm:px-6 lg:px-10 py-10">
      <div className="max-w-[720px] mx-auto flex flex-col gap-4">
        {post.publishedAt && <p className="text-[12px] text-slate">{new Date(post.publishedAt).toLocaleDateString()}</p>}
        <h1 className="text-[28px] font-bold" style={{ color: cfg.textColor }}>{post.title}</h1>
        {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-full rounded-xl object-cover max-h-[420px]" />}
        <ContentBlocks blocks={post.content} />

        {post.commentsEnabled && <CommentsSection storeId={store.storeId} postId={post._id} cfg={cfg} />}
      </div>
    </article>
  );
}
