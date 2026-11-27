import { useState } from 'react';
import { ImageLink } from '../../../HeroSlideLink';
import { focalOf } from '../../../imageFit';
import { useMediaQuery } from '../../../core/useMediaQuery';
import { baseTheme as t } from '../../theme.base';
import { EditableText } from '../../../inlineEdit';
import { LinkButton } from '../SectionShell';
import type { SharedSectionProps } from './types';

const HEIGHT = { small: 320, medium: 480, large: 640 } as const;
const TEXT_WIDTH = { narrow: 480, normal: 720, wide: 1100 } as const;

const pxHeight = (v: unknown) => (typeof v === 'number' && v >= 150 && v <= 1400 ? v : null);

export function ImageBannerSection({ section, colors }: SharedSectionProps) {
  const s = section.settings;
  const [errored, setErrored] = useState(false);
  const isPhone = useMediaQuery('(max-width: 767px)');
  // A button with no picture and no words is still a banner — only a completely
  // empty section draws nothing.
  if (!s.imageUrl && !s.heading && !s.subheading && !s.ctaText) return null;
  const hasImage = !!s.imageUrl && !errored;
  const adapt = s.heightPreset === 'adapt' && hasImage;
  const textColor = s.textColor || (hasImage ? '#FFFFFF' : colors.ink);
  const align = s.contentAlign === 'center' ? 'center' : s.contentAlign === 'right' ? 'right' : 'left';
  const justify = s.contentPosition === 'top' ? 'flex-start' : s.contentPosition === 'bottom' ? 'flex-end' : 'center';
  const alignItems = align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start';
  // "Image only": the picture carries its own design, so draw no dark layer and no heading / text / button on it.
  const only = s.imageOnly === true && hasImage;
  const overlay = only ? 0 : Math.min(80, Math.max(0, Number(s.overlayOpacity ?? 30)));
  const desktop = pxHeight(s.customHeight) ?? HEIGHT[s.heightPreset as keyof typeof HEIGHT] ?? HEIGHT.medium;
  const mobilePreset = s.mobileHeightPreset ?? 'same';
  const mobile = mobilePreset === 'same' ? desktop : pxHeight(s.mobileCustomHeight) ?? HEIGHT[mobilePreset as keyof typeof HEIGHT] ?? desktop;
  const minHeight = adapt ? undefined : isPhone ? mobile : desktop;
  const textWidth = TEXT_WIDTH[s.contentWidth as keyof typeof TEXT_WIDTH] ?? TEXT_WIDTH.normal;
  return (
    <section style={{ padding: `0 ${t.layout.containerPadX}` }}>
      <div className="relative mx-auto overflow-hidden" style={{ maxWidth: t.layout.maxWidth, borderRadius: t.sectionRadiusPx, background: colors.bgAlt, minHeight }}>
        {hasImage && (
          <img src={s.imageUrl} alt="" onError={() => setErrored(true)}
            style={adapt ? { display: 'block', width: '100%', height: 'auto' } : { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: focalOf(s.focalPoint) }} />
        )}
        {hasImage && overlay > 0 && <div aria-hidden className="absolute inset-0" style={{ background: `rgba(0,0,0,${overlay / 100})` }} />}
        <ImageLink settings={s} label={s.heading} />
        {!only && <div className={`${hasImage ? 'lb-on-image ' : ''}flex p-8 md:p-14`} style={{ position: adapt ? 'absolute' : 'relative', inset: adapt ? 0 : undefined, minHeight: adapt ? undefined : 'inherit', justifyContent: justify, alignItems, textAlign: align, color: textColor }}>
          <div className="flex w-full flex-col gap-4" style={{ maxWidth: textWidth }}>
            {s.heading && <h2 className="sx-h2 m-0 max-w-[720px] text-[clamp(30px,5vw,60px)] leading-[1.05]" style={{ fontFamily: t.fonts.display }}><EditableText value={s.heading} settingKey="heading" /></h2>}
            {s.subheading && <p className="m-0 max-w-[560px] text-base leading-relaxed opacity-90 md:text-lg" style={{ fontFamily: t.fonts.body }}><EditableText value={s.subheading} settingKey="subheading" /></p>}
            <div style={{ position: 'relative', zIndex: 2 }}><LinkButton text={s.ctaText} link={s.ctaLink} variant={hasImage && !s.textColor ? 'light' : 'primary'} /></div>
          </div>
        </div>}
      </div>
    </section>
  );
}