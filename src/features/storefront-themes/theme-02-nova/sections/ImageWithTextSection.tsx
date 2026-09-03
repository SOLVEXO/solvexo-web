import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Section, Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { NovaButton } from '../components/NovaButton';
import { novaTheme as t } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';
import { renderRichText } from '@/utils/richText';

function Pair({ block }: { block: Block }) {
  const { resolveLink } = useStorefront();
  const s = block.settings;
  const [errored, setErrored] = useState(false);
  const link = s.ctaLink ? resolveLink(s.ctaLink) : null;
  const imageFirst = (s.imagePosition ?? 'left') === 'left';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center" style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className={imageFirst ? 'order-1' : 'order-1 lg:order-2'} style={{ aspectRatio: '4/3', background: t.colors.bgAlt, borderRadius: t.radius.md, overflow: 'hidden' }}>
        {s.imageUrl && !errored && <img src={s.imageUrl} alt={s.heading ?? ''} onError={() => setErrored(true)} className="w-full h-full object-cover" />}
      </div>
      <div className={imageFirst ? 'order-2' : 'order-2 lg:order-1'}>
        {s.heading && <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 32px)', fontWeight: 700, color: t.colors.ink, marginBottom: '16px' }}>{s.heading}</h2>}
        {s.body && <p style={{ fontFamily: t.fonts.body, fontSize: '15px', color: t.colors.inkMuted, lineHeight: 1.75, marginBottom: '24px' }}>{renderRichText(s.body)}</p>}
        {s.ctaText && link && (
          link.to ? <Link to={link.to} className="no-underline"><NovaButton variant="outline">{s.ctaText}</NovaButton></Link>
            : <a href={link.href} className="no-underline"><NovaButton variant="outline">{s.ctaText}</NovaButton></a>
        )}
      </div>
    </div>
  );
}

registerNovaSection('image_with_text', (_section: Section, blocks: Block[]) => (
  <>{blocks.map((b, i) => <Pair key={b._id ?? i} block={b} />)}</>
));
