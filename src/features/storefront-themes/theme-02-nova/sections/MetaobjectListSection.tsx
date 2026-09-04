import { useEffect, useState } from 'react';
import type { Section } from '@/api/services/storefrontTypes';
import { useStorefront } from '@/features/storefront/StorefrontContext';
import { apiGetPublicMetaobjectEntriesByType, type MetaobjectEntry } from '@/api/services/metaobjects';
import { novaTheme as t, type NovaSectionColors } from '../theme.config';
import { registerNovaSection } from './novaSectionRenderer';

/** Nova's port of Atelier's `MetaobjectListSection` — same real
 *  `apiGetPublicMetaobjectEntriesByType` data source and
 *  `section.settings.metaobjectType` shape, Nova's own rounded/filled card
 *  chrome instead of Atelier's bordered squares. There's no field TYPE
 *  available here (only what `MetaobjectEntry.fields` carries), so every
 *  value renders as plain text — an honest v1 scope limit, not a bug. */
function EntryCard({ entry, colors }: { entry: MetaobjectEntry; colors: NovaSectionColors }) {
  return (
    <div className="flex flex-col gap-3" style={{ background: colors.bgAlt, borderRadius: t.radius.md, padding: '24px' }}>
      <p style={{ fontFamily: t.fonts.display, fontSize: '17px', fontWeight: 700, color: colors.ink }}>{entry.displayName}</p>
      {entry.fields.length > 0 && (
        <div className="flex flex-col gap-1.5">
          {entry.fields.map(f => (
            <div key={f.key} className="flex items-baseline gap-2">
              <span style={{ fontFamily: t.fonts.body, fontSize: '11px', fontWeight: 700, color: colors.inkMuted, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.key}</span>
              <span style={{ fontFamily: t.fonts.body, fontSize: '13px', color: colors.ink, wordBreak: 'break-word' }}>{f.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetaobjectListSection({ section, colors }: { section: Section; colors: NovaSectionColors }) {
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
          <h2 style={{ fontFamily: t.fonts.display, fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: colors.ink, marginBottom: '36px', textAlign: 'center' }}>
            {section.settings.heading}
          </h2>
        )}
        {entries === null ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex flex-col gap-3" style={{ background: colors.bgAlt, borderRadius: t.radius.md, padding: '24px' }}>
                <div className="h-4 w-2/3" style={{ background: colors.bg }} />
                <div className="h-3 w-full" style={{ background: colors.bg }} />
                <div className="h-3 w-3/4" style={{ background: colors.bg }} />
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

registerNovaSection('metaobject_list', (section: Section, _blocks, colors: NovaSectionColors) => <MetaobjectListSection section={section} colors={colors} />);
