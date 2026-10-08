import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaButton } from '../components/NovaButton';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';
import { renderRichText } from '@/utils/richText';
import { PreviewBlock } from '../../previewInspector';
import { imageFit } from '../../imageFit';

function Pair({ block, colors }: { block: Block; colors: NovaSectionColors }) {
  const { resolveLink } = useStorefront();
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const link = s.ctaLink ? resolveLink(s.ctaLink) : null;
  const imageFirst = (s.imagePosition ?? 'left') === 'left';
  const fit = imageFit(s.imageRatio, '4 / 3', s.focalPoint);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center" style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className={imageFirst ? 'order-1' : 'order-1 lg:order-2'} style={{ ...fit.box, background: colors.bgAlt, borderRadius: t.imageRadiusPx, overflow: 'hidden' }}>
        {s.imageUrl && !errored && <img src={s.imageUrl} alt={s.heading ?? ''} onError={() => setErrored(true)} style={fit.img} />}
      </div>
      <div className={imageFirst ? 'order-2' : 'order-2 lg:order-1'}>
        {s.heading && <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: colors.ink, marginBottom: '16px' }}>{s.heading}</h2>}
        {s.body && <p style={{ fontFamily: t.fonts.body, fontSize: '15px', color: colors.inkMuted, lineHeight: 1.75, marginBottom: '24px' }}>{renderRichText(s.body)}</p>}
        {s.ctaText && link && (
          link.to ? <Link to={link.to} className="no-underline"><NovaButton variant="outline">{s.ctaText}</NovaButton></Link>
            : <a href={link.href} className="no-underline"><NovaButton variant="outline">{s.ctaText}</NovaButton></a>
        )}
      </div>
    </div>
  );
}

registerNovaSection('image_with_text', (_section: Section, blocks: Block[], colors: NovaSectionColors) => (
  <>{blocks.map((b, i) => <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}><Pair block={b} colors={colors} /></PreviewBlock>)}</>
));
