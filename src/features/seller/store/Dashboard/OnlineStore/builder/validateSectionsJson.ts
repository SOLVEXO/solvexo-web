import { SECTION_META_BY_TYPE } from './sectionRegistry';
import { isAppBlockType } from '@/api/services/apps';

export interface SectionsValidationResult {
  /** Real problems — Save/Publish are blocked while any of these exist. */
  errors: string[];
  /** Non-blocking — surfaced so a seller can see it, but never prevents
   *  saving/publishing (see the "unknown section type" case below for why). */
  notices: string[];
}

/**
 * Phase 10 — a real, client-side structural pre-check for the Edit Code
 * workspace's raw JSON, run BEFORE ever sending it to the server. This is
 * deliberately NOT a reimplementation of every per-type rule
 * `section-settings.validator.ts` enforces server-side (required fields,
 * length caps, `oneOf` checks, etc.) — that stays the real, authoritative
 * validator, and duplicating it here would be exactly the kind of
 * "redesign the whole theme engine" this phase was told not to do. This
 * only catches the STRUCTURAL classes of error a seller hand-editing raw
 * JSON can actually introduce: not an array, a settings/blocks field with
 * the wrong shape, a block type not allowed in its section, and a
 * malformed dynamic-source pair — closing the real gap where any of these
 * previously only surfaced as a generic toast after a round trip to the
 * server.
 *
 * "Unknown section type" is deliberately a NOTICE, not an error: this
 * frontend's own `SECTION_META_BY_TYPE` registry is NOT the authoritative
 * list of what the backend accepts — real, backend-validated types can
 * exist with no frontend entry at all until a theme implements a renderer
 * for them (confirmed live against this exact codebase: `feature_list` is
 * a real, `@IsIn`-accepted, fully save/publish-able backend section type
 * with zero frontend renderer anywhere — found via this validator
 * genuinely running against a real store's real Home page during Phase
 * 10's own verification). Hard-blocking Save/Publish on that would break
 * editing for any store whose content already includes one, over a gap
 * this workspace has no way to fix from the frontend alone. The existing,
 * established convention this matches: `PageSectionsEditor.tsx`'s own
 * `SectionCard` already renders a generic icon + the raw type string for
 * exactly this case, without erroring — this validator stays consistent
 * with that, just naming it out loud instead of silently saying nothing.
 *
 * Every check is INDEPENDENT (one bad section doesn't stop the rest from
 * being checked) so a seller sees every real problem at once, not one at a
 * time across repeated failed saves.
 */
export function validateSectionsJson(parsed: unknown): SectionsValidationResult {
  const errors: string[] = [];
  const notices: string[] = [];

  if (!Array.isArray(parsed)) {
    return { errors: ['Must be a JSON array of sections, e.g. [ { "type": "rich_text", ... } ].'], notices };
  }

  parsed.forEach((section, i) => {
    const label = `Section ${i + 1}`;
    if (typeof section !== 'object' || section === null || Array.isArray(section)) {
      errors.push(`${label}: must be an object, not ${describeType(section)}.`);
      return;
    }
    const type = (section as Record<string, unknown>).type;
    if (typeof type !== 'string' || !type) {
      errors.push(`${label}: missing or invalid "type".`);
      return;
    }
    // `meta` undefined means either a genuine typo/hallucinated type, or a
    // real backend type this frontend hasn't built a renderer for yet (see
    // this file's own doc comment) — this validator can't tell those two
    // apart, so it never hard-blocks on it, only informs.
    const meta = SECTION_META_BY_TYPE[type as keyof typeof SECTION_META_BY_TYPE];
    if (!meta) {
      notices.push(`${label}: "${type}" isn't recognized by this editor (check for a typo, or it may be a section type this theme doesn't render yet) — its content, if valid, will be saved but won't visibly render.`);
    }

    const settings = (section as Record<string, unknown>).settings;
    if (settings !== undefined && (typeof settings !== 'object' || settings === null || Array.isArray(settings))) {
      errors.push(`${label} (${type}): "settings" must be an object.`);
    } else if (settings) {
      errors.push(...checkDynamicSourcePair(settings as Record<string, unknown>, `${label} (${type})`));
    }

    const blocks = (section as Record<string, unknown>).blocks;
    if (blocks === undefined) return;
    if (!Array.isArray(blocks)) {
      errors.push(`${label} (${type}): "blocks" must be an array.`);
      return;
    }
    blocks.forEach((block, j) => {
      const blockLabel = `${label} (${type}), block ${j + 1}`;
      if (typeof block !== 'object' || block === null || Array.isArray(block)) {
        errors.push(`${blockLabel}: must be an object, not ${describeType(block)}.`);
        return;
      }
      const blockType = (block as Record<string, unknown>).type;
      if (typeof blockType !== 'string' || !blockType) {
        errors.push(`${blockLabel}: missing or invalid "type".`);
        return;
      }
      if (meta && !isAppBlockType(blockType) && !meta.allowedBlockTypes.includes(blockType)) {
        errors.push(`${blockLabel}: "${blockType}" is not allowed inside a "${type}" section.`);
      }
      const blockSettings = (block as Record<string, unknown>).settings;
      if (blockSettings !== undefined && (typeof blockSettings !== 'object' || blockSettings === null || Array.isArray(blockSettings))) {
        errors.push(`${blockLabel}: "settings" must be an object.`);
      } else if (blockSettings) {
        errors.push(...checkDynamicSourcePair(blockSettings as Record<string, unknown>, blockLabel));
      }
    });
  });

  return { errors, notices };
}

/** Mirrors the backend's `assertDynamicSource` (`section-settings.validator.ts`)
 *  — `dynamicSourceNamespace`/`dynamicSourceKey` must both be set, or both left blank. */
function checkDynamicSourcePair(settings: Record<string, unknown>, label: string): string[] {
  const hasNamespace = settings.dynamicSourceNamespace !== undefined && settings.dynamicSourceNamespace !== null && settings.dynamicSourceNamespace !== '';
  const hasKey = settings.dynamicSourceKey !== undefined && settings.dynamicSourceKey !== null && settings.dynamicSourceKey !== '';
  if (hasNamespace !== hasKey) {
    return [`${label}: dynamicSourceNamespace and dynamicSourceKey must both be set, or both left blank.`];
  }
  return [];
}

function describeType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'an array';
  return typeof value;
}
