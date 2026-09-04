import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { AtelierButton } from '../components/AtelierButton';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

function timeLeft(targetIso?: string) {
  if (!targetIso) return null;
  const target = new Date(targetIso).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
    done: false,
  };
}

function CountdownUnit({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span style={{ fontFamily: t.fonts.display, fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 600, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
        {String(value).padStart(2, '0')}
      </span>
      <span style={{ fontFamily: t.fonts.body, fontSize: '10px', letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>{label}</span>
    </div>
  );
}

/** A real, live countdown to a merchant-set drop date — a genuinely NEW
 *  section type for Atelier (this file didn't exist before), demonstrating
 *  the developer→merchant→storefront flow end to end: `drop_countdown` was
 *  already a real, backend-validated `SectionType`
 *  (`section-settings.validator.ts`) with zero frontend implementation
 *  anywhere in this theme — adding this one file plus its registry entries
 *  (see `sections/index.ts` and `builder/sectionRegistry.ts`) is the entire
 *  "developer creates a section" side; no backend change was needed since
 *  the type/settings contract already existed and was already deployed. */
function DropCountdownSection({ section, colors }: { section: Section; colors: AtelierSectionColors }) {
  const { resolveLink } = useStorefront();
  const [now, setNow] = useState(() => timeLeft(section.settings.targetDate));

  useEffect(() => {
    const id = setInterval(() => setNow(timeLeft(section.settings.targetDate)), 1000);
    return () => clearInterval(id);
  }, [section.settings.targetDate]);

  if (!now) return null;
  const link = section.settings.ctaLink ? resolveLink(section.settings.ctaLink) : null;

  return (
    <div style={{ background: colors.ink, padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto flex flex-col items-center text-center gap-6" style={{ maxWidth: '640px' }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3.5vw, 38px)', fontWeight: 600, color: '#FFFFFF' }}>
            {section.settings.heading}
          </h2>
        )}
        {section.settings.subheading && (
          <p style={{ fontFamily: t.fonts.body, fontSize: '13px', letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)' }}>
            {section.settings.subheading}
          </p>
        )}
        {now.done ? (
          <p style={{ fontFamily: t.fonts.display, fontSize: '22px', color: '#FFFFFF' }}>Dropped!</p>
        ) : (
          <div className="flex items-center gap-6 sm:gap-10">
            <CountdownUnit value={now.days} label="Days" />
            <CountdownUnit value={now.hours} label="Hrs" />
            <CountdownUnit value={now.minutes} label="Min" />
            <CountdownUnit value={now.seconds} label="Sec" />
          </div>
        )}
        {section.settings.ctaText && link && (
          link.to ? <Link to={link.to} className="no-underline"><AtelierButton style={{ background: '#FFFFFF', color: colors.ink, border: '1px solid #FFFFFF' }}>{section.settings.ctaText}</AtelierButton></Link>
            : <a href={link.href} className="no-underline"><AtelierButton style={{ background: '#FFFFFF', color: colors.ink, border: '1px solid #FFFFFF' }}>{section.settings.ctaText}</AtelierButton></a>
        )}
      </div>
    </div>
  );
}

registerAtelierSection('drop_countdown', (section: Section, _blocks, colors: AtelierSectionColors) => <DropCountdownSection section={section} colors={colors} />);
