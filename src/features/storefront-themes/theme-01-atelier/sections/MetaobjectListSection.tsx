import { useEffect, useState } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicMetaobjectEntriesByType, type MetaobjectEntry } from '@/api/services/metaobjects';
import { atelierTheme as t, type AtelierSectionColors } from '../theme.config';
import { registerAtelierSection } from './atelierSectionRenderer';

/** One real Metaobject entry (e.g. one Team Member) rendered as a plain card
 *  — `displayName` as the heading, then every `{key, value}` field pair as a
 *  labeled row underneath. There's no field TYPE available here (only what
 *  `MetaobjectEntry.fields` carries), so every value renders as plain text —
 *  a `url`-typed field's raw value just shows as text in this v1, an honest
 *  scope limit rather than something to over-engineer around. */
function EntryCard({ entry, colors }: { entry: MetaobjectEntry; colors: AtelierSectionColors }) {
  return (
    <div className="flex flex-col gap-3" style={{ border: `1px solid ${colors.border}`, padding: '24px' }}>
      <p style={{ fontFamily: t.fonts.display, fontSize: '17px', fontWeight: 600, color: colors.ink }}>{entry.displayName}</p>
      {entry.fields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {entry.fields.map(f => (
            <div key={f.key} className="flex items-baseline gap-2">
              <span style={{ fontFamily: t.fonts.body, fontSize: '11px', fontWeight: 600, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.key}</span>
              <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.ink, wordBreak: 'break-word' }}>{f.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaobjectListSection({ section, colors }: { section: Section; colors: AtelierSectionColors }) {
  const { store } = useStorefront();
  const metaobjectType = section.settings.metaobjectType as string | undefined;
  const [entries, setEntries] = useState<MetaobjectEntry[] | null>(null);

  useEffect(() => {
    if (!metaobjectType) { setEntries([]); return; }
    setEntries(null);
    apiGetPublicMetaobjectEntriesByType(store.storeId, metaobjectType)
      .then(res => setEntries(res.data))
      .catch(() => setEntries([]));
  }, [store.storeId, metaobjectType]);

  if (entries !== null && entries.length === 0) return null;

  return (
    <div style={{ padding: `${t.layout.sectionPadY} ${t.layout.containerPadX}` }}>
      <div className="mx-auto" style={{ maxWidth: t.layout.maxWidth }}>
        {section.settings.heading && (
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 600, color: colors.ink, marginBottom: '36px', textAlign: 'center' }}>
            {section.settings.heading}
          </h2>
        )}
        {entries === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3" style={{ border: `1px solid ${colors.border}`, padding: '24px' }}>
                <div className="h-4 w-2/3" style={{ background: colors.bgAlt }} />
                <div className="h-3 w-full" style={{ background: colors.bgAlt }} />
                <div className="h-3 w-3/4" style={{ background: colors.bgAlt }} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {entries.map(entry => <EntryCard key={entry._id} entry={entry} colors={colors} />)}
          </div>
        )}
      </div>
    </div>
  );
}

registerAtelierSection('metaobject_list', (section: Section, _blocks, colors: AtelierSectionColors) => <MetaobjectListSection section={section} colors={colors} />);
