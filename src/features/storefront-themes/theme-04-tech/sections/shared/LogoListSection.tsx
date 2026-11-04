import { Link } from 'react-router-dom';
import type { Block } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { PreviewBlock } from '../../../previewInspector';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

function Logo({ block, height, grayscale }: { block: Block; height: number; grayscale: boolean }) {
  const { resolveLink } = useStorefront();
  const s = block.settings;
  if (!s.imageUrl) return null;
  const img = (
    <img src={s.imageUrl} alt={s.alt ?? ''} loading="lazy"
      style={{ height, width: 'auto', maxWidth: 160, objectFit: 'contain', filter: grayscale ? 'grayscale(1)' : undefined, opacity: grayscale ? 0.65 : 1, transition: 'opacity .2s, filter .2s' }}
      onMouseEnter={e => { if (grayscale) { e.currentTarget.style.filter = 'none'; e.currentTarget.style.opacity = '1'; } }}
      onMouseLeave={e => { if (grayscale) { e.currentTarget.style.filter = 'grayscale(1)'; e.currentTarget.style.opacity = '0.65'; } }} />
  );
  if (!s.link) return img;
  const target = resolveLink(s.link);
  return target.to ? <Link to={target.to}>{img}</Link> : <a href={target.href} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>{img}</a>;
}

export function LogoListSection({ section, blocks, colors }: SharedSectionProps) {
  if (blocks.length === 0) return null;
  const height = Math.min(120, Math.max(16, Number(section.settings.logoHeight) || 40));
  return (
    <SectionShell colors={colors} heading={section.settings.heading} align="center">
      <div className="flex flex-wrap items-center justify-center rounded-[28px] px-6 py-8 md:px-12" style={{ gap: '28px 56px', background: colors.bgAlt }}>
        {blocks.map((b, i) => (
          <PreviewBlock key={b._id ?? i} blockId={String(b._id ?? i)}>
            <Logo block={b} height={height} grayscale={section.settings.grayscale !== false} />
          </PreviewBlock>
        ))}
      </div>
    </SectionShell>
  );
}
