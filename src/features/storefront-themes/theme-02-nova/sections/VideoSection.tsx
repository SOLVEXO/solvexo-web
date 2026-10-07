import type { Section } from '@/api/services/storefrontTypes';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

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

registerNovaSection('video', (section: Section, _blocks, colors: NovaSectionColors) => {
  const pasted: string | undefined = section.settings.videoUrl || undefined;
  const embed = !section.settings.videoFileUrl && pasted ? toEmbedUrl(pasted) : null;
  // Uploaded file, or any other pasted https link (played as a direct video file).
  const fileUrl: string | undefined = section.settings.videoFileUrl || (embed ? undefined : pasted);
  if (!embed && !fileUrl) return null;
  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto flex flex-col gap-6" style={{ maxWidth: t.layout.maxWidth }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: colors.ink, textAlign: 'center' }}>
            {section.settings.heading}
          </h2>
        )}
        <div style={{ aspectRatio: ASPECT[section.settings.aspectRatio] ?? '16/9', background: colors.bgAlt, borderRadius: t.radius.md, overflow: 'hidden' }}>
          {fileUrl ? (
            <video src={fileUrl} controls playsInline preload="metadata" className="w-full h-full" style={{ objectFit: 'contain', background: '#000' }} />
          ) : (
          <iframe src={embed!} title={section.settings.heading ?? 'Video'} className="w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
          )}
        </div>
      </div>
    </div>
  );
});
