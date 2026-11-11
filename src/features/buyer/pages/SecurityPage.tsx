import { usePageTitle } from '@/hooks/usePageTitle';
import { LegalPageLayout } from '@/components/comman/ui';
import { useSiteText } from '@/i18n/site/useSiteText';
import { SECURITY_TEXT } from './SecurityPage.text';

// Text (and why it only makes architecture-level claims) lives in SecurityPage.text.ts.
export function SecurityPage() {
  const t = useSiteText(SECURITY_TEXT);
  usePageTitle(t.pageTitle);
  return (
    <LegalPageLayout
      title={t.title}
      subtitle={t.subtitle}
      lastUpdated={t.lastUpdated}
      sections={t.sections}
      relatedPages={t.relatedPages}
    />
  );
}
