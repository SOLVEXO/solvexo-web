import { useState } from 'react';
import { focalOf } from '../../../imageFit';
import { fashionTheme as t } from '../../theme.config';
import { EditableText } from '../../../inlineEdit';
import { LinkButton } from '../SectionShell';
import type { SharedSectionProps } from './types';

const HEIGHT = { small: 320, medium: 480, large: 640 } as const;

export function ImageBannerSection({ section, colors }: SharedSectionProps) {
  const s = section.settings;
  const [errored, setErrored] = useState(false);
  if (!s.imageUrl && !s.heading && !s.subheading) return null;
  const hasImage = !!s.imageUrl && !errored;
  const adapt = s.heightPreset === 'adapt' && hasImage;
  const textColor = s.textColor || (hasImage ? '#FFFFFF' : colors.ink);
  const align = s.contentAlign === 'center' ? 'center' : s.contentAlign === 'right' ? 'right' : 'left';
  const justify = s.contentPosition === 'top' ? 'flex-start' : s.contentPosition === 'bottom' ? 'flex-end' : 'center';
  const alignItems = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  const overlay = Math.min(80, Math.max(0, Number(s.overlayOpacity ?? 30)));
  const minHeight = adapt ? undefined : HEIGHT[s.heightPreset as keyof typeof HEIGHT] ?? HEIGHT.medium;
  return (
    <section style={{ padding: `0 ${t.layout.containerPadX}` }}>
      <div className="relative mx-auto overflow-hidden" style={{ maxWidth: t.layout.maxWidth, borderRadius: 32, background: colors.bgAlt, minHeight }}>
        {hasImage && (
          <img src={s.imageUrl} alt="" onError={() => setErrored(true)}
            style={adapt ? { display: 'block', width: '100%', height: 'auto' } : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: focalOf(s.focalPoint) }} />
        )}
        {hasImage && overlay > 0 && <div aria-hidden className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay / 100})` }} />}
        <div className={`${hasImage ? 'fx-on-image ' : ''}flex flex-col gap-4 p-8 md:p-14`} style={{ position: adapt ? 'absolute' : 'relative', inset: adapt ? 0 : undefined, minHeight: adapt ? undefined : 'inherit', justifyContent: justify, alignItems, textAlign: align, color: textColor }}>
          {s.heading && <h2 className="m-0 max-w-[720px] text-[clamp(30px,5vw,60px)] font-medium leading-[1.05] tracking-tight" style={{ fontFamily: t.fonts.display }}><EditableText value={s.heading} settingKey="heading" /></h2>}
          {s.subheading && <p className="m-0 max-w-[560px] text-base leading-relaxed opacity-90 md:text-lg" style={{ fontFamily: t.fonts.body }}><EditableText value={s.subheading} settingKey="subheading" /></p>}
          <LinkButton text={s.ctaText} link={s.ctaLink} variant={hasImage && !s.textColor ? 'light' : 'primary'} />
        </div>
      </div>
    </section>
  );
}
