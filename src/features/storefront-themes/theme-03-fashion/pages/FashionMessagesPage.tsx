import { Link } from 'react-router-dom';
import { ts } from '@/utils/tStatic';
import { MessageCircle } from 'lucide-react';
import { TokenStorage } from '@/api/services/auth';
import { apiStartConversation } from '@/api/services/messaging';
import { useRequireRealAccount } from '@/hooks/auth/useRequireRealAccount';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { useStorefrontSeo } from '../../core/hooks/useStorefrontSeo';
import { fashionTheme as t } from '../theme.config';
import { AccountLayout } from '../ui/AccountLayout';
import { EmptyState, ErrorState, SkeletonBlock } from '../ui/primitives';
import { ChatPanel } from './community/ChatPanel';
import { useLoad } from '../../core/pageHooks';

/** Opens (or resumes) the buyer's conversation with this store, then shows the live chat. */
function StoreChat() {
  const { store } = useStorefront();
  const { data, loading, error, retry } = useLoad(() => apiStartConversation({ storeId: store.storeId }), [store.storeId]);
  if (loading) return <div role="status" aria-label={ts('pg.opening_chat', 'Opening chat')}><SkeletonBlock h={520} /></div>;
  if (error || !data) return <ErrorState message={ts('pg.we_couldn_t_open_your_chat_with_the_stor', 'We couldn\'t open your chat with the store.')} onRetry={retry} />;
  return <ChatPanel key={data._id} conversation={data} storeId={store.storeId} storeName={store.name} storeLogo={store.logo} />;
}

/** `/messages` - realtime chat between the signed-in buyer and this store (account page, not indexed). */
export function FashionMessagesPage() {
  const guest = useRequireRealAccount();
  const { store } = useStorefront();
  useStorefrontSeo({ title: 'Messages', noindex: true });
  const signedIn = TokenStorage.isLoggedIn();
  return (
    <AccountLayout title={ts('gift.message', 'Message')} accent={store.name} subtitle="Questions about a product or an order? Chat with us directly.">
      {guest ? null : !signedIn ? (
        <EmptyState icon={<MessageCircle size={24} aria-hidden />} title={ts('pg.sign_in_to_chat_with_us', 'Sign in to chat with us')} text={ts('pg.your_conversation_is_saved_to_your_accou', 'Your conversation is saved to your account so you can pick it up on any device.')}
          action={<Link to="/login?redirect=%2Fmessages" className="fx-pill" style={{ background: t.colors.accent, color: t.colors.accentInk, borderRadius: t.buttonRadiusPx }}>{ts('auth.signInLink', 'Sign in')}</Link>} />
      ) : <StoreChat />}
    </AccountLayout>
  );
}
