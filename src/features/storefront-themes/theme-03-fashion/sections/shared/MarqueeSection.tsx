import { useId } from 'react';
import { Link } from 'react-router-dom';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { PreviewBlock } from '../../../previewInspector';
import { fashionTheme as t } from '../../theme.config';
import type { SharedSectionProps } from './types';

const SECONDS = { slow: 40, medium: 25, fast: 12 } as const;

export function MarqueeSection({ section, blocks, colors }: SharedSectionProps) {
  const { resolveLink } = useStorefront();
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  if (blocks.length === 0) return null;
  const s = section.settings;
  const speed = SECONDS[s.speed as keyof typeof SECONDS] ?? SECONDS.medium;
  const reverse = s.direction === 'right';
  const pause = s.pauseOnHover !== false;
  const items = blocks.map((b, i) => {
    const text = <span className="whitespace-nowrap text-[clamp(20px,3vw,34px)] font-medium tracking-tight" style={{ fontFamily: t.fonts.display, color: colors.ink, unicodeBidi: 'plaintext' }}>{b.settings.text}</span>;
    const target = b.settings.link ? resolveLink(b.settings.link) : null;
    const inner = !target ? text : target.to ? <Link to={target.to} className="no-underline">{text}</Link>
      : <a href={target.href} className="no-underline" {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{text}</a>;
    return (
      <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
        <span className="inline-flex items-center gap-10 pr-10">{inner}<span aria-hidden className="fx-serif text-2xl" style={{ color: colors.inkMuted }}>*</span></span>
      </PreviewBlock>
    );
  });
  const cls = `fx-mq-${uid}`;
  return (
    // dir="ltr" must sit on the clipping container: an RTL parent would right-align the belt and push it off screen.
    <section className={`${cls} overflow-hidden py-5`} style={{ background: colors.bgAlt }} dir="ltr">
      <style>{`
        .${cls} .fx-mq-track{display:flex;width:max-content;animation:fx-mq ${speed}s linear infinite;animation-direction:${reverse ? 'reverse' : 'normal'}}
        ${pause ? `.${cls}:hover .fx-mq-track{animation-play-state:paused}` : ''}
        @keyframes fx-mq{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        @media (prefers-reduced-motion:reduce){.${cls} .fx-mq-track{animation:none}}
      `}</style>
      {/* The belt always runs left-to-right so the loop has no gap in an RTL page; each text sets its own direction. */}
      <div className="fx-mq-track">
        <div className="flex">{items}{items}</div>
        <div className="flex" aria-hidden>{items}{items}</div>
      </div>
    </section>
  );
}
