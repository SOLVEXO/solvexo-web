import type { CSSProperties } from 'react';

/** Real, recognisable social glyphs (lucide-react ships no brand icons in this version). Drawn on a 24px grid. */
export function SocialIcon({ platform, size = 16 }: { platform: string; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true as const, focusable: false as const };
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  switch (platform) {
    case 'facebook':
      return <svg {...common} fill="currentColor"><path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.77-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12z" /></svg>;
    case 'instagram':
      return <svg {...common} {...stroke}><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.3" cy="6.7" r="0.9" fill="currentColor" stroke="none" /></svg>;
    case 'x':
      return <svg {...common} fill="currentColor"><path d="M17.8 3h3.1l-6.8 7.8L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.9L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z" /></svg>;
    case 'youtube':
      return <svg {...common} {...stroke}><rect x="2.5" y="5" width="19" height="14" rx="4" /><path d="M10 9.2l5 2.8-5 2.8z" fill="currentColor" /></svg>;
    case 'linkedin':
      return <svg {...common} {...stroke}><rect x="3" y="3" width="18" height="18" rx="3" /><path d="M8 10.5V16M8 7.6v.01M12 16v-5.5M12 13a2.5 2.5 0 0 1 5 0v3" /></svg>;
    case 'tiktok':
      return <svg {...common} {...stroke}><path d="M14 3v11.2a3.7 3.7 0 1 1-3.7-3.7M14 3c.4 2.7 2.1 4.3 4.7 4.6" /></svg>;
    case 'whatsapp':
      return <svg {...common} {...stroke}><path d="M3.2 20.8l1.5-4.6A8.7 8.7 0 1 1 8 19.5l-4.8 1.3z" /><path d="M9.2 8.6c-.3 1.6 1.5 4.3 3.6 5.2 1.1.5 2.1.1 2.4-.6l-1.5-1-.8.6c-.9-.4-1.8-1.3-2.2-2.2l.6-.8-.9-1.5c-.5 0-.9.2-1.2.6z" /></svg>;
    default:
      return <svg {...common} {...stroke}><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" /></svg>;
  }
}

interface PartTokens { fontFamily: string; color: string; muted: string; fontSize: string }

/** Address / phone / email / hours the retailer typed into a "Contact" footer block. */
export function FooterContact({ settings, tokens }: { settings: { email?: string; phone?: string; address?: string; hours?: string }; tokens: PartTokens }) {
  const line: CSSProperties = { fontFamily: tokens.fontFamily, fontSize: tokens.fontSize, color: tokens.color, lineHeight: 1.6, margin: 0 };
  return (
    <div className="flex flex-col gap-2">
      {settings.email && <a href={`mailto:${settings.email}`} className="no-underline" style={line}>{settings.email}</a>}
      {settings.phone && <a href={`tel:${String(settings.phone).replace(/[^\d+]/g, '')}`} className="no-underline" style={line}>{settings.phone}</a>}
      {settings.address && <p style={{ ...line, color: tokens.muted, whiteSpace: 'pre-line' }}>{settings.address}</p>}
      {settings.hours && <p style={{ ...line, color: tokens.muted, whiteSpace: 'pre-line' }}>{settings.hours}</p>}
    </div>
  );
}

const PAYMENT_LABELS: Record<string, string> = {
  visa: 'VISA', mastercard: 'Mastercard', amex: 'Amex', paypal: 'PayPal', applepay: 'Apple Pay',
  googlepay: 'Google Pay', jazzcash: 'JazzCash', easypaisa: 'Easypaisa', cod: 'Cash on delivery',
};

/** Neutral text badges for the payment methods the retailer accepts (no third-party logo artwork). */
export function PaymentBadges({ icons, tokens, border, radius }: { icons: string[]; tokens: PartTokens; border: string; radius: string }) {
  if (!icons.length) return null;
  return (
    <ul className="flex flex-wrap items-center justify-center gap-2 list-none p-0 m-0" aria-label="Accepted payment methods">
      {icons.map(icon => (
        <li key={icon} style={{ fontFamily: tokens.fontFamily, fontSize: '10.5px', fontWeight: 600, letterSpacing: '0.04em', color: tokens.muted, border: `1px solid ${border}`, borderRadius: radius, padding: '4px 8px' }}>
          {PAYMENT_LABELS[icon] ?? icon}
        </li>
      ))}
    </ul>
  );
}
