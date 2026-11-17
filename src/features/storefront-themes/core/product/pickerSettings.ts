import { useMemo } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { useTemplateSections } from '../pageHooks';

export interface PickerSettings { pickerStyle?: unknown; shape: 'circle' | 'square'; size: 'sm' | 'md' | 'lg' }

/** The look the seller chose in the product page's "Variant picker" block, for places that draw options outside that page
 *  (quick view, Ledup). No block / no choice = buttons, exactly as before. */
export function pickerSettingsOf(sections: Section[]): PickerSettings {
  const block = sections.flatMap(s => s.blocks ?? []).find(b => b.type === 'product_variant_picker');
  const s = (block?.settings ?? {}) as Record<string, unknown>;
  return { pickerStyle: s.pickerStyle, shape: s.swatchShape === 'square' ? 'square' : 'circle', size: s.swatchSize === 'sm' || s.swatchSize === 'lg' ? s.swatchSize : 'md' };
}

export function useProductPickerSettings(storeId: string | undefined, templateKey: string | undefined): PickerSettings {
  const sections = useTemplateSections(storeId, 'product', templateKey || 'default');
  return useMemo(() => pickerSettingsOf(sections), [sections]);
}
