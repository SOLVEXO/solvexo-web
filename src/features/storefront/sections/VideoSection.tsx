import { registerSection } from '../sectionRenderRegistry';
import { useStorefront } from '../StorefrontContext';

export interface VideoSectionSettings {
  heading?:     string;
  videoUrl:     string;
  aspectRatio?: '16:9' | '4:3' | '1:1';
}

const ASPECT_CLASS: Record<string, string> = { '16:9': 'aspect-video', '4:3': 'aspect-[4/3]', '1:1': 'aspect-square' };

function toEmbedUrl(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return url;
}

export function VideoSection({ settings }: { settings: VideoSectionSettings }) {
  const { cfg } = useStorefront();
  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      <div className="mx-auto" style={{ maxWidth: Math.round(860 * cfg.containerWidthScale) }}>
        {settings.heading && <h2 className="font-bold mb-4 text-center" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>{settings.heading}</h2>}
        <div className={`w-full rounded-xl overflow-hidden bg-black ${ASPECT_CLASS[settings.aspectRatio ?? '16:9']}`}>
          <iframe
            src={toEmbedUrl(settings.videoUrl)}
            title={settings.heading ?? 'Video'}
            className="w-full h-full border-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
}

registerSection('video', (section) =>
  <VideoSection settings={section.settings as VideoSectionSettings} />,
);
