import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BLOCK_STYLE_CSS, blockStyle } from '../blockStyle';

/** One resolved nav target: an in-app `Link` or a plain external `<a>`. */
export function NavAnchor({ link, children, className: baseClass, style: baseStyle, navStyle, onClick, onMouseEnter, onFocus, tabIndex }: {
  link: { to?: string; href?: string; newTab?: boolean };
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  /** The seller's no-code Style for this link (`settings.style`), merged on top, never a wrapper. */
  navStyle?: unknown;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  tabIndex?: number;
}) {
  const bs = blockStyle(navStyle);
  const className = bs ? `${baseClass ?? ''} ${bs.className}`.trim() : baseClass;
  const style = bs ? { ...baseStyle, ...bs.style } : baseStyle;
  // "No link" menu item: plain label (its dropdown opens on hover/focus), never a link to "/".
  if (!link.to && !link.href) {
    return <span onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus} className={className} style={{ ...style, cursor: 'default' }} tabIndex={tabIndex ?? 0}>{bs && <style href="sx-block-style" precedence="low">{BLOCK_STYLE_CSS}</style>}{children}</span>;
  }
  const newTabProps =link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : { rel: 'noopener' };
  if (link.to) {
    return <Link to={link.to} onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus} className={className} style={style} tabIndex={tabIndex} {...(link.newTab ? newTabProps : {})}>{bs && <style href="sx-block-style" precedence="low">{BLOCK_STYLE_CSS}</style>}{children}</Link>;
  }
  return <a href={link.href ?? '/'} onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus} className={className} style={style} tabIndex={tabIndex} {...newTabProps}>{bs && <style href="sx-block-style" precedence="low">{BLOCK_STYLE_CSS}</style>}{children}</a>;
}
