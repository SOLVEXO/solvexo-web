import { useMemo } from 'react';
import { sanitizeHtml } from '@/utils/sanitizeHtml';
import { SectionShell } from '../SectionShell';
import type { SharedSectionProps } from './types';

export function CustomHtmlSection({ section, colors }: SharedSectionProps) {
  const html = useMemo(() => sanitizeHtml(String(section.settings.html ?? '')), [section.settings.html]);
  if (!html) return null;
  return (
    <SectionShell colors={colors}>
      <div style={{ color: colors.ink }} dangerouslySetInnerHTML={{ __html: html }} />
    </SectionShell>
  );
}
