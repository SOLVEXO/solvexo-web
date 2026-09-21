import { Component, type ReactNode } from 'react';
import { Star } from 'lucide-react';

/**
 * Phase 8 — App Blocks: the real storefront rendering boundary.
 *
 * This is the ONE place an app block's `Block.type` (`app:<appId>:<key>`)
 * turns into real pixels on the live storefront. Deliberately NOT a dynamic
 * dispatch — there is no remote script fetch, no `eval`, no third-party
 * bundle loaded at runtime. `REGISTRY` below is a small, fixed map this
 * codebase ships and reviews like any other component; adding a new app's
 * block means adding a new registry entry here (a real code change,
 * reviewed and deployed by this project, same as adding a new first-party
 * section) — never something an "app" supplies at runtime. This is the
 * same security model Shopify's own App Blocks actually rely on (an app's
 * block is Liquid rendered server-side against a declared schema, never
 * arbitrary code executing inside Shopify's own process).
 *
 * By convention in this MVP, an app block's `renderKind` (declared on the
 * backend's `AppBlockDefinition`, see `apps/app-catalog.ts`) is always
 * equal to its own `key` — so the storefront can resolve straight from the
 * `Block.type` string alone, with zero network round-trip on the live
 * buyer-facing page. A future app needing a distinct render implementation
 * for the same key would need this convention revisited; disclosed rather
 * than silently assumed to always hold.
 *
 * `AppBlockErrorBoundary` is the other real half of "secure rendering
 * boundary" — a broken/misconfigured app block can never take down the
 * rest of the page (or the rest of this section's other blocks) around it.
 * There is no async operation here to add a timeout around: every
 * registered renderer is a plain, synchronous React component (no
 * `fetch`/dynamic import/remote call) — a "timeout" would have nothing
 * real to bound, so one isn't faked in.
 */

export interface AppBlockRendererColors {
  ink: string;
  inkMuted: string;
  accent: string;
  border: string;
  bg: string;
}

type AppBlockRenderFn = (settings: Record<string, any>, colors: AppBlockRendererColors) => ReactNode;

const REGISTRY: Record<string, AppBlockRenderFn> = {
  // The one demo app this MVP ships — "Trust Signals" → Rating Badge.
  rating_badge: (settings, colors) => (
    <div
      className="inline-flex items-center gap-2"
      style={{ padding: '8px 14px', border: `1px solid ${colors.border}`, borderRadius: '8px', background: colors.bg }}
    >
      {settings.showStars !== false && (
        <span className="flex gap-[2px]" aria-hidden="true">
          {[1, 2, 3, 4, 5].map(i => <Star key={i} size={12} fill={colors.accent} color={colors.accent} />)}
        </span>
      )}
      <span style={{ fontSize: '13px', color: colors.ink }}>{settings.text || 'Trusted by our customers'}</span>
    </div>
  ),
};

class AppBlockErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error: unknown) {
    // eslint-disable-next-line no-console
    console.error('[AppBlockRenderer] an app block failed to render and was hidden:', error);
  }
  render() {
    // Fails closed — hides just this one block, never the rest of the
    // section/page around it. Matches this app's own "unknown/broken
    // content renders as nothing, never a crash" convention.
    return this.state.hasError ? null : this.props.children;
  }
}

/** `type` is a full `Block.type` (`app:<appId>:<blockKey>`) — parsed here,
 *  not by the caller, so every call site stays a one-line dispatch. Renders
 *  nothing (not an error) for an unregistered/unknown block key — same
 *  silent-skip convention `AtelierSectionRenderer`/`NovaSectionRenderer`
 *  already use for any unknown section/block type. */
export function AppBlockRenderer({ type, settings, colors }: {
  type: string;
  settings: Record<string, any>;
  colors: AppBlockRendererColors;
}) {
  const blockKey = type.split(':')[2];
  const render = blockKey ? REGISTRY[blockKey] : undefined;
  if (!render) return null;
  return <AppBlockErrorBoundary>{render(settings, colors)}</AppBlockErrorBoundary>;
}
