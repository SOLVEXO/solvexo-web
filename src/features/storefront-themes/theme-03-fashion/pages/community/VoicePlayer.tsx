import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { ts } from '@/utils/tStatic';

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

/** Compact voice-note player (play/pause, seekable bar, time) used instead of the browser's own audio controls. */
export function VoicePlayer({ url, label, color, track }: { url: string; label: string; color: string; track: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [now, setNow] = useState(0);
  const [length, setLength] = useState(0);

  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const onTime = () => setNow(el.currentTime);
    // recorded webm notes report Infinity until played once: show the elapsed time only then
    const onMeta = () => setLength(Number.isFinite(el.duration) ? el.duration : 0);
    const onEnd = () => { setPlaying(false); setNow(0); };
    el.addEventListener('timeupdate', onTime);
    el.addEventListener('loadedmetadata', onMeta);
    el.addEventListener('durationchange', onMeta);
    el.addEventListener('ended', onEnd);
    return () => {
      el.removeEventListener('timeupdate', onTime);
      el.removeEventListener('loadedmetadata', onMeta);
      el.removeEventListener('durationchange', onMeta);
      el.removeEventListener('ended', onEnd);
    };
  }, []);

  const toggle = () => {
    const el = audio.current;
    if (!el) return;
    if (el.paused) { void el.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
    else { el.pause(); setPlaying(false); }
  };

  return (
    <div className="flex w-[230px] max-w-full items-center gap-2.5" role="group" aria-label={label}>
      <audio ref={audio} src={url} preload="metadata" />
      <button type="button" onClick={toggle} aria-label={playing ? ts('pg.pause', 'Pause') : ts('pg.play', 'Play')} className="grid size-9 shrink-0 place-items-center rounded-full border-0" style={{ background: color, color: track, cursor: 'pointer' }}>
        {playing ? <Pause size={16} aria-hidden /> : <Play size={16} aria-hidden />}
      </button>
      <input
        type="range" min={0} max={length || 1} step={0.1} value={Math.min(now, length || 1)} disabled={!length}
        aria-label={ts('pg.seek', 'Seek')}
        onChange={e => { const el = audio.current; if (el) { el.currentTime = Number(e.target.value); setNow(el.currentTime); } }}
        className="h-1 min-w-0 flex-1" style={{ accentColor: color }}
      />
      <span className="w-9 shrink-0 text-right text-[11px] tabular-nums opacity-80">{clock(playing || now > 0 ? now : length)}</span>
    </div>
  );
}
