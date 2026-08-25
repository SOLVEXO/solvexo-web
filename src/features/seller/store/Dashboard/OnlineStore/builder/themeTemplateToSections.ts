import type { DemoSectionInstance } from './themes';
import type { Section } from '@/api/services/storefrontTypes';

/**
 * Converts a theme's own `templates.home` (real section/block instances,
 * already validated by the same backend `section-settings.validator.ts`
 * every hand-authored section goes through — see each theme file's
 * `templates.home` array) into real `Section[]` a store's Home page can
 * actually be saved with. This is what makes "Activate this theme" able to
 * genuinely change a store's home-page composition (real starter content,
 * the same way a fresh Shopify theme install seeds real placeholder
 * sections) instead of only ever touching colors/header/footer.
 */
export function themeTemplateToSections(instances: DemoSectionInstance[]): Section[] {
  return instances.map((instance) => ({
    type: instance.type as Section['type'],
    settings: instance.settings ?? {},
    blocks: (instance.blocks ?? []).map((b) => ({ type: b.type, settings: b.settings, enabled: true })),
    enabled: true,
  }));
}
