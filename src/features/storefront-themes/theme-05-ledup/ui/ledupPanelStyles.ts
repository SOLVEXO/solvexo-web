import type { CSSProperties } from 'react';
import { ledupTheme as t } from '../theme.config';

/** Table cell styles shared by Tech data tables (functions, so seller colour changes apply). */
export const ledupTh = (): CSSProperties => ({ textAlign: 'start', padding: '10px 20px', fontSize: 11, fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', color: t.colors.inkMuted, background: t.colors.bgAlt, borderBottom: `1px solid ${t.colors.border}` });
export const ledupTd = (): CSSProperties => ({ padding: '14px 20px', borderBottom: `1px solid ${t.colors.border}`, verticalAlign: 'top' });
