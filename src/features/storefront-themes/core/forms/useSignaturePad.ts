import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';

/**
 * Headless logic of a signature box: the visitor draws with a finger or mouse, and the drawing becomes a PNG file.
 * A theme draws the canvas and the buttons around it.
 */
export function useSignaturePad(opts: { color: string; onDone: (file: File) => void }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const last = useRef<{ x: number; y: number } | null>(null);
  const onDone = useRef(opts.onDone);
  useEffect(() => { onDone.current = opts.onDone; });
  const [hasInk, setHasInk] = useState(false);

  const point = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const start = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; if (!c) return;
    c.setPointerCapture?.(e.pointerId);
    drawing.current = true;
    last.current = point(e);
  }, []);

  const move = useCallback((e: ReactPointerEvent<HTMLCanvasElement>) => {
    const c = canvasRef.current; const ctx = c?.getContext('2d');
    if (!drawing.current || !c || !ctx || !last.current) return;
    const p = point(e);
    ctx.strokeStyle = opts.color; ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(last.current.x, last.current.y); ctx.lineTo(p.x, p.y); ctx.stroke();
    last.current = p;
    setHasInk(true);
  }, [opts.color]);

  const end = useCallback(() => { drawing.current = false; last.current = null; }, []);

  const clear = useCallback(() => {
    const c = canvasRef.current; const ctx = c?.getContext('2d');
    if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
    setHasInk(false);
  }, []);

  /** Turns the drawing into a PNG and hands it over (the form uploads it like any other file). */
  const save = useCallback(() => {
    const c = canvasRef.current; if (!c || !hasInk) return;
    c.toBlob(blob => { if (blob) onDone.current(new File([blob], 'signature.png', { type: 'image/png' })); }, 'image/png');
  }, [hasInk]);

  return { canvasRef, hasInk, handlers: { onPointerDown: start, onPointerMove: move, onPointerUp: end, onPointerLeave: end, onPointerCancel: end }, clear, save };
}
