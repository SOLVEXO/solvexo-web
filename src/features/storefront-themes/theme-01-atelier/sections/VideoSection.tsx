import type { Section } from '@/api/services/storefrontTypes';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

const ASPECT: Record<string, string> = { '16:9': '16/9', '4:3': '4/3', '1:1': '1/1' };

function toEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes('youtu.be')) return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes('youtube.com')) {
      const id = u.searchParams.get('v');
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname.includes('vimeo.com')) return `https://player.vimeo.com/video/${u.pathname.split('/').pop()}`;
    return null;
  } catch { return null; }
}

registerAtelierSection('video', (section: Section, _blocks, colors: AtelierSectionColors) => {
  const embed = section.settings.videoUrl ? toEmbedUrl(section.settings.videoUrl) : null;
  if (!embed) return null;
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto flex flex-col gap-6" style={{ maxWidth: t.layout.maxWidth }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: colors.ink, textAlign: 'center' }}>
            {section.settings.heading}
          </h2>
        )}
        <div style={{ aspectRatio: ASPECT[section.settings.aspectRatio] ?? '16/9', background: colors.bgAlt }}>
          <iframe src={embed} title={section.settings.heading ?? 'Video'} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
        </div>
      </div>
    </div>
  );
});
