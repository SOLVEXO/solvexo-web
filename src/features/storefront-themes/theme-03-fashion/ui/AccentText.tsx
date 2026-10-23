import { Fragment, type ReactNode } from 'react';

/** A heading is ONE translatable sentence with the accent word(s) marked `*like this*` (e.g. "Welcome *back*"), so the
 *  translator decides where the accent falls and word order is right in every language. `accent` (old two-part form) still works. */
export function AccentText({ text, accent, size = '1.06em' }: { text: string; accent?: string; size?: string }): ReactNode {
  const serif = (node: ReactNode) => <span className="fx-serif" style={{ fontSize: size }}>{node}</span>;
  if (accent) return <>{text} {serif(accent)}</>;
  return <>{text.split(/\*([^*]+)\*/).map((part, i) => (i % 2 === 1 ? <Fragment key={i}>{serif(part)}</Fragment> : part))}</>;
}
