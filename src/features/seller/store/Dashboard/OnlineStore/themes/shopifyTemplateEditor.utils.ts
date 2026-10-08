import type { ThemePackageComponentSchema, ThemePackageStructure } from '@/api/services/storeTheme';

export interface LiquidJsonTemplate {
  sections: Record<string, LiquidTemplateSection>;
  order: string[];
  [key: string]: unknown;
}

export interface LiquidTemplateSection {
  type: string;
  settings?: Record<string, unknown>;
  blocks?: Record<string, LiquidTemplateBlock>;
  block_order?: string[];
  disabled?: boolean;
  [key: string]: unknown;
}

export interface LiquidTemplateBlock {
  type: string;
  settings?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface LiquidThemeSettingsData {
  current: Record<string, unknown>;
  [key: string]: unknown;
}

export function parseLiquidThemeSettingsData(source: string): LiquidThemeSettingsData {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error('Theme settings data is not valid JSON.');
  }
  if (!isRecord(value) || (value.current !== undefined && !isRecord(value.current))) {
    throw new Error('Theme settings data must contain a current settings object.');
  }
  return { ...value, current: asRecord(value.current) };
}

export function updateLiquidThemeSetting(
  data: LiquidThemeSettingsData,
  settingId: string,
  settingValue: unknown,
): LiquidThemeSettingsData {
  return { ...data, current: { ...data.current, [settingId]: settingValue } };
}

export function parseLiquidJsonTemplate(source: string): LiquidJsonTemplate {
  let value: unknown;
  try {
    value = JSON.parse(source);
  } catch {
    throw new Error('This template is not valid JSON.');
  }
  if (!isRecord(value) || !isRecord(value.sections) || !Array.isArray(value.order)) {
    throw new Error('This template must contain sections and an ordered section list.');
  }
  const order = value.order;
  const sections = value.sections;
  if (order.some((key) => typeof key !== 'string' || !Object.hasOwn(sections, key))) {
    throw new Error('This template order refers to a missing section.');
  }
  if (new Set(order).size !== order.length) {
    throw new Error('This template order contains duplicate section IDs.');
  }
  return value as unknown as LiquidJsonTemplate;
}

export function addLiquidSection(
  template: LiquidJsonTemplate,
  structure: ThemePackageStructure,
  sectionType: string,
  templateType: string,
  scope: 'template' | 'group' = 'template',
  presetIndex = 0,
): LiquidJsonTemplate {
  const definition = structure.components.find((component) => component.kind === 'section' && component.type === sectionType);
  if (!definition) throw new Error(`Section "${sectionType}" is not present in this theme.`);
  const schema = definition.schema;
  const preset = schema.presets?.[presetIndex];
  if (!preset) throw new Error(`Section "${schema.name}" has no preset and cannot be added from the editor.`);
  if (!isEnabledForTemplate(schema, templateType, scope)) throw new Error(`Section "${schema.name}" is not enabled for this ${scope}.`);
  const sectionCount = template.order.filter((id) => template.sections[id]?.type === sectionType).length;
  if (typeof schema.limit === 'number' && sectionCount >= schema.limit) {
    throw new Error(`This template allows only ${schema.limit} "${schema.name}" section(s).`);
  }
  if (template.order.length >= 25) throw new Error('Shopify JSON templates support up to 25 sections.');

  const id = createUniqueId(template.sections);
  const sections = { ...template.sections };
  const presetBlocks = Array.isArray(preset.blocks) ? preset.blocks : [];
  const blocks: Record<string, LiquidTemplateBlock> = {};
  const blockOrder: string[] = [];
  const blockSchemas = schema.blocks ?? [];
  for (const presetBlock of presetBlocks) {
    if (!isRecord(presetBlock) || typeof presetBlock.type !== 'string') continue;
    const blockId = createUniqueId(blocks);
    const blockSchema = blockSchemas.find((block) => block.type === presetBlock.type);
    blocks[blockId] = {
      type: presetBlock.type,
      settings: { ...defaultSettings(blockSchema?.settings), ...asRecord(presetBlock.settings) },
    };
    blockOrder.push(blockId);
  }
  sections[id] = {
    type: sectionType,
    settings: { ...defaultSettings(schema.settings), ...asRecord(preset.settings) },
    ...(blockOrder.length ? { blocks, block_order: blockOrder } : {}),
  };
  return { ...template, sections, order: [...template.order, id] };
}

export function removeLiquidSection(template: LiquidJsonTemplate, sectionId: string): LiquidJsonTemplate {
  if (!template.sections[sectionId]) throw new Error('Section no longer exists in this template.');
  const sections = { ...template.sections };
  delete sections[sectionId];
  return { ...template, sections, order: template.order.filter((id) => id !== sectionId) };
}

export function setLiquidSectionDisabled(template: LiquidJsonTemplate, sectionId: string, disabled: boolean): LiquidJsonTemplate {
  const section = template.sections[sectionId];
  if (!section) throw new Error('Section no longer exists in this template.');
  return {
    ...template,
    sections: {
      ...template.sections,
      [sectionId]: { ...section, ...(disabled ? { disabled: true } : { disabled: false }) },
    },
  };
}

export function moveLiquidSection(template: LiquidJsonTemplate, sectionId: string, offset: -1 | 1): LiquidJsonTemplate {
  const index = template.order.indexOf(sectionId);
  if (index < 0) throw new Error('Section no longer exists in this template.');
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= template.order.length) return template;
  const order = [...template.order];
  [order[index], order[targetIndex]] = [order[targetIndex], order[index]];
  return { ...template, order };
}

export function addLiquidBlock(
  section: LiquidTemplateSection,
  sectionSchema: ThemePackageComponentSchema,
  blockType: string,
): LiquidTemplateSection {
  const blockSchema = (sectionSchema.blocks ?? []).find((block) => block.type === blockType);
  if (!blockSchema) throw new Error(`Block "${blockType}" is not allowed in this section.`);
  const blocks = section.blocks ?? {};
  const blockLimit = typeof blockSchema.limit === 'number' ? blockSchema.limit : undefined;
  if (blockLimit !== undefined && Object.values(blocks).filter((block) => block.type === blockType).length >= blockLimit) {
    throw new Error(`This section allows only ${blockLimit} "${String(blockSchema.name ?? blockType)}" block(s).`);
  }
  const maxBlocks = typeof sectionSchema.max_blocks === 'number' ? sectionSchema.max_blocks : 50;
  if (Object.keys(blocks).length >= Math.min(maxBlocks, 50)) throw new Error('This section has reached its block limit.');

  const blockId = createUniqueId(blocks);
  const nextBlocks = {
    ...blocks,
    [blockId]: { type: blockType, settings: defaultSettings(blockSchema.settings) },
  };
  return { ...section, blocks: nextBlocks, block_order: [...(section.block_order ?? Object.keys(blocks)), blockId] };
}

export function removeLiquidBlock(section: LiquidTemplateSection, blockId: string): LiquidTemplateSection {
  if (!section.blocks?.[blockId]) throw new Error('Block no longer exists in this section.');
  const blocks = { ...section.blocks };
  delete blocks[blockId];
  return { ...section, blocks, block_order: (section.block_order ?? []).filter((id) => id !== blockId) };
}

export function setLiquidBlockDisabled(section: LiquidTemplateSection, blockId: string, disabled: boolean): LiquidTemplateSection {
  const block = section.blocks?.[blockId];
  if (!block) throw new Error('Block no longer exists in this section.');
  return {
    ...section,
    blocks: {
      ...section.blocks,
      [blockId]: { ...block, ...(disabled ? { disabled: true } : { disabled: false }) },
    },
  };
}

export function moveLiquidBlock(section: LiquidTemplateSection, blockId: string, offset: -1 | 1): LiquidTemplateSection {
  const blockOrder = section.block_order ?? Object.keys(section.blocks ?? {});
  const index = blockOrder.indexOf(blockId);
  if (index < 0) throw new Error('Block no longer exists in this section.');
  const targetIndex = index + offset;
  if (targetIndex < 0 || targetIndex >= blockOrder.length) return section;
  const nextOrder = [...blockOrder];
  [nextOrder[index], nextOrder[targetIndex]] = [nextOrder[targetIndex], nextOrder[index]];
  return { ...section, block_order: nextOrder };
}

export function updateLiquidSettings(
  value: Record<string, unknown> | undefined,
  settingId: string,
  settingValue: unknown,
): Record<string, unknown> {
  return { ...value, [settingId]: settingValue };
}

export function getAddableLiquidSections(
  template: LiquidJsonTemplate,
  structure: ThemePackageStructure,
  templateType: string,
  scope: 'template' | 'group' = 'template',
): ThemePackageStructure['components'] {
  return structure.components.filter((component) => {
    if (component.kind !== 'section' || !Array.isArray(component.schema.presets) || component.schema.presets.length === 0) return false;
    if (!isEnabledForTemplate(component.schema, templateType, scope)) return false;
    return typeof component.schema.limit !== 'number' ||
      template.order.filter((id) => template.sections[id]?.type === component.type).length < component.schema.limit;
  });
}

function isEnabledForTemplate(schema: ThemePackageComponentSchema, templateType: string, scope: 'template' | 'group'): boolean {
  const enabledOn = schema.enabled_on;
  const disabledOn = schema.disabled_on;
  if (isRecord(enabledOn)) {
    const allowedValues = enabledOn[scope === 'template' ? 'templates' : 'groups'];
    if (!Array.isArray(allowedValues)) return false;
    const allowed = allowedValues.filter((value): value is string => typeof value === 'string');
    if (!allowed.includes('*') && !allowed.includes(templateType)) return false;
  }
  if (isRecord(disabledOn) && Array.isArray(disabledOn[scope === 'template' ? 'templates' : 'groups'])) {
    const denied = (disabledOn[scope === 'template' ? 'templates' : 'groups'] as unknown[]).filter((value): value is string => typeof value === 'string');
    if (denied.includes('*') || denied.includes(templateType)) return false;
  }
  return true;
}

function createUniqueId(existing: Record<string, unknown>): string {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const id = globalThis.crypto.randomUUID().replaceAll('-', '').slice(0, 12);
    if (!Object.hasOwn(existing, id)) return id;
  }
  throw new Error('Could not create a unique section or block ID.');
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

function defaultSettings(settings: Array<{ id?: string; default?: unknown }> | undefined): Record<string, unknown> {
  return Object.fromEntries((settings ?? [])
    .filter((setting): setting is { id: string; default?: unknown } => Boolean(setting.id) && setting.default !== undefined)
    .map((setting) => [setting.id, setting.default]));
}
