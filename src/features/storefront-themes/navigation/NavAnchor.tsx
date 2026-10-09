import type { CSSProperties, ReactNode } from 'react';
import { Link } from 'react-router-dom';

/** One resolved nav target: an in-app `Link` or a plain external `<a>`. */
export function NavAnchor({ link, children, className, style, onClick, onMouseEnter, onFocus, tabIndex }: {
  link: { to?: string; href?: string };
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  tabIndex?: number;
}) {
  if (link.to) {
    return <Link to={link.to} onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus} className={className} style={style} tabIndex={tabIndex}>{children}</Link>;
  }
  return <a href={link.href ?? '/'} onClick={onClick} onMouseEnter={onMouseEnter} onFocus={onFocus} className={className} style={style} tabIndex={tabIndex} rel="noopener">{children}</a>;
}
