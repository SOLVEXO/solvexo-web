import { registerSection } from '../sectionRenderRegistry';
import { registerSectionSchema } from '../sectionSchemaRegistry';
import { Video } from 'lucide-react';
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

registerSectionSchema({
  type: 'video',
  label: 'Video',
  description: 'A YouTube or Vimeo embed.',
  icon: Video,
  color: '#EF4444',
  group: 'Media',
  settings: [
    { key: 'heading', kind: 'text', label: 'Heading (optional)', default: '' },
    { key: 'videoUrl', kind: 'text', label: 'Video URL', helpText: 'YouTube or Vimeo link', placeholder: 'https://youtube.com/watch?v=…' },
    { key: 'aspectRatio', kind: 'select', label: 'Aspect ratio', default: '16:9', options: [
      { value: '16:9', label: '16:9' }, { value: '4:3', label: '4:3' }, { value: '1:1', label: '1:1' },
    ] },
  ],
});
