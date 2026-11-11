import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CalendarCheck, Check, MessageCircle, Rocket, Store } from 'lucide-react';
import { motion } from 'motion/react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { Button, Footer, Input, Select, Textarea } from '@/components/comman/ui';
import { SectionHeading } from '@/components/comman/motion/SectionHeading';
import { PremiumCard } from '@/components/comman/motion/PremiumCard';
import { RevealStagger } from '@/components/comman/motion/Reveal';
import { apiDemoRequest } from '@/api/services/salesOps';
import { campaignTags } from '@/utils/campaignTags';
import { capturePartnerCode, getPartnerCode } from '@/utils/sellerAcquisitionAttribution';
import { useSellEntry } from '@/hooks/auth/useSellEntry';
import { useSiteText } from '@/i18n/site/useSiteText';
import { useSiteLang } from '@/i18n/site/siteLangContext';
import { BOOK_DEMO_TEXT, DEMO_BUSINESS_TYPES, DEMO_TIMES } from './BookDemoPage.text';

// Text lives in BookDemoPage.text.ts in the same order.
const POINT_ICONS = [CalendarCheck, Store, Rocket];

/** solvexo.store/book-demo — the form becomes a lead in Super Admin → Sales Ops. */
export function BookDemoPage() {
  const t = useSiteText(BOOK_DEMO_TEXT);
  const { pageLang } = useSiteLang();
  usePageTitle(t.pageTitle);
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  const { search } = useLocation();
  const [f, setF] = useState({ name: '', phone: '', email: '', businessName: '', city: '', businessType: '', preferredTime: DEMO_TIMES[3] as string, message: '', website: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(p => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.phone.trim()) { setError(t.missingNamePhone); return; }
    if (f.phone.replace(/\D/g, '').length < 10) { setError(t.badPhone); return; }
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { setError(t.badEmail); return; }
    setError(''); setSending(true);
    try {
      const opt = (v: string) => v.trim() || undefined;
      capturePartnerCode(search);
      const partnerCode = getPartnerCode() ?? undefined;
      const r = await apiDemoRequest({
        name: f.name.trim(), phone: f.phone.trim(), email: opt(f.email), businessName: opt(f.businessName), city: opt(f.city),
        businessType: opt(f.businessType), message: opt(f.message), preferredTime: f.preferredTime, website: opt(f.website),
        page: window.location.pathname, ...campaignTags(search), partnerCode,
      });
      setDone(t.sentMessage ?? r.message);
    } catch (err) {
      // Server messages are English: the Arabic page shows its own text instead.
      setError(pageLang === 'en' && err instanceof Error ? err.message : t.sendFailed);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-cream min-h-full">
      <div className="px-4 md:px-8 lg:px-12 pt-14 md:pt-20 pb-10 max-w-[760px] mx-auto">
        <SectionHeading as="h1" title={t.title} subtitle={t.subtitle} align="center" size="lg" />
      </div>

      <RevealStagger className="max-w-[880px] mx-auto px-4 md:px-8 lg:px-12 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-3" step={0.06} y={14}>
        {t.points.map(({ title, text }, i) => {
          const Icon = POINT_ICONS[i];
          return (
          <PremiumCard key={i} className="p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0"><Icon size={16} className="text-brand-orange" /></div>
            <div className="min-w-0"><p className="text-[13px] font-semibold text-carbon">{title}</p><p className="text-[12px] text-slate mt-0.5">{text}</p></div>
          </PremiumCard>
          );
        })}
      </RevealStagger>

      <div className="bg-white border-t border-b border-bone">
        <div className="max-w-[600px] mx-auto px-4 md:px-8 py-12">
          {done ? (
            <div className="flex flex-col items-center text-center gap-3 py-6" role="status">
              <motion.div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <Check size={22} className="text-success" />
              </motion.div>
              <p className="text-[16px] font-bold text-carbon">{t.requestReceived}</p>
              <p className="text-[13px] text-slate max-w-[380px]">{done}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/pricing')}>{t.seePlans}</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label={t.nameLabel} autoComplete="name" value={f.name} onChange={set('name')} />
                <Input label={t.phoneLabel} type="tel" dir="ltr" autoComplete="tel" inputMode="tel" placeholder={t.phonePlaceholder} value={f.phone} onChange={set('phone')} />
                <Input label={t.emailLabel} type="email" dir="ltr" autoComplete="email" placeholder="you@example.com" value={f.email} onChange={set('email')} />
                <Input label={t.businessNameLabel} autoComplete="organization" value={f.businessName} onChange={set('businessName')} />
                <Input label={t.cityLabel} autoComplete="address-level2" placeholder={t.cityPlaceholder} value={f.city} onChange={set('city')} />
                <Select label={t.businessTypeLabel} value={f.businessType} onChange={set('businessType')}>
                  <option value="">{t.chooseOne}</option>
                  {DEMO_BUSINESS_TYPES.map((value, i) => <option key={value} value={value}>{t.businessTypeLabels[i]}</option>)}
                </Select>
              </div>
              <Select label={t.timeLabel} value={f.preferredTime} onChange={set('preferredTime')}>
                {DEMO_TIMES.map((value, i) => <option key={value} value={value}>{t.timeLabels[i]}</option>)}
              </Select>
              <Textarea label={t.messageLabel} rows={3} placeholder={t.messagePlaceholder} value={f.message} onChange={set('message')} />
              {/* Honeypot: hidden from people (and screen readers), bots fill it in. */}
              <div aria-hidden="true" className="absolute -start-[9999px] w-px h-px overflow-hidden">
                <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
              </div>
              {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
              <Button type="submit" variant="primary" fullWidth loading={sending} icon={!sending && <CalendarCheck size={14} />}>
                {sending ? t.sending : t.submit}
              </Button>
              <p className="text-[11.5px] text-slate text-center flex items-center justify-center gap-1.5">
                <MessageCircle size={12} /> {t.replyNote} <button type="button" onClick={sellEntry.go} className="text-brand-orange font-semibold bg-transparent border-0 p-0 cursor-pointer hover:underline">{t.startFree}</button>
              </p>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
