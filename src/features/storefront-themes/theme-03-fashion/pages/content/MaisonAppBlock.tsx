import { Component, type ReactNode } from 'react';
import { Star } from 'lucide-react';
import { fashionTheme as t } from '../../theme.config';
import { ts } from '@/utils/tStatic';

type Settings = Record<string, unknown>;

/** Fixed registry of app blocks Maison can draw (key = the third part of pp:<appId>:<key>). Unknown keys render nothing. */
const REGISTRY: Record<string, (s: Settings) => ReactNode> = {
  rating_badge: s => (
    <div className="inline-flex items-center gap-2 px-4 py-2" style={{ border: `1px solid ${t.colors.border}`, borderRadius: 999, background: t.colors.bgAlt, color: t.colors.ink, fontFamily: t.fonts.body }}>
      {s.showStars !== false && (
        <span className="flex gap-0.5" aria-hidden>
          {[1, 2, 3, 4, 5].map(i => <Star key={i} size={13} fill={t.colors.ink} color={t.colors.ink} />)}
        </span>
      )}
      <span className="text-[13px]">{typeof s.text === 'string' && s.text ? s.text : ts('pg.trusted_by_our_customers', 'Trusted by our customers')}</span>
    </div>
  ),
};

/** A broken app block hides itself instead of taking the page down. */
class BlockBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

export function MaisonAppBlock({ type, settings }: { type: string; settings: Settings }) {
  const key = type.split(':')[2];
  const render = key ? REGISTRY[key] : undefined;
  return render ? <BlockBoundary>{render(settings)}</BlockBoundary> : null;
}