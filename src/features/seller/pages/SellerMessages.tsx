import { useState } from 'react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { SellerPageHeader } from '@/components/layouts/SellerLayout';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';

interface Conversation {
  id: number;
  name: string;
  time: string;
  subject: string;
  preview: string;
  unread: boolean;
}

const CONVERSATIONS: Conversation[] = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    time: '2 min ago',
    subject: 'Re: Grade 5 Math Bundle',
    preview: 'Hi! Can I use this for multiple classrooms...',
    unread: true,
  },
  {
    id: 2,
    name: 'David Reynolds',
    time: '1h ago',
    subject: 'Re: Fractions Mastery Kit',
    preview: 'Thank you so much! The resources are...',
    unread: false,
  },
  {
    id: 3,
    name: 'Lena Kowalski',
    time: '3h ago',
    subject: 'Re: Ceramic Mug Set',
    preview: 'Is there an editable version available?',
    unread: true,
  },
  {
    id: 4,
    name: 'Tom Barnes',
    time: 'Yesterday',
    subject: 'Re: Ceramic Mug Set',
    preview: 'When will the order ship?',
    unread: false,
  },
];

export function SellerMessages() {
  usePageTitle('Messages');
  const [activeId, setActiveId] = useState<number>(1);
  const [reply, setReply] = useState('');

  const activeConvo = CONVERSATIONS.find(c => c.id === activeId)!;

  return (
    <>
      <SellerPageHeader
        title="Messages"
        subtitle="Respond to buyer questions and support requests."
        actions={
          <>
            <Badge color="red">4 Unread</Badge>
          </>
        }
      />

      {/* 2-col layout */}
      <div className="flex flex-1 h-[calc(100vh-65px)] overflow-hidden">

        {/* LEFT SIDEBAR */}
        <div className="w-[340px] flex-shrink-0 border-r border-bone flex flex-col bg-white">

          {/* Search */}
          <div className="p-3 border-b border-bone">
            <input
              type="text"
              placeholder="Search..."
              className="w-full text-[13px] text-charcoal placeholder:text-slate px-3 py-2 rounded-lg border border-bone bg-white outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors duration-150"
            />
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {CONVERSATIONS.map(convo => (
              <div
                key={convo.id}
                onClick={() => setActiveId(convo.id)}
                className="relative p-4 border-b border-bone cursor-pointer hover:bg-cream transition-colors duration-150"
              >
                {/* Active indicator */}
                {convo.id === activeId && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-brand-orange rounded-r-full" />
                )}

                <div className="flex items-start gap-3">
                  <Avatar name={convo.name} size={38} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[13px] font-bold text-carbon truncate">{convo.name}</span>
                      <span className="text-[11px] text-slate flex-shrink-0 ml-2">{convo.time}</span>
                    </div>
                    <p className="text-[12px] text-slate mb-0.5">{convo.subject}</p>
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] text-charcoal truncate">{convo.preview}</p>
                      {convo.unread && (
                        <div className="w-2 h-2 rounded-full bg-brand-orange flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col bg-cream min-w-0">

          {/* Top bar */}
          <div className="bg-white border-b border-bone px-5 py-3 flex items-center gap-3 flex-shrink-0">
            <Avatar name={activeConvo.name} size={40} />
            <div className="flex-1 min-w-0">
              <p className="text-[14px] font-bold text-carbon leading-tight">{activeConvo.name}</p>
              <p className="text-[12px] text-slate">{activeConvo.subject}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">Order History</Button>
              <Button variant="ghost" size="sm">Block</Button>
            </div>
          </div>

          {/* Scrollable message area */}
          <div className="flex-1 overflow-y-auto flex flex-col">

            {/* AI Suggested Reply */}
            <div className="bg-brand-pale-orange p-4 rounded-xl mx-5 mt-4 mb-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-brand-deep-orange mb-1.5">✨ AI Suggested Reply</p>
                  <p className="text-[13px] text-charcoal leading-relaxed">
                    Hi Sarah! Yes, the Google Slides version is fully compatible with Google Classroom. You can assign individual slides as assignments. For the school license, you can upgrade directly from your Orders page. Let me know if you need any help!
                  </p>
                </div>
                <button
                  onClick={() => setReply("Hi Sarah! Yes, the Google Slides version is fully compatible with Google Classroom. You can assign individual slides as assignments. For the school license, you can upgrade directly from your Orders page. Let me know if you need any help!")}
                  className="text-[13px] font-medium text-brand-orange cursor-pointer whitespace-nowrap hover:text-brand-deep-orange transition-colors flex-shrink-0"
                >
                  Use Reply
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="px-5 flex flex-col gap-3 pb-4">

              {/* Buyer message (left) */}
              <div className="flex flex-col items-start max-w-lg">
                <div className="bg-brand-pale-orange rounded-xl p-4">
                  <p className="text-[13px] text-charcoal leading-relaxed">
                    Hi! I just purchased the Grade 5 Math Bundle. Can I use this for multiple classrooms at my school?
                  </p>
                </div>
                <span className="text-[11px] text-slate mt-1 ml-1">2:14 PM</span>
              </div>

              {/* Seller message (right) */}
              <div className="flex flex-col items-end ml-auto max-w-lg">
                <div className="bg-carbon rounded-xl p-4">
                  <p className="text-[13px] text-white leading-relaxed">
                    Hi Sarah! Great question. The standard license covers a single classroom. For multiple classrooms, I'd recommend the School License which gives access for up to 30 teachers — it's $149. Would that work for you?
                  </p>
                </div>
                <span className="text-[11px] text-[#8C8A82] mt-1 mr-1">2:16 PM</span>
              </div>
            </div>
          </div>

          {/* Bottom input bar */}
          <div className="border-t border-bone p-4 flex gap-3 bg-white flex-shrink-0">
            <textarea
              placeholder="Type your reply..."
              rows={3}
              value={reply}
              onChange={e => setReply(e.target.value)}
              className="flex-1 border border-bone rounded-xl p-3 text-[13px] text-charcoal placeholder:text-slate resize-none outline-none focus:border-brand-orange focus:ring-2 focus:ring-brand-orange/10 transition-colors duration-150 bg-white"
            />
            <div className="flex flex-col justify-end">
              <Button variant="primary" size="sm">Send</Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
