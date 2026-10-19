import type { StorefrontFooter, FooterSettingsPatch } from '@/api/services/storeTheme';

/** The footer fields the editor saves next to the footer's blocks. */
export function footerSettingsOf(footer: StorefrontFooter): FooterSettingsPatch {
  const keys = ['logoSource', 'logoUrl', 'logoWidth', 'showNewsletter', 'newsletterHeading', 'newsletterText',
    'showDefaultColumns', 'shopColumnHeading', 'accountColumnHeading', 'blogLinkLabel', 'bgColor', 'textColor', 'blockLayout', 'paddingY', 'bgImageUrl', 'bgOverlay', 'align', 'headingUppercase', 'socialStyle',
    'newsletterTop', 'mobileAccordion', 'showPolicyLinks', 'showCurrency', 'showBackToTop', 'preset', 'sections'] as const;
  const out: Record<string, unknown> = {};
  for (const k of keys) if (footer[k] !== undefined) out[k] = footer[k];
  return out as FooterSettingsPatch;
}
