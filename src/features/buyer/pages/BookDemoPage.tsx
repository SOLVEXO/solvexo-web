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
import { useSellEntry } from '@/hooks/auth/useSellEntry';

const BUSINESS_TYPES = ['Clothing & fashion', 'Beauty & cosmetics', 'Grocery & food', 'Electronics', 'Home & furniture', 'Books & education', 'Handmade & crafts', 'Services', 'Other'];
const TIMES = ['Morning (9am–12pm)', 'Afternoon (12pm–4pm)', 'Evening (4pm–8pm)', 'Any time'];

const POINTS = [
  { Icon: CalendarCheck, title: '30-minute call', text: 'On WhatsApp, phone or Zoom, in English or Urdu.' },
  { Icon: Store, title: 'Your store, live', text: 'We set up a sample of your store with your own products.' },
  { Icon: Rocket, title: 'Plan and pricing', text: 'Payments, delivery and the right plan for your size.' },
];

/** solvexo.store/book-demo — the form becomes a lead in Super Admin → Sales Ops. */
export function BookDemoPage() {
  usePageTitle('Book a demo');
  const navigate = useNavigate();
  const sellEntry = useSellEntry();
  const { search } = useLocation();
  const [f, setF] = useState({ name: '', phone: '', email: '', businessName: '', city: '', businessType: '', preferredTime: TIMES[3], message: '', website: '' });
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState('');
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(p => ({ ...p, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim() || !f.phone.trim()) { setError('Please add your name and a phone or WhatsApp number.'); return; }
    if (f.phone.replace(/\D/g, '').length < 10) { setError('Please check the phone number. Include the full number, e.g. 0300 1234567.'); return; }
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) { setError('Please check the email address.'); return; }
    setError(''); setSending(true);
    try {
      const opt = (v: string) => v.trim() || undefined;
      const r = await apiDemoRequest({
        name: f.name.trim(), phone: f.phone.trim(), email: opt(f.email), businessName: opt(f.businessName), city: opt(f.city),
        businessType: opt(f.businessType), message: opt(f.message), preferredTime: f.preferredTime, website: opt(f.website),
        page: window.location.pathname, ...campaignTags(search),
      });
      setDone(r.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send your request. Please try again.');
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="bg-cream min-h-full">
      <div className="px-4 md:px-8 lg:px-12 pt-14 md:pt-20 pb-10 max-w-[760px] mx-auto">
        <SectionHeading title="Book a free demo" subtitle="See how Solvexo can run your online store, payments and delivery. A real person will call you, no pressure to buy." align="center" size="lg" />
      </div>

      <RevealStagger className="max-w-[880px] mx-auto px-4 md:px-8 lg:px-12 pb-10 grid grid-cols-1 sm:grid-cols-3 gap-3" step={0.06} y={14}>
        {POINTS.map(({ Icon, title, text }) => (
          <PremiumCard key={title} className="p-5 flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-brand-pale-orange flex items-center justify-center shrink-0"><Icon size={16} className="text-brand-orange" /></div>
            <div className="min-w-0"><p className="text-[13px] font-semibold text-carbon">{title}</p><p className="text-[12px] text-slate mt-0.5">{text}</p></div>
          </PremiumCard>
        ))}
      </RevealStagger>

      <div className="bg-white border-t border-b border-bone">
        <div className="max-w-[600px] mx-auto px-4 md:px-8 py-12">
          {done ? (
            <div className="flex flex-col items-center text-center gap-3 py-6" role="status">
              <motion.div className="w-12 h-12 rounded-full bg-success-bg flex items-center justify-center" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}>
                <Check size={22} className="text-success" />
              </motion.div>
              <p className="text-[16px] font-bold text-carbon">Request received</p>
              <p className="text-[13px] text-slate max-w-[380px]">{done}</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={() => navigate('/pricing')}>See plans and pricing</Button>
            </div>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Your name *" autoComplete="name" value={f.name} onChange={set('name')} />
                <Input label="Phone / WhatsApp *" type="tel" autoComplete="tel" inputMode="tel" placeholder="0300 1234567" value={f.phone} onChange={set('phone')} />
                <Input label="Email" type="email" autoComplete="email" placeholder="you@example.com" value={f.email} onChange={set('email')} />
                <Input label="Business name" autoComplete="organization" value={f.businessName} onChange={set('businessName')} />
                <Input label="City" autoComplete="address-level2" placeholder="Lahore, Karachi…" value={f.city} onChange={set('city')} />
                <Select label="What do you sell?" value={f.businessType} onChange={set('businessType')}>
                  <option value="">Choose one</option>
                  {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <Select label="Best time to call" value={f.preferredTime} onChange={set('preferredTime')}>
                {TIMES.map(t => <option key={t} value={t}>{t}</option>)}
              </Select>
              <Textarea label="Anything we should know? (optional)" rows={3} placeholder="Where do you sell today? Instagram, a shop, Daraz…" value={f.message} onChange={set('message')} />
              {/* Honeypot: hidden from people (and screen readers), bots fill it in. */}
              <div aria-hidden="true" className="absolute -left-[9999px] w-px h-px overflow-hidden">
                <label>Website<input tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
              </div>
              {error && <p role="alert" className="text-[12px] text-error">{error}</p>}
              <Button type="submit" variant="primary" fullWidth loading={sending} icon={!sending && <CalendarCheck size={14} />}>
                {sending ? 'Sending…' : 'Book my demo'}
              </Button>
              <p className="text-[11.5px] text-slate text-center flex items-center justify-center gap-1.5">
                <MessageCircle size={12} /> We reply within one working day. Prefer to start now? <button type="button" onClick={sellEntry.go} className="text-brand-orange font-semibold bg-transparent border-0 p-0 cursor-pointer hover:underline">Start free</button>
              </p>
            </form>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
