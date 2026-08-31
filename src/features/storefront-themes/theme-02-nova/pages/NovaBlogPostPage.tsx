import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FileQuestion, MessageSquare } from 'lucide-react';
import {
  apiGetPublicBlogPost, apiListPublicBlogComments, apiSubmitPublicBlogComment,
  type BlogPostData,
} from '@/api/services/storeBlog';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicCollectionTemplate } from '@/api/services/collectionTemplate';
import type { Section } from '@/api/services/storefrontTypes';
import { NovaSectionRenderer } from '../sections';
import { NovaContentBlocks } from '../components/NovaContentBlocks';
import { NovaButton } from '../components/NovaButton';
import { novaInput } from '../components/novaFormStyles';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { novaTheme as t } from '../theme.config';

function CommentsSection({ storeId, postId }: { storeId: string; postId: string }) {
  const [comments, setComments] = useState<{ authorName: string; body: string; createdAt: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    apiListPublicBlogComments(storeId, postId).then(res => setComments(res.data)).finally(() => setLoading(false));
  }, [storeId, postId]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !body.trim()) return;
    setSubmitting(true); setMsg('');
    try {
      await apiSubmitPublicBlogComment(storeId, postId, { authorName: name.trim(), authorEmail: email.trim(), body: body.trim() });
      setMsg('Thanks — your comment will appear once approved.');
      setName(''); setEmail(''); setBody('');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Failed to submit comment.');
    } finally { setSubmitting(false); }
  };

  return (
    <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: `1.5px solid ${t.colors.border}` }}>
      <p className="flex items-center gap-2" style={{ fontFamily: t.fonts.display, fontSize: '17px', fontWeight: 700, color: t.colors.ink, marginBottom: '18px' }}>
        <MessageSquare size={16} /> Comments {comments.length > 0 ? `(${comments.length})` : ''}
      </p>

      {loading ? (
        <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted }}>Loading comments…</p>
      ) : comments.length === 0 ? (
        <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', color: t.colors.inkMuted, marginBottom: '20px' }}>No comments yet — be the first to share your thoughts.</p>
      ) : (
        <div className="flex flex-col gap-3" style={{ marginBottom: '24px' }}>
          {comments.map((c, i) => (
            <div key={i} style={{ background: t.colors.bgAlt, borderRadius: t.radius.sm, padding: '14px 16px' }}>
              <p style={{ fontFamily: t.fonts.body, fontSize: '12.5px', fontWeight: 700, color: t.colors.ink }}>
                {c.authorName} <span style={{ fontWeight: 400, color: t.colors.inkMuted }}>· {new Date(c.createdAt).toLocaleDateString()}</span>
              </p>
              <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.ink, marginTop: '4px', whiteSpace: 'pre-wrap' }}>{c.body}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2.5 nova-form" style={{ maxWidth: '480px' }}>
        <div className="grid grid-cols-2 gap-2.5">
          <input style={novaInput} placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
          <input style={novaInput} placeholder="Your email" type="email" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <textarea style={{ ...novaInput, resize: 'vertical', minHeight: '90px' }} placeholder="Write a comment…" value={body} onChange={e => setBody(e.target.value)} />
        {msg && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted }}>{msg}</p>}
        <NovaButton onClick={handleSubmit} loading={submitting} style={{ alignSelf: 'flex-start' }}>Post Comment</NovaButton>
      </div>
    </div>
  );
}

/** Theme 02's own Stories article page — same real shared "article" template
 *  (one per blog) as `AtelierBlogPostPage`; see that file's own doc comment
 *  for why it reuses the backend's `page` resourceType bucket. */
export function NovaBlogPostPage() {
  const { postSlug } = useParams<{ postSlug: string }>();
  const { store } = useStorefront();
  const [post, setPost] = useState<(BlogPostData & { commentsEnabled: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [templateSections, setTemplateSections] = useState<Section[]>([]);

  useEffect(() => {
    if (!postSlug) return;
    setLoading(true); setNotFound(false);
    apiGetPublicBlogPost(store.storeId, postSlug)
      .then(res => setPost(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [store.storeId, postSlug]);

  useEffect(() => {
    apiGetPublicCollectionTemplate(store.storeId, 'page', 'blog-article')
      .then(res => setTemplateSections(res.data.sections ?? []))
      .catch(() => setTemplateSections([]));
  }, [store.storeId]);

  useStorefrontSeo({
    title: post ? post.title : 'Stories',
    description: post?.excerpt || undefined,
    image: post?.coverImage || undefined,
  });

  if (loading) {
    return (
      <div className="mx-auto flex flex-col gap-4" style={{ maxWidth: '720px', padding: `48px ${t.layout.containerPadX}` }}>
        <div className="animate-pulse h-8 w-3/5" style={{ background: t.colors.bgAlt }} />
        <div className="animate-pulse" style={{ height: '320px', background: t.colors.bgAlt, borderRadius: t.radius.md }} />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: '50vh', padding: '20px' }}>
        <FileQuestion size={36} style={{ color: t.colors.inkMuted }} />
        <p style={{ fontFamily: t.fonts.body, fontSize: '13.5px', color: t.colors.inkMuted }}>This post doesn't exist.</p>
      </div>
    );
  }

  return (
    <article className="mx-auto" style={{ maxWidth: '720px', padding: `48px ${t.layout.containerPadX}` }}>
      {post.publishedAt && <p style={{ fontFamily: t.fonts.body, fontSize: '12px', color: t.colors.inkMuted, marginBottom: '8px', fontWeight: 600 }}>{new Date(post.publishedAt).toLocaleDateString()}</p>}
      <h1 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 700, color: t.colors.ink, lineHeight: 1.15, marginBottom: '20px' }}>{post.title}</h1>
      {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-full object-cover" style={{ maxHeight: '440px', marginBottom: '28px', borderRadius: t.radius.md }} />}
      <div className="flex flex-col gap-5">
        <NovaContentBlocks blocks={post.content} />
      </div>
      {post.commentsEnabled && <CommentsSection storeId={store.storeId} postId={post._id} />}
      {templateSections.length > 0 && <div style={{ marginTop: '48px' }}><NovaSectionRenderer sections={templateSections} /></div>}
    </article>
  );
}
