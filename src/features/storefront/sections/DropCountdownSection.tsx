import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { Timer } from 'lucide-react';
import { useStorefront } from '../StorefrontContext';
import { ThemedButton } from '../ThemedButton';
import type { StorefrontLinkSettings } from '../StorefrontContext';

interface DropCountdownSettings {
  heading?:     string;
  subheading?:  string;
  targetDate?:  string;
  ctaText?:     string;
  ctaLink?:     StorefrontLinkSettings;
}

const UNITS: { key: 'days' | 'hours' | 'minutes' | 'seconds'; label: string }[] = [
  { key: 'days', label: 'Days' },
  { key: 'hours', label: 'Hrs' },
  { key: 'minutes', label: 'Min' },
  { key: 'seconds', label: 'Sec' },
];

function useCountdown(targetDate?: string) {
  const [now, setNow] = useState(() => Date.now());
  const target = targetDate ? new Date(targetDate).getTime() : NaN;
  const hasValidTarget = !Number.isNaN(target);

  useEffect(() => {
    if (!hasValidTarget) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [hasValidTarget, target]);

  const remaining = hasValidTarget ? Math.max(target - now, 0) : 0;
  const done = !hasValidTarget || remaining <= 0;

  return {
    done,
    days: Math.floor(remaining / 86_400_000),
    hours: Math.floor((remaining % 86_400_000) / 3_600_000),
    minutes: Math.floor((remaining % 3_600_000) / 60_000),
    seconds: Math.floor((remaining % 60_000) / 1_000),
  };
}

// A bold, high-contrast band that deliberately INVERTS the page's normal
// color relationship (dark band using the theme's own text color as the
// background, its background color as the text) — a countdown/hype section
// is meant to visually interrupt the page, not blend into it.
export function DropCountdownSection({ settings }: { settings: DropCountdownSettings }) {
  const { cfg, resolveLink } = useStorefront();
  const navigate = useNavigate();
  const countdown = useCountdown(settings.targetDate);

  const goTo = () => {
    if (!settings.ctaLink) return;
    const { to, href } = resolveLink(settings.ctaLink);
    if (to) navigate(to);
    else if (href) window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="px-4 sm:px-6 lg:px-10 flex flex-col items-center text-center gap-5"
      style={{ background: cfg.textColor, color: cfg.bgColor, paddingTop: 44 * cfg.sectionSpacingScale, paddingBottom: 44 * cfg.sectionSpacingScale }}
    >
      {settings.heading && (
        <h2 className="font-black uppercase tracking-wide" style={{ fontSize: Math.round(28 * cfg.typeScaleFactor) }}>{settings.heading}</h2>
      )}
      {settings.subheading && <p className="text-[14px] opacity-80 max-w-[520px]">{settings.subheading}</p>}

      {countdown.done ? (
        <p className="font-black uppercase text-[16px]" style={{ letterSpacing: '0.14em' }}>Dropped!</p>
      ) : (
        <div className="flex gap-3 sm:gap-4">
          {UNITS.map((u) => (
            <div
              key={u.key}
              className="flex flex-col items-center gap-1 w-[62px] sm:w-[72px] py-3 rounded-lg"
              style={{ background: `${cfg.bgColor}14`, border: `1px solid ${cfg.bgColor}30` }}
            >
              <span className="font-black text-[24px] sm:text-[30px] tabular-nums leading-none">{String(countdown[u.key]).padStart(2, '0')}</span>
              <span className="text-[10px] uppercase tracking-wide opacity-70">{u.label}</span>
            </div>
          ))}
        </div>
      )}

      {settings.ctaText && <ThemedButton onClick={goTo}>{settings.ctaText}</ThemedButton>}
    </div>
  );
}

registerSection('drop_countdown', (section) =>
  <DropCountdownSection settings={section.settings as any} />,
);

registerSectionSchema({
  type: 'drop_countdown',
  label: 'Drop Countdown',
  description: 'A bold, high-contrast countdown band for a limited release or flash drop — inverts the page’s colors to interrupt the scroll.',
  icon: Timer,
  color: '#EA580C',
  group: 'Marketing',
  templateTypes: ['home'],
  exclusiveToTheme: 'street-urban',
  settings: [
    { key: 'heading', kind: 'text', label: 'Heading', default: 'Next Drop' },
    { key: 'subheading', kind: 'text', label: 'Subheading (optional)', default: '' },
    { key: 'targetDate', kind: 'text', label: 'Target date/time (ISO)', helpText: 'e.g. 2026-09-15T18:00:00Z' },
    { key: 'ctaText', kind: 'text', label: 'Button text (optional)', default: '' },
    { key: 'ctaLink', kind: 'link', label: 'Button link', showIf: (v) => !!v.ctaText },
  ],
});
