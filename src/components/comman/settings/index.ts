// ─── Settings module primitives ──────────────────────────────────────────────
// Shared by the seller store Settings hub and the admin platform Settings hub.

export { SettingsShell }                  from './SettingsShell';
export { SettingsNavList, SettingsNavPanel } from './SettingsNavList';
export type { SettingsNavItem, SettingsNavGroup } from './SettingsNavList';

export { SettingsCard, SettingsRow, SettingsGroupLabel, SettingsChoice } from './SettingsCard';
export { SettingsSaveBar }                from './SettingsSaveBar';
export type { SettingsSaveState }         from './SettingsSaveBar';
