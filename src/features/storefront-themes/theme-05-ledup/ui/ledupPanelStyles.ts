import type { CSSProperties } from 'react';
import { ledupTheme as t } from '../theme.config';

/** Table cell styles shared by Tech data tables (functions, so seller colour changes apply). */
export const ledupTh = (): CSSProperties => ({ textAlign: 'start', padding: '10px 20px', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', color: '#8c847e', background: '#f7f6f5', borderBottom: `1px solid ${t.colors.border}` });
export const ledupTd = (): CSSProperties => ({ padding: '14px 20px', whiteSpace: 'nowrap', borderBottom: `1px solid ${t.colors.border}`, verticalAlign: 'top' });
