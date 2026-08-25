import type { LucideIcon } from 'lucide-react';
import type { FieldSchema } from './sectionSchemaRegistry';

/**
 * The block-level counterpart to `sectionSchemaRegistry.ts` — replaces
 * `BlockFields.tsx`'s hand-written `switch (type)` settings form with one
 * generic `<SchemaForm>` render, the same way section settings work. A
 * block's render behavior (how it actually looks on the storefront) is
 * unchanged — it's still whatever the owning `SectionRenderFn` does with its
 * `blocks` array — only the BUILDER-SIDE settings form is now schema-driven.
 */
export interface BlockSchema {
  type: string;
  label: string;
  icon?: LucideIcon;
  fields: FieldSchema[];
}

const registry = new Map<string, BlockSchema>();

export function registerBlockSchema(schema: BlockSchema): void {
  if (registry.has(schema.type)) {
    throw new Error(`Block schema for "${schema.type}" is already registered.`);
  }
  registry.set(schema.type, schema);
}

export function getBlockSchema(type: string): BlockSchema | undefined {
  return registry.get(type);
}

export function listBlockSchemas(): BlockSchema[] {
  return Array.from(registry.values());
}
