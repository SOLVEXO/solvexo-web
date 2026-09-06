import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useGetProfile } from '@/hooks/auth/useGetProfile';
import { useMessages } from '@/hooks/messaging/useMessages';
import { apiStartConversation, apiUploadAttachment, type Conversation } from '@/api/services/messaging';
import { ChatWindow } from '@/components/comman/messaging';
import { novaTheme as t } from '../theme.config';

/** Theme 02's own "Message Seller" page — ported functionally 1:1 from
 *  `AtelierMessagesPage`. Reuses the real, shared `ChatWindow` widget as-is
 *  (see that file's own doc comment for why). */
export function NovaMessagesPage() {
  useStorefrontSeo({ title: 'Messages', noindex: true });
  const { store } = useStorefront();
  const { profile } = useGetProfile();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [starting, setStarting] = useState(true);
  const [startError, setStartError] = useState('');

  useEffect(() => {
    let cancelled = false;
    apiStartConversation({ storeId: store.storeId })
      .then(res => { if (!cancelled) setConversation(res); })
      .catch(err => { if (!cancelled) setStartError(err instanceof Error ? err.message : 'Failed to start conversation.'); })
      .finally(() => { if (!cancelled) setStarting(false); });
    return () => { cancelled = true; };
  }, [store.storeId]);

  const conversationId = conversation?._id ?? null;
  const {
    messages, loading: msgLoading, loadingMore, sending, send, retry, edit, remove, hasMore, loadMore,
    otherOnline, otherTyping, sendTyping, error: msgError,
  } = useMessages(conversationId);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    if (!conversationId) return;
    setUploading(true);
    try {
      const attachment = await apiUploadAttachment(conversationId, file);
      const kind = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'voice' : file.type === 'application/pdf' ? 'pdf' : 'document';
      await send({ type: kind, attachments: [attachment] });
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="mx-auto" style={{ maxWidth: '820px', padding: `48px ${t.layout.containerPadX}` }}>
      <h1 style={{ fontFamily: t.fonts.display, fontSize: '24px', fontWeight: 700, color: t.colors.ink, marginBottom: '20px' }}>
        Message {store.name}
      </h1>

      {starting ? (
        <div className="flex items-center justify-center" style={{ height: '400px', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md }}>
          <Loader2 size={20} className="animate-spin" style={{ color: t.colors.inkMuted }} />
        </div>
      ) : startError ? (
        <p style={{ fontFamily: t.fonts.body, fontSize: '13px', color: t.colors.danger }}>{startError}</p>
      ) : (
        <div className="flex" style={{ height: '600px', border: `1.5px solid ${t.colors.border}`, borderRadius: t.radius.md, overflow: 'hidden' }}>
          <ChatWindow
            open
            headerName={store.name}
            headerImage={store.logo}
            menuItems={[]}
            messages={messages}
            msgLoading={msgLoading}
            loadingMore={loadingMore}
            currentUserId={profile?._id}
            otherPartyId={conversation?.sellerId ?? ''}
            hasMore={hasMore}
            onLoadMore={loadMore}
            sending={sending}
            uploading={uploading}
            onSend={payload => void send(payload)}
            onUpload={file => void handleUpload(file)}
            onEditMessage={(id, text) => void edit(id, text)}
            onDeleteMessage={id => void remove(id)}
            onRetry={(m, payload) => m._tempId && retry(m._tempId, payload)}
            otherOnline={otherOnline}
            otherTyping={otherTyping}
            onTyping={sendTyping}
            conversationId={conversationId}
            storeId={store.storeId}
            error={msgError}
          />
        </div>
      )}
    </main>
  );
}
