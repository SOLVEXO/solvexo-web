import type { ReactNode } from 'react';
import type { LayoutWidget, WidgetSize } from '@/api/services/dashboardLayout';

export type { LayoutWidget, WidgetSize };

/** A per-widget option shown in the widget's settings popover (a drop-down of fixed, server-validated values). */
export interface WidgetSettingField {
  key: string;
  label: string;
  options: { value: string | number; label: string }[];
}

/** One widget a dashboard can hold. The matching size/setting rules live on the server (`dashboard-widgets.const.ts`). */
export interface DashboardWidgetDef {
  id: string;
  title: string;
  description: string;
  category: string;
  icon?: ReactNode;
  sizes: WidgetSize[];
  defaultSize: WidgetSize;
  settings?: WidgetSettingField[];
  defaultSettings?: Record<string, string | number>;
  /** Critical indicators can be shrunk but never removed or hidden. */
  locked?: boolean;
}

export interface DashboardPreset {
  id: string;
  label: string;
  description: string;
  /** Widget ids in order; sizes/settings come from each definition's defaults unless overridden. */
  widgets: (string | { id: string; size?: WidgetSize; settings?: Record<string, string | number> })[];
}

export const SIZE_LABEL: Record<WidgetSize, string> = {
  small: 'Small (¼ width)',
  third: 'Third (⅓ width)',
  medium: 'Half width',
  large: 'Two thirds',
  full: 'Full width',
};

// Full class names (not built from the size) so Tailwind keeps them.
export const SIZE_CLASS: Record<WidgetSize, string> = {
  // `small` is only ever a KPI metric, so two-up on a phone is Shopify's own
  // layout; every other widget defaults to third/medium/large/full.
  small: 'col-span-6 sm:col-span-6 lg:col-span-3',
  third: 'col-span-12 lg:col-span-4',
  medium: 'col-span-12 lg:col-span-6',
  large: 'col-span-12 lg:col-span-8',
  full: 'col-span-12',
};
