import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** One resolved nav target: an in-app `Link` or a plain external `<a>`. */
export function NavAnchor({ link, children, className, style, onClick, onMouseEnter, onFocus, tabIndex }: {
  link: { to?: string; href?: string; newTab?: boolean };
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  tabIndex?: number;
}) {
  // "No link" menu item: plain label (its dropdown opens on hover/focus), never a link to "/".
  if (!link.to && !link.href) {
    return <span onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus} className={className} style={{ ...style, cursor: 'default' }} tabIndex={tabIndex ?? 0}>{children}</span>;
  }
  const newTabProps =link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : { rel: 'noopener' };
  if (link.to) {
    return <Link to={link.to} onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus} className={className} style={style} tabIndex={tabIndex} {...(link.newTab ? newTabProps : {})}>{children}</Link>;
  }
  return <a href={link.href ?? '/'} onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus} className={className} style={style} tabIndex={tabIndex} {...newTabProps}>{children}</a>;
}
