import { registerThemeManifest } from '../themeManifest';
import { baseManifest } from './manifestBase';
import { LEDUP_PRESETS } from './ledupPresets';

export const ledupThemeManifest = {
  ...baseManifest,
  // Ready-made ledup.pt style designs for the theme's own sections (one card each in Add section).
  customSections: (baseManifest.customSections ?? []).map(s => (LEDUP_PRESETS[s.key] ? { ...s, presets: LEDUP_PRESETS[s.key] } : s)),
};

registerThemeManifest(ledupThemeManifest);
