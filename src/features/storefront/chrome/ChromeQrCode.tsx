import { useMemo, type ReactElement } from 'react';
import QRCode from 'qrcode';
import type { ChromeQr } from './chromeTypes';

/**
 * A QR code drawn as SVG from the seller's own design: what it encodes, both colours, dot shape, finder-eye shape,
 * an optional centre logo and a caption. Drawn by us (not a plain library image) so the look is fully theirs.
 */
export function ChromeQrCode({ qr, size = 200, font }: { qr: ChromeQr; size?: number; font?: string }) {
  const grid = useMemo(() => {
    const data = qr.data.trim();
    if (!data) return null;
    try {
      const m = QRCode.create(data, { errorCorrectionLevel: qr.logoUrl ? 'H' : 'M' }).modules;
      return { n: m.size, get: (r: number, c: number) => m.get(r, c) === 1 };
    } catch { return null; }
  }, [qr.data, qr.logoUrl]);
  if (!grid) return null;

  const { n, get } = grid;
  const quiet = 2;
  const total = n + quiet * 2;
  const inEye = (r: number, c: number) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const logoBox = qr.logoUrl ? Math.round(n * 0.22) : 0;
  const mid = n / 2;
  const inLogo = (r: number, c: number) => logoBox > 0 && Math.abs(r + 0.5 - mid) < logoBox / 2 + 0.5 && Math.abs(c + 0.5 - mid) < logoBox / 2 + 0.5;

  const dots: ReactElement[] = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!get(r, c) || inEye(r, c) || inLogo(r, c)) continue;
      const x = c + quiet, y = r + quiet;
      if (qr.dot === 'dots') dots.push(<circle key={`${r}-${c}`} cx={x + 0.5} cy={y + 0.5} r={0.46} />);
      else dots.push(<rect key={`${r}-${c}`} x={x} y={y} width={1.02} height={1.02} rx={qr.dot === 'rounded' ? 0.32 : 0} />);
    }
  }

  const eyes = [[0, 0], [0, n - 7], [n - 7, 0]].map(([r, c]) => {
    const x = c + quiet, y = r + quiet;
    const outer = qr.eye === 'circle' ? 3.5 : qr.eye === 'rounded' ? 1.8 : 0;
    const inner = qr.eye === 'circle' ? 1.5 : qr.eye === 'rounded' ? 0.8 : 0;
    return (
      <g key={`${r}-${c}`}>
        <rect x={x + 0.5} y={y + 0.5} width={6} height={6} rx={outer} fill="none" stroke={qr.fg} strokeWidth={1} />
        <rect x={x + 2} y={y + 2} width={3} height={3} rx={inner} fill={qr.fg} />
      </g>
    );
  });

  return (
    <figure style={{ margin: 0, display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: font }}>
      <div style={qr.frame
        ? { background: qr.frameBg || (qr.transparent ? '#ffffff' : qr.bg), padding: 10, borderRadius: 14, boxShadow: '0 1px 6px rgba(0,0,0,.12)', lineHeight: 0 }
        : { background: 'transparent', padding: 0, borderRadius: 0, boxShadow: 'none', lineHeight: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${total} ${total}`} role="img" aria-label={qr.caption || 'QR code'} shapeRendering="geometricPrecision">
          {!qr.transparent && <rect width={total} height={total} fill={qr.bg} />}
          <g fill={qr.fg}>{dots}</g>
          {eyes}
          {logoBox > 0 && (
            <g>
              <rect x={quiet + mid - logoBox / 2 - 0.3} y={quiet + mid - logoBox / 2 - 0.3} width={logoBox + 0.6} height={logoBox + 0.6} rx={1.2} fill={qr.transparent ? 'none' : qr.bg} />
              <image href={qr.logoUrl} x={quiet + mid - logoBox / 2} y={quiet + mid - logoBox / 2} width={logoBox} height={logoBox} preserveAspectRatio="xMidYMid meet" />
            </g>
          )}
        </svg>
      </div>
      {qr.caption && <figcaption style={{ fontSize: 13, fontWeight: 600, textAlign: 'center' }}>{qr.caption}</figcaption>}
    </figure>
  );
}
