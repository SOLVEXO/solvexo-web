import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Eye, EyeOff, Plus, Trash2 } from 'lucide-react';
import { apiGetStoreInventory } from '@/api/services/product';
import { apiListCollections } from '@/api/services/collections';
import { apiListStorePages } from '@/api/services/storePages';
import { apiListBlogs, apiListBlogPosts } from '@/api/services/storeBlog';
import { apiListMenus } from '@/api/services/menus';
import type { ThemePackageComponentSchema, ThemePackageStructure } from '@/api/services/storeTheme';
import {
  addLiquidBlock,
  addLiquidSection,
  getAddableLiquidSections,
  moveLiquidBlock,
  moveLiquidSection,
  parseLiquidJsonTemplate,
  parseLiquidThemeSettingsData,
  removeLiquidBlock,
  removeLiquidSection,
  setLiquidBlockDisabled,
  setLiquidSectionDisabled,
  updateLiquidSettings,
  updateLiquidThemeSetting,
  type LiquidJsonTemplate,
  type LiquidTemplateSection,
} from './shopifyTemplateEditor.utils';

type ThemeSettingSchema = {
  id?: string;
  type?: string;
  label?: string;
  default?: unknown;
  options?: Array<{ value?: string; label?: string }>;
  min?: number;
  max?: number;
  step?: number;
  [key: string]: unknown;
};
type ThemeEditorFile = { path: string; encoding?: 'utf8' | 'base64'; content?: string };
type ResourceKind = 'product' | 'collection' | 'page' | 'blog' | 'article' | 'link_list';
type ResourceChoice = { id: string; label: string };

export function ShopifyTemplateEditor({
  storeId,
  structure,
  files,
  selectedPath,
  currentContent,
  dirty,
  onSelectFile,
  onChange,
}: {
  storeId: string;
  structure: ThemePackageStructure;
  files: ThemeEditorFile[];
  selectedPath: string;
  currentContent: string;
  dirty: boolean;
  onSelectFile: (path: string, content: string) => void;
  onChange: (content: string) => void;
}) {
  const templatePaths = useMemo(
    () => structure.templates.filter((path) => path.endsWith('.json') && !path.startsWith('config/')),
    [structure.templates],
  );
  const sectionGroupPaths = structure.sectionGroups ?? [];
  const documentPaths = [...templatePaths, ...sectionGroupPaths];
  const initialPath = documentPaths.includes(selectedPath) ? selectedPath : documentPaths[0] ?? '';
  const [templatePath, setTemplatePath] = useState(initialPath);
  const [view, setView] = useState<'template' | 'settings'>('template');
  const [localError, setLocalError] = useState('');
  const [resourceChoices, setResourceChoices] = useState<Record<ResourceKind, ResourceChoice[]>>({
    product: [], collection: [], page: [], blog: [], article: [], link_list: [],
  });
  const [resourceLoading, setResourceLoading] = useState(true);
  const [resourceError, setResourceError] = useState('');
  const [resourceRetry, setResourceRetry] = useState(0);
  const templateFile = files.find((file) => file.path === templatePath && file.encoding === 'utf8');
  const templateContent = selectedPath === templatePath ? currentContent : templateFile?.content;
  const settingsPath = files.find((file) => file.path.toLowerCase() === 'config/settings_data.json' && file.encoding === 'utf8')?.path;
  const settingsFile = files.find((file) => file.path === settingsPath);
  const settingsContent = selectedPath.toLowerCase() === 'config/settings_data.json' ? currentContent : settingsFile?.content;
  const parsed = useMemo(() => {
    if (!templateContent) return null;
    try {
      return parseLiquidJsonTemplate(templateContent);
    } catch (error) {
      return error instanceof Error ? error : new Error('Could not read this JSON template.');
    }
  }, [templateContent]);
  const parsedSettings = useMemo(() => {
    if (view !== 'settings' || !settingsContent) return null;
    try {
      return parseLiquidThemeSettingsData(settingsContent);
    } catch (error) {
      return error instanceof Error ? error : new Error('Could not read theme settings data.');
    }
  }, [settingsContent, view]);

  const isSectionGroup = sectionGroupPaths.includes(templatePath);
  const templateType = isSectionGroup && parsed && !(parsed instanceof Error) && typeof parsed.type === 'string'
    ? parsed.type
    : templatePath.split('/').pop()?.replace(/\.json$/i, '').split('.')[0] ?? '';
  const availableSections = parsed && !(parsed instanceof Error)
    ? getAddableLiquidSections(parsed, structure, templateType, isSectionGroup ? 'group' : 'template')
    : [];
  const sectionDefinitions = useMemo(
    () => new Map(structure.components.filter((item) => item.kind === 'section').map((item) => [item.type, item.schema])),
    [structure.components],
  );
  const themeAssets = useMemo(
    () => files.filter((file) => file.path.toLowerCase().startsWith('assets/')),
    [files],
  );
  useEffect(() => {
    let cancelled = false;
    setResourceLoading(true);
    setResourceError('');
    Promise.allSettled([
      loadStoreProducts(storeId),
      apiListCollections(storeId).then((response) => response.data ?? []),
      apiListStorePages(storeId).then((response) => response.data ?? []),
      apiListBlogs(storeId).then((response) => response.data ?? []),
      apiListBlogPosts(storeId).then((response) => response.data ?? []),
      apiListMenus(storeId).then((response) => response.data ?? []),
    ]).then((results) => {
      if (cancelled) return;
      const [products, collections, pages, blogs, articles, menus] = results;
      const resolvedCount = results.filter((result) => result.status === 'fulfilled').length;
      setResourceChoices({
        product: products.status === 'fulfilled' ? products.value : [],
        collection: collections.status === 'fulfilled' ? collections.value.filter((item) => item.status === 'active').map((item) => ({ id: item._id, label: item.name })) : [],
        page: pages.status === 'fulfilled' ? pages.value.filter((item) => item.status === 'published').map((item) => ({ id: item._id, label: `${item.title} · /pages/${item.slug}` })) : [],
        blog: blogs.status === 'fulfilled' ? blogs.value.map((item) => ({ id: item._id, label: `${item.title} · /blogs/${item.slug}` })) : [],
        article: articles.status === 'fulfilled' ? articles.value.filter((item) => item.status === 'published').map((item) => ({ id: item._id, label: item.title })) : [],
        link_list: menus.status === 'fulfilled' ? menus.value.map((item) => ({ id: item._id, label: item.name })) : [],
      });
      if (resolvedCount === 0) setResourceError('Could not load this store’s theme resources.');
      else if (resolvedCount < results.length) setResourceError('Some theme resources could not be loaded; other resource types remain available.');
      setResourceLoading(false);
    });
    return () => { cancelled = true; };
  }, [storeId, resourceRetry]);
  const retryResources = () => setResourceRetry((attempt) => attempt + 1);

  const commit = (next: LiquidJsonTemplate) => {
    onChange(`${JSON.stringify(next, null, 2)}\n`);
    setLocalError('');
  };
  const update = (action: (template: LiquidJsonTemplate) => LiquidJsonTemplate) => {
    if (!parsed || parsed instanceof Error) return;
    try {
      commit(action(parsed));
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : 'Could not update this template.');
    }
  };
  const selectTemplate = (path: string) => {
    if (dirty && !window.confirm('Discard unsaved edits in this theme document?')) return;
    setTemplatePath(path);
    setView('template');
    const file = files.find((item) => item.path === path);
    if (file?.encoding === 'utf8') onSelectFile(path, file.content ?? '');
    setLocalError('');
  };
  const selectSettings = () => {
    if (dirty && !window.confirm('Discard unsaved edits before switching to theme settings?')) return;
    setView('settings');
    if (!settingsPath || !settingsFile) {
      setLocalError('This ZIP has no config/settings_data.json file. Add it in Files before editing global theme settings.');
      return;
    }
    setLocalError('');
    onSelectFile(settingsPath, settingsFile.content ?? '');
  };
  const updateThemeSetting = (settingId: string, value: unknown) => {
    if (!parsedSettings || parsedSettings instanceof Error) return;
    onChange(`${JSON.stringify(updateLiquidThemeSetting(parsedSettings, settingId, value), null, 2)}\n`);
    setLocalError('');
  };

  return <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto">
    {resourceError && <div role="status" className="flex items-center justify-between gap-3 rounded border border-bone bg-cream px-3 py-2 text-[10px] text-slate">
      <span>{resourceError}</span>
      <button type="button" onClick={retryResources} className="shrink-0 rounded border border-bone bg-white px-2 py-1 text-charcoal">Retry resources</button>
    </div>}
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => setView('template')} className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold ${view === 'template' ? 'border-charcoal bg-charcoal text-white' : 'border-bone bg-white text-charcoal'}`}>Templates</button>
      <button type="button" onClick={selectSettings} className={`rounded-lg border px-2 py-1.5 text-[10px] font-semibold ${view === 'settings' ? 'border-charcoal bg-charcoal text-white' : 'border-bone bg-white text-charcoal'}`}>Theme settings</button>
    </div>
    {view === 'template' && <div className="flex items-center gap-2">
      <label htmlFor="shopify-template-select" className="text-[11px] font-semibold text-charcoal">Template or section group</label>
      <select id="shopify-template-select" value={templatePath} onChange={(event) => selectTemplate(event.target.value)} className="min-w-0 flex-1 rounded-lg border border-bone bg-white px-2 py-1.5 text-[11px]">
        {templatePaths.map((path) => <option key={path} value={path}>Template · {path}</option>)}
        {sectionGroupPaths.map((path) => <option key={path} value={path}>Section group · {path}</option>)}
      </select>
    </div>}
    <p className="m-0 rounded-lg bg-cream p-2 text-[10px] leading-relaxed text-slate">
      Edits update this revision&apos;s JSON template. Save source to create a revision; this does not publish or change the live storefront.
    </p>
    {localError && <p role="alert" className="m-0 rounded-lg bg-error-bg p-2 text-[11px] text-error">{localError}</p>}
    {view === 'template' && !documentPaths.length && <p className="m-0 text-[11px] text-slate">This package has no JSON templates or section groups. Liquid templates need conversion to JSON templates before sections can be arranged here.</p>}
    {view === 'template' && templateFile && parsed instanceof Error && <p role="alert" className="m-0 rounded-lg bg-error-bg p-2 text-[11px] text-error">{parsed.message} Correct the JSON in the Files tab before using this editor.</p>}
    {view === 'template' && templateFile && parsed && !(parsed instanceof Error) && <>
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate">{isSectionGroup ? 'Group sections' : 'Template sections'} ({parsed.order.length}/25)</p>
        <select
          aria-label="Add section"
          value=""
          disabled={availableSections.length === 0 || parsed.order.length >= 25}
          onChange={(event) => {
            if (event.target.value) {
              const [sectionType, rawPresetIndex] = event.target.value.split('::');
              const presetIndex = Number(rawPresetIndex);
              update((current) => addLiquidSection(
                current, structure, sectionType, templateType, isSectionGroup ? 'group' : 'template',
                Number.isInteger(presetIndex) ? presetIndex : 0,
              ));
            }
            event.target.value = '';
          }}
          className="max-w-[180px] rounded-lg border border-bone bg-white px-2 py-1.5 text-[10px] disabled:opacity-50"
        >
          <option value=""><Plus size={12} /> Add section…</option>
          {availableSections.flatMap((component) => (component.schema.presets ?? []).map((preset, index) => (
            <option key={`${component.type}::${index}`} value={`${component.type}::${index}`}>
              {component.schema.name}{component.schema.presets!.length > 1 ? ` · ${preset.name ?? `Preset ${index + 1}`}` : ''}
            </option>
          )))}
        </select>
      </div>
      {parsed.order.length === 0 && <p className="m-0 text-[11px] text-slate">No sections are configured in this template.</p>}
      {parsed.order.map((sectionId, index) => {
        const section = parsed.sections[sectionId];
        const schema = sectionDefinitions.get(section.type);
        if (!section || !schema) return <p key={sectionId} role="alert" className="m-0 rounded-lg bg-cream p-2 text-[10px] text-slate">Section <code>{section?.type ?? sectionId}</code> is not present in the package schema and can only be edited in Files.</p>;
        return <SectionEditor
          key={sectionId}
          id={sectionId}
          index={index}
          count={parsed.order.length}
          section={section}
          schema={schema}
          assets={themeAssets}
          resources={resourceChoices}
          resourceLoading={resourceLoading}
          onRetryResources={retryResources}
          onUpdate={(nextSection) => update((current) => ({ ...current, sections: { ...current.sections, [sectionId]: nextSection } }))}
          onToggleVisibility={() => update((current) => setLiquidSectionDisabled(current, sectionId, !section.disabled))}
          onMove={(offset) => update((current) => moveLiquidSection(current, sectionId, offset))}
          onRemove={() => update((current) => removeLiquidSection(current, sectionId))}
        />;
      })}
    </>}
    {view === 'template' && !templateFile && documentPaths.length > 0 && <p className="m-0 text-[11px] text-slate">Select a text-encoded JSON theme document to edit its sections.</p>}
    {view === 'settings' && parsedSettings instanceof Error && <p role="alert" className="m-0 rounded-lg bg-error-bg p-2 text-[11px] text-error">{parsedSettings.message} Correct the settings data in Files before editing.</p>}
    {view === 'settings' && parsedSettings && !(parsedSettings instanceof Error) && (structure.themeSettings.length ? structure.themeSettings.map((group, groupIndex) => <section key={`${group.name ?? 'group'}-${groupIndex}`} className="rounded-xl border border-bone p-3">
      <h3 className="m-0 mb-2 text-[12px] font-semibold text-charcoal">{group.name ?? 'Theme settings'}</h3>
      <SettingsEditor
        settings={(group.settings ?? []) as ThemeSettingSchema[]}
        values={parsedSettings.current}
        assets={themeAssets}
        resources={resourceChoices}
        resourceLoading={resourceLoading}
        onRetryResources={retryResources}
        onChange={updateThemeSetting}
      />
    </section>) : <p className="m-0 text-[11px] text-slate">This theme does not define global settings in <code>config/settings_schema.json</code>.</p>)}
  </div>;
}

function SectionEditor({
  id,
  index,
  count,
  section,
  schema,
  assets,
  resources,
  resourceLoading,
  onRetryResources,
  onUpdate,
  onToggleVisibility,
  onMove,
  onRemove,
}: {
  id: string;
  index: number;
  count: number;
  section: LiquidTemplateSection;
  schema: ThemePackageComponentSchema;
  assets: ThemeEditorFile[];
  resources: Record<ResourceKind, ResourceChoice[]>;
  resourceLoading: boolean;
  onRetryResources: () => void;
  onUpdate: (section: LiquidTemplateSection) => void;
  onToggleVisibility: () => void;
  onMove: (offset: -1 | 1) => void;
  onRemove: () => void;
}) {
  const blockDefinitions = schema.blocks ?? [];
  const blockOrder = section.block_order ?? Object.keys(section.blocks ?? {});
  const [blockError, setBlockError] = useState('');
  const updateSafely = (next: LiquidTemplateSection) => {
    onUpdate(next);
    setBlockError('');
  };

  return <section className="rounded-xl border border-bone p-3">
    <div className="flex items-center gap-2">
      <div className="min-w-0 flex-1">
        <p className="m-0 truncate text-[12px] font-semibold text-charcoal">{schema.name}</p>
          <p className="m-0 mt-0.5 truncate text-[10px] text-slate">{section.type} · {id}{section.disabled ? ' · Hidden' : ''}</p>
      </div>
        <button
          type="button"
          aria-label={`${section.disabled ? 'Show' : 'Hide'} ${schema.name}`}
          aria-pressed={section.disabled === true}
          title={section.disabled ? 'Show section' : 'Hide section'}
          onClick={onToggleVisibility}
          className="rounded border border-bone bg-white p-1"
        >{section.disabled ? <Eye size={13} /> : <EyeOff size={13} />}</button>
      <button type="button" aria-label={`Move ${schema.name} up`} title="Move up" disabled={index === 0} onClick={() => onMove(-1)} className="rounded border border-bone bg-white p-1 disabled:opacity-40"><ChevronUp size={13} /></button>
      <button type="button" aria-label={`Move ${schema.name} down`} title="Move down" disabled={index === count - 1} onClick={() => onMove(1)} className="rounded border border-bone bg-white p-1 disabled:opacity-40"><ChevronDown size={13} /></button>
      <button type="button" aria-label={`Remove ${schema.name}`} title="Remove section" onClick={onRemove} className="rounded border border-bone bg-white p-1 text-error"><Trash2 size={13} /></button>
    </div>
    {section.disabled !== true && <SettingsEditor
      settings={schema.settings ?? []}
      values={section.settings ?? {}}
      assets={assets}
      resources={resources}
      resourceLoading={resourceLoading}
      onRetryResources={onRetryResources}
      onChange={(id, value) => onUpdate({ ...section, settings: updateLiquidSettings(section.settings, id, value) })}
    />}
    {blockDefinitions.length > 0 && <div className="mt-3 border-t border-bone pt-3">
      <div className="flex items-center justify-between gap-2">
        <p className="m-0 text-[10px] font-bold uppercase tracking-wide text-slate">Blocks ({blockOrder.length}/{Math.min(schema.max_blocks ?? 50, 50)})</p>
        <select
          aria-label={`Add block to ${schema.name}`}
          value=""
          disabled={blockOrder.length >= Math.min(schema.max_blocks ?? 50, 50) || !blockDefinitions.some((block) => block.type && (
            typeof block.limit !== 'number' || blockOrder.filter((blockId) => section.blocks?.[blockId]?.type === block.type).length < block.limit
          ))}
          onChange={(event) => {
            const type = event.target.value;
            if (!type) return;
            try {
              updateSafely(addLiquidBlock(section, schema, type));
            } catch (error) {
              setBlockError(error instanceof Error ? error.message : 'Could not add this block.');
            }
          }}
          className="max-w-[160px] rounded-lg border border-bone bg-white px-2 py-1 text-[10px]"
        >
          <option value="">Add block…</option>
          {blockDefinitions.filter((block) => block.type).map((block) => {
            const count = blockOrder.filter((blockId) => section.blocks?.[blockId]?.type === block.type).length;
            const limitReached = typeof block.limit === 'number' && count >= block.limit;
            return <option key={block.type} value={block.type} disabled={limitReached}>{block.name ?? block.type}{limitReached ? ' (limit reached)' : ''}</option>;
          })}
        </select>
      </div>
      {blockError && <p role="alert" className="m-0 mt-2 text-[10px] text-error">{blockError}</p>}
      {blockOrder.map((blockId, blockIndex) => {
        const block = section.blocks?.[blockId];
        if (!block) return null;
        const definition = blockDefinitions.find((item) => item.type === block.type);
        return <div key={blockId} className="mt-2 rounded-lg bg-cream p-2">
          <div className="flex items-center gap-1">
            <p className="m-0 min-w-0 flex-1 truncate text-[10px] font-semibold text-charcoal">{definition?.name ?? block.type}{block.disabled ? ' · Hidden' : ''}</p>
            <button type="button" aria-label={`${block.disabled ? 'Show' : 'Hide'} block ${blockIndex + 1}`} aria-pressed={block.disabled === true} title={block.disabled ? 'Show block' : 'Hide block'} onClick={() => updateSafely(setLiquidBlockDisabled(section, blockId, !block.disabled))} className="rounded border border-bone bg-white p-1">{block.disabled ? <Eye size={12} /> : <EyeOff size={12} />}</button>
            <button type="button" aria-label={`Move block ${blockIndex + 1} up`} disabled={blockIndex === 0} onClick={() => updateSafely(moveLiquidBlock(section, blockId, -1))} className="rounded border border-bone bg-white p-1 disabled:opacity-40"><ChevronUp size={12} /></button>
            <button type="button" aria-label={`Move block ${blockIndex + 1} down`} disabled={blockIndex === blockOrder.length - 1} onClick={() => updateSafely(moveLiquidBlock(section, blockId, 1))} className="rounded border border-bone bg-white p-1 disabled:opacity-40"><ChevronDown size={12} /></button>
            <button type="button" aria-label={`Remove block ${blockIndex + 1}`} onClick={() => updateSafely(removeLiquidBlock(section, blockId))} className="rounded border border-bone bg-white p-1 text-error"><Trash2 size={12} /></button>
          </div>
          {definition && <SettingsEditor
            settings={definition.settings ?? []}
            values={block.settings ?? {}}
            assets={assets}
            resources={resources}
            resourceLoading={resourceLoading}
            onRetryResources={onRetryResources}
            onChange={(settingId, value) => onUpdate({
              ...section,
              blocks: {
                ...section.blocks,
                [blockId]: { ...block, settings: updateLiquidSettings(block.settings, settingId, value) },
              },
            })}
          />}
        </div>;
      })}
    </div>}
  </section>;
}

function SettingsEditor({
  settings,
  values,
  assets,
  resources,
  resourceLoading,
  onRetryResources,
  onChange,
}: {
  settings: Array<{ id?: string; type?: string; label?: string; [key: string]: unknown }>;
  values: Record<string, unknown>;
  assets: ThemeEditorFile[];
  resources: Record<ResourceKind, ResourceChoice[]>;
  resourceLoading: boolean;
  onRetryResources: () => void;
  onChange: (id: string, value: unknown) => void;
}) {
  const visibleSettings = settings.filter((setting): setting is ThemeSettingSchema & { id: string } => Boolean(setting.id) && setting.type !== 'header' && setting.type !== 'paragraph');
  if (!visibleSettings.length) return null;
  return <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
    {visibleSettings.map((setting) => {
      const id = setting.id;
      const type = setting.type ?? '';
      const value = Object.hasOwn(values, id) ? values[id] : setting.default ?? '';
      const label = setting.label ?? id;
      const resourceKind = getResourceKind(type);
      if (resourceKind) return <ResourceSettingEditor
        key={id}
        id={id}
        label={label}
        type={type}
        value={value}
        choices={resources[resourceKind]}
        loading={resourceLoading}
        onRetry={onRetryResources}
        onChange={onChange}
      />;
      if (type === 'checkbox') return <label key={id} className="flex items-center gap-2 text-[10px] text-charcoal">
        <input type="checkbox" checked={Boolean(value)} onChange={(event) => onChange(id, event.target.checked)} />{label}
      </label>;
      if (type === 'select' || type === 'radio') return <label key={id} className="flex flex-col gap-1 text-[10px] text-slate">
        {label}<select value={String(value)} onChange={(event) => onChange(id, event.target.value)} className="rounded border border-bone bg-white px-2 py-1 text-[11px]">
          {(setting.options ?? []).map((option) => <option key={option.value} value={option.value}>{option.label ?? option.value}</option>)}
        </select>
      </label>;
      if (type === 'image_picker' || type === 'video') {
        const allowedAssets = assets.filter((file) => type === 'video'
          ? /\.(?:mp4|webm)$/i.test(file.path)
          : /\.(?:png|jpe?g|webp|avif|gif|svg)$/i.test(file.path));
        const currentValue = typeof value === 'string'
          ? value
          : value && typeof value === 'object'
            ? String((value as Record<string, unknown>).src ?? (value as Record<string, unknown>).url ?? '')
            : '';
        return <label key={id} className="flex flex-col gap-1 text-[10px] text-slate">
          {label}
          <select value={currentValue} onChange={(event) => onChange(id, event.target.value)} className="min-w-0 rounded border border-bone bg-white px-2 py-1.5 text-[11px]">
            <option value="">Select a theme {type === 'video' ? 'video' : 'image'}…</option>
            {currentValue && !allowedAssets.some((asset) => asset.path === currentValue) && <option value={currentValue}>{currentValue}</option>}
            {allowedAssets.map((asset) => <option key={asset.path} value={asset.path}>{asset.path.replace(/^assets\//i, '')}</option>)}
          </select>
          {type === 'image_picker' && currentValue && <span className="flex items-center gap-2 text-[10px] text-slate">
            <span className="h-10 w-10 overflow-hidden rounded border border-bone bg-white">
                  <img src={resolveEditorAssetUrl(assets, currentValue)} alt="" className="h-full w-full object-contain" />
            </span>
            Theme asset selection
          </span>}
          {allowedAssets.length === 0 && <span className="text-[10px] text-slate">No matching theme assets are included in this ZIP.</span>}
        </label>;
      }
      if (['text', 'textarea', 'richtext', 'inline_richtext', 'html', 'liquid', 'url', 'video_url', 'font_picker', 'color_scheme', 'color_scheme_group', 'metaobject', 'metaobject_list'].includes(type)) {
        const multiline = ['textarea', 'richtext', 'html'].includes(type);
        return <label key={id} className="flex flex-col gap-1 text-[10px] text-slate">
          {label}
          {multiline || type === 'liquid' ? <textarea value={String(value ?? '')} onChange={(event) => onChange(id, event.target.value)} rows={type === 'liquid' ? 5 : 3} className="rounded border border-bone bg-white px-2 py-1.5 text-[11px]" />
            : <input
              type="text"
              value={String(value ?? '')}
              placeholder={type === 'font_picker' ? 'Font family or Shopify font ID' : undefined}
              onChange={(event) => onChange(id, event.target.value)}
              className="min-w-0 rounded border border-bone bg-white px-2 py-1.5 text-[11px]"
            />}
        </label>;
      }
      if (['color', 'color_background'].includes(type)) {
        const colorValue = String(value ?? '');
        const isHexColor = /^#[0-9a-f]{6}$/i.test(colorValue);
        return <label key={id} className="flex flex-col gap-1 text-[10px] text-slate">
          {label}
          <span className="flex gap-2">
            <input type="text" value={colorValue} onChange={(event) => onChange(id, event.target.value)} placeholder="Color, CSS value, or gradient" className="min-w-0 flex-1 rounded border border-bone bg-white px-2 py-1.5 text-[11px]" />
            {type === 'color' && <input type="color" aria-label={`${label} color picker`} value={isHexColor ? colorValue : '#000000'} onChange={(event) => onChange(id, event.target.value)} />}
          </span>
        </label>;
      }
      if (['number', 'range'].includes(type)) {
        const numericValue = Number(value ?? setting.min ?? 0);
        const onNumericChange = (rawValue: string) => {
          const nextValue = Number(rawValue);
          if (!Number.isFinite(nextValue)) return;
          onChange(id, Math.max(Number(setting.min ?? -Infinity), Math.min(Number(setting.max ?? Infinity), nextValue)));
        };
        return <label key={id} className="flex flex-col gap-1 text-[10px] text-slate">
          {label}
          <input
            type={type}
            value={Number.isFinite(numericValue) ? numericValue : 0}
              min={setting.min}
              max={setting.max}
              step={setting.step}
              onChange={(event) => onNumericChange(event.target.value)}
              className="min-w-0 rounded border border-bone bg-white px-2 py-1.5 text-[11px]"
            />
        </label>;
      }
      if (type === 'text_alignment') return <label key={id} className="flex flex-col gap-1 text-[10px] text-slate">
        {label}<select value={String(value)} onChange={(event) => onChange(id, event.target.value)} className="rounded border border-bone bg-white px-2 py-1 text-[11px]">
          {['left', 'center', 'right'].map((alignment) => <option key={alignment} value={alignment}>{alignment}</option>)}
        </select>
      </label>;
      return <p key={id} className="m-0 rounded bg-cream p-2 text-[10px] text-slate">{label}: <span className="text-charcoal">{String(value || '—')}</span> · edit this Shopify setting type in the Files tab</p>;
    })}
  </div>;
}

function ResourceSettingEditor({
  id,
  label,
  type,
  value,
  choices,
  loading,
  onRetry,
  onChange,
}: {
  id: string;
  label: string;
  type: string;
  value: unknown;
  choices: ResourceChoice[];
  loading: boolean;
  onRetry: () => void;
  onChange: (id: string, value: unknown) => void;
}) {
  const [search, setSearch] = useState('');
  const isMultiple = type.endsWith('_list');
  const selected = Array.isArray(value) ? value.map(String) : value ? [String(value)] : [];
  const visibleChoices = choices.filter((choice) => choice.label.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  const missingChoices = selected.filter((idValue) => !choices.some((choice) => choice.id === idValue));
  const toggle = (choiceId: string) => {
    if (isMultiple) {
      onChange(id, selected.includes(choiceId) ? selected.filter((item) => item !== choiceId) : [...selected, choiceId]);
    } else {
      onChange(id, selected[0] === choiceId ? '' : choiceId);
    }
  };
  return <fieldset className="min-w-0 rounded border border-bone p-2 text-[10px] text-slate">
    <legend className="px-1">{label}</legend>
    <input
      aria-label={`Search ${type.replace(/_/g, ' ')}`}
      type="search"
      value={search}
      onChange={(event) => setSearch(event.target.value)}
      placeholder={`Search ${type.replace(/_/g, ' ')}…`}
      className="mb-2 w-full rounded border border-bone bg-white px-2 py-1.5 text-[11px]"
    />
    {loading ? <p className="m-0 py-2">Loading this store’s resources…</p>
      : choices.length === 0 ? <div className="flex items-center justify-between gap-2">
        <span>No {type.replace(/_/g, ' ')} resources found.</span>
        <button type="button" onClick={onRetry} className="rounded border border-bone bg-white px-2 py-1">Retry</button>
      </div>
        : <div className="max-h-40 space-y-1 overflow-y-auto">
          {missingChoices.map((missing) => <label key={missing} className="flex items-center gap-2 text-slate">
            <input type={isMultiple ? 'checkbox' : 'radio'} checked={selected.includes(missing)} onChange={() => toggle(missing)} />
            <span className="min-w-0 truncate">Current selection unavailable: {missing}</span>
          </label>)}
          {visibleChoices.map((choice) => <label key={choice.id} className="flex cursor-pointer items-center gap-2 rounded px-1 py-1 hover:bg-cream">
            <input
              type={isMultiple ? 'checkbox' : 'radio'}
              name={`resource-${id}`}
              checked={selected.includes(choice.id)}
              onChange={() => toggle(choice.id)}
            />
            <span className="min-w-0 truncate">{choice.label}</span>
          </label>)}
          {visibleChoices.length === 0 && <p className="m-0 py-2">No matches.</p>}
        </div>}
    <p className="mb-0 mt-2 text-[10px] text-slate">{isMultiple ? `${selected.length} selected` : selected.length ? '1 selected' : 'None selected'}</p>
  </fieldset>;
}

function getResourceKind(type: string): ResourceKind | null {
  if (type === 'product' || type === 'product_list') return 'product';
  if (type === 'collection' || type === 'collection_list') return 'collection';
  if (type === 'page') return 'page';
  if (type === 'blog' || type === 'blog_list') return 'blog';
  if (type === 'article') return 'article';
  if (type === 'link_list') return 'link_list';
  return null;
}

async function loadStoreProducts(storeId: string): Promise<ResourceChoice[]> {
  const firstPage = await apiGetStoreInventory(storeId, 1, 100);
  const pages = firstPage.data.pagination.totalPages;
  const results = [firstPage.data];
  for (let page = 2; page <= pages; page += 10) {
    const pageResults = await Promise.all(
      Array.from({ length: Math.min(10, pages - page + 1) }, (_, index) =>
        apiGetStoreInventory(storeId, page + index, 100),
      ),
    );
    results.push(...pageResults.map((response) => response.data));
  }
  const products = new Map<string, ResourceChoice>();
  for (const result of results) {
    for (const product of result.products) {
      if (product.status !== 'active') continue;
      products.set(product.productId, { id: product.productId, label: product.name });
    }
  }
  return [...products.values()].sort((left, right) => left.label.localeCompare(right.label));
}

function resolveEditorAssetUrl(
  files: Array<{ path: string; encoding?: 'utf8' | 'base64'; content?: string }>,
  assetPath: string,
): string {
  const file = files.find((item) => item.path === assetPath);
  if (!file?.content) return '';
  if (file.encoding === 'base64') {
    const extension = assetPath.split('.').pop()?.toLowerCase();
    const mimeType = extension === 'svg' ? 'image/svg+xml'
      : extension === 'jpg' || extension === 'jpeg' ? 'image/jpeg'
      : extension === 'webp' ? 'image/webp'
      : extension === 'avif' ? 'image/avif'
      : extension === 'gif' ? 'image/gif'
      : 'image/png';
    return `data:${mimeType};base64,${file.content}`;
  }
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(file.content)))}`;
}
