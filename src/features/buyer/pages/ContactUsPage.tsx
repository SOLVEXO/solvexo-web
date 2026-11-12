import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, LifeBuoy, Clock, Send, Check, ArrowRight } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button, Input, Textarea, Select, Footer } from '@/components/comman/ui';
import { apiSubmitContact } from '@/api/services/contact';
import { RevealStagger } from '@/components/comman/motion/Reveal';
import { MagneticButton } from '@/components/comman/motion/MagneticButton';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { PremiumCard } from '@/components/comman/motion/PremiumCard';
import { motion } from 'motion/react';
import { SALES_EMAIL } from '@/utils/contact';
import { useSiteText } from '@/i18n/site/useSiteText';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { CONTACT_TOPICS, CONTACT_US_TEXT, type ContactTopic } from './ContactUsPage.text';

export function ContactUsPage() {
  const t = useSiteText(CONTACT_US_TEXT);
  const { pageLang } = useSiteLang();
  usePageTitle(t.pageTitle);
  const navigate = useNavigate();

  const contactCards = [
    { Icon: Mail,     label: t.emailUs,      value: SALES_EMAIL },
    { Icon: LifeBuoy, label: t.helpCenter,   value: t.helpCenterValue },
    { Icon: Clock,    label: t.responseTime, value: t.responseTimeValue },
  ];

  const [name, setName]       = useState('');
  const [email, setEmail]     = useState('');
  const [topic, setTopic]     = useState<ContactTopic>(CONTACT_TOPICS[0]);
  const [message, setMessage] = useState('');
  const [error, setError]     = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent]       = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t.missingFields);
      return;
    }
    setError('');
    setSending(true);
    try {
      await apiSubmitContact({ name, email, topic, message });
      setSent(true);
    } catch (err) {
      // Server messages are English: the Arabic page shows its own text instead.
      setError(pageLang === 'en' && err instanceof Error ? err.message : t.sendFailed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-cream min-h-full">
      {/* ── Hero ── */}
      <div className="px-4 md:px-8 lg:px-12 pt-14 md:pt-20 pb-10 max-w-[720px] mx-auto">
        <SectionHeading as="h1" title={t.title} subtitle={t.subtitle} align="center" size="lg" />
      </div>

      {/* ── Contact info cards ── */}
      <RevealStagger className="max-w-[840px] mx-auto px-4 md:px-8 lg:px-12 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-3" step={0.06} y={14}>
        {contactCards.map(({ Icon, label, value }) => (
          <PremiumCard key={label} className="p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0">
              <Icon size={16} className="text-brand-orange" />
            </div>
            <div className="min-w-0">
              <p className="text-[12px] font-semibold text-carbon">{label}</p>
              {value === SALES_EMAIL
                ? <a href={`mailto:${SALES_EMAIL}`} className="block text-[12px] text-brand-orange hover:underline mt-0.5 truncate">{value}</a>
                : <p className="text-[12px] text-slate mt-0.5 truncate">{value}</p>}
            </div>
          </PremiumCard>
        ))}
      </RevealStagger>

      {/* ── Contact form ── */}
      <div className="bg-white border-t border-b border-bone">
        <div className="max-w-[560px] mx-auto px-4 md:px-8 py-12">
          {sent ? (
            <div className="flex flex-col items-center text-center gap-3 py-6">
              <motion.div
                className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <Check size={22} className="text-success" />
              </motion.div>
              <p className="text-[16px] font-bold text-carbon">{t.sentTitle}</p>
              <p className="text-[13px] text-slate max-w-[360px]">
                {t.sentBody(email)}
              </p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/faq')}>
                {t.browseHelpCenter}
              </Button>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label={t.nameLabel} placeholder={t.namePlaceholder} value={name} onChange={e => setName(e.target.value)} />
                  <Input label={t.emailLabel} type="email" dir="ltr" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <Select label={t.topicLabel} value={topic} onChange={e => setTopic(e.target.value as ContactTopic)}>
                  {CONTACT_TOPICS.map((value, i) => <option key={value} value={value}>{t.topicLabels[i]}</option>)}
                </Select>
                <Textarea
                  label={t.messageLabel} rows={5}
                  placeholder={t.messagePlaceholder}
                  value={message} onChange={e => setMessage(e.target.value)}
                />
                {error && (
                  <motion.p className="text-[12px] text-error" initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                    {error}
                  </motion.p>
                )}
                <MagneticButton className="block">
                  <Button type="submit" variant="primary" fullWidth loading={sending} icon={!sending && <Send size={14} />}>
                    {sending ? t.sending : t.send}
                  </Button>
                </MagneticButton>
              </form>

              {/* ── FAQ cross-link — inside the same white block, right below
                  the form, so it reads as one connected section instead of a
                  card floating alone in open space. */}
              <PremiumCard onClick={() => navigate('/book-demo')} className="p-5 flex items-center justify-between gap-3 mt-8">
                <div>
                  <p className="text-[13px] font-semibold text-carbon">{t.demoTitle}</p>
                  <p className="text-[12px] text-slate mt-0.5">{t.demoBody}</p>
                </div>
                <ArrowRight size={16} className="text-slate shrink-0 rtl:-scale-x-100" />
              </PremiumCard>
              <PremiumCard onClick={() => navigate('/faq')} className="p-5 flex items-center justify-between gap-3 mt-3">
                <div>
                  <p className="text-[13px] font-semibold text-carbon">{t.faqTitle}</p>
                  <p className="text-[12px] text-slate mt-0.5">{t.faqBody}</p>
                </div>
                <ArrowRight size={16} className="text-slate shrink-0 rtl:-scale-x-100" />
              </PremiumCard>
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
