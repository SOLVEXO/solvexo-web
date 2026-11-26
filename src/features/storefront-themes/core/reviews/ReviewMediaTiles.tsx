import { ts } from '@/utils/tStatic';
import { reviewMediaKind, splitReviewMedia, type ReviewMediaKind } from './reviewMedia';

export interface ReviewMediaTokens {
  ink: string;
  muted: string;
  bg: string;
  radius?: number;
}

/**
 * A review's attachments: photo thumbs, one audio player, one video player.
 * Themes pass their own colours, so the same tiles match every theme.
 */
export function ReviewMediaTiles({ media, tokens, onOpen, onRemove, compact = false, kinds }: {
  media: string[] | null | undefined;
  tokens: ReviewMediaTokens;
  /** Open the photo lightbox (photos only). */
  onOpen?: (index: number) => void;
  onRemove?: (url: string) => void;
  compact?: boolean;
  /** Only render these kinds (e.g. a page that already draws its own photo strip). */
  kinds?: ReviewMediaKind[];
}) {
  const split = splitReviewMedia(media);
  const want = (kind: ReviewMediaKind) => !kinds || kinds.includes(kind);
  const images = want('image') ? split.image : [];
  const audio = want('audio') ? split.audio : [];
  const video = want('video') ? split.video : [];
  if (!images.length && !audio.length && !video.length) return null;
  const thumb = compact ? 56 : 72;
  const radius = tokens.radius ?? 12;

  return (
    <div className={compact ? 'mt-3 flex flex-wrap items-center gap-2' : 'mt-3 flex flex-col gap-3'}>
      {images.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {images.map((url, i) => {
            const image = <img src={url} alt={ts('pg.attached_to_your_review', 'Attached to your review')} loading="lazy"
              style={{ width: thumb, height: thumb, objectFit: 'cover', borderRadius: radius, display: 'block' }} />;
            return (
              <div key={url} className="relative">
                {onOpen
                  ? <button type="button" onClick={() => onOpen(i)} aria-label={ts('reviews.open_photo', 'Open photo {{count}}', { count: i + 1 })}
                      style={{ padding: 0, border: 0, background: 'transparent', cursor: 'zoom-in' }}>{image}</button>
                  : image}
                {onRemove && <RemoveButton url={url} onRemove={onRemove} ink={tokens.ink} bg={tokens.bg} />}
              </div>
            );
          })}
        </div>
      )}
      {audio.map(url => (
        <div key={url} className="relative" style={{ maxWidth: 340 }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- a customer voice note has no captions track */}
          <audio controls preload="none" src={url} style={{ width: '100%', height: 34 }} />
          {onRemove && <RemoveButton url={url} onRemove={onRemove} ink={tokens.ink} bg={tokens.bg} />}
        </div>
      ))}
      {video.map(url => (
        <div key={url} className="relative" style={{ maxWidth: 360 }}>
          {/* eslint-disable-next-line jsx-a11y/media-has-caption -- customer-recorded video has no captions track */}
          <video controls preload="none" src={url} style={{ width: '100%', maxHeight: 260, borderRadius: radius, background: '#000' }} />
          {onRemove && <RemoveButton url={url} onRemove={onRemove} ink={tokens.ink} bg={tokens.bg} />}
        </div>
      ))}
    </div>
  );
}

function RemoveButton({ url, onRemove, ink, bg }: { url: string; onRemove: (url: string) => void; ink: string; bg: string }) {
  const kind = reviewMediaKind(url) as ReviewMediaKind;
  const label = kind === 'audio' ? ts('pg.remove_audio', 'Remove audio')
    : kind === 'video' ? ts('pg.remove_video', 'Remove video')
      : ts('pg.remove_photo', 'Remove photo');
  return (
    <button type="button" onClick={() => onRemove(url)} aria-label={label}
      className="absolute -right-2 -top-2 grid size-6 cursor-pointer place-items-center rounded-full border-0"
      style={{ background: ink, color: bg }}>
      <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden><path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /></svg>
    </button>
  );
}