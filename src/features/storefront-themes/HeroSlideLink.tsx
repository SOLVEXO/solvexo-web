import { Link } from 'react-router-dom';
import { useStorefront, type StorefrontLinkSettings } from '@/features/storefront/StorefrontContext';
import { ts } from '@/utils/tStatic';
import { useInlineEditActive } from './inlineEdit';

/** "Make the whole slide a link": a transparent link laid over the slide's picture. The slide's own button (if any) must sit above it
 *  (`position: relative; z-index: 2`). Nothing renders unless the seller turned `slideLinkOn` on, and never inside the inline text editor
 *  (it would swallow the clicks). `settings` are the slide block's settings. */
export function HeroSlideLink({ settings, label, focusable = true }: { settings: Record<string, unknown>; label?: string; /** false for slides that are not on screen (keeps them out of the keyboard tab order). */ focusable?: boolean }) {
  const { resolveLink } = useStorefront();
  const editing = useInlineEditActive();
  if (settings.slideLinkOn !== true || editing) return null;
  // Same default the link picker shows when the seller never touched it.
  const target = resolveLink((settings.slideLink as StorefrontLinkSettings | undefined) ?? { linkType: 'home' });
  const aria = label?.trim() || ts('sections.openSlide', 'Open this slide');
  const cls = 'absolute inset-0 z-[1] block cursor-pointer';
  if (target.to) return <Link to={target.to} className={cls} aria-label={aria} tabIndex={focusable ? 0 : -1} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} />;
  if (target.href) return <a href={target.href} className={cls} aria-label={aria} tabIndex={focusable ? 0 : -1} {...(target.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})} />;
  return null;
}
