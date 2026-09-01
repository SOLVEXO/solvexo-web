import { useState } from 'react';
import { Plus, Pencil, Palette, Archive, Star, Eye } from 'lucide-react';
import { usePageTitle } from '@/hooks/usePageTitle';
import { useAdminThemeCatalog } from '@/hooks/admin/useAdminThemeCatalog';
import {
  apiAdminCreateThemeCatalog, apiAdminUpdateThemeCatalog, apiAdminSetThemeCatalogStatus, apiAdminSetThemeCatalogFeatured,
  THEME_CATALOG_CATEGORIES, THEME_CATALOG_CATEGORY_LABELS, type ThemeDefinition, type ThemeCatalogCategory, type ThemeCatalogStatus,
} from '@/api/services/themeCatalog';
import { Button } from '@/components/comman/ui/Button';
import { Modal } from '@/components/comman/ui/Modal';
import { Input, Textarea, Select } from '@/components/comman/ui/Input';
import { Table, type TableColumn } from '@/components/comman/ui/Table';

const STATUS_COLORS: Record<ThemeCatalogStatus, { bg: string; text: string }> = {
  draft:     { bg: '#F0EEE6', text: '#5A5852' },
  published: { bg: '#EAF7EF', text: '#1E7A3C' },
  archived:  { bg: '#FBEAEA', text: '#B3261E' },
};

// Deliberately manages catalog LIFECYCLE (metadata, category, tier,
// publish/archive, featured) — not a full visual theme builder. A theme's
// actual colors/header/footer/home-page sections are authored the same way
// `seed-theme-catalog.ts` does (real, validated `ThemeDefinition` content),
// since building a second full visual editor here would duplicate most of
// the seller-facing Store Builder for no real benefit; this page is where
// an admin manages which of those authored themes are live in the
// marketplace, not where the content itself gets hand-drawn.
function ThemeFormModal({ theme, onClose, onSaved }: { theme: ThemeDefinition | 'new'; onClose: () => void; onSaved: () => void }) {
  const isEdit = theme !== 'new';
  const [name, setName] = useState(isEdit ? theme.name : '');
  const [slug, setSlug] = useState(isEdit ? theme.slug : '');
  const [description, setDescription] = useState(isEdit ? theme.description : '');
  const [category, setCategory] = useState<ThemeCatalogCategory>(isEdit ? theme.category : 'general');
  const [tags, setTags] = useState(isEdit ? theme.tags.join(', ') : '');
  const [tier, setTier] = useState<'free' | 'premium'>(isEdit ? theme.tier : 'free');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    if (!name.trim() || !slug.trim()) { setError('Name and slug are required.'); return; }
    setError('');
    setSaving(true);
    try {
      const payload = {
        name: name.trim(), slug: slug.trim(), description: description.trim(), category, tier,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      if (isEdit) await apiAdminUpdateThemeCatalog(theme._id, payload);
      else await apiAdminCreateThemeCatalog(payload);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save theme.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal mobileSheet
      title={isEdit ? 'Edit Theme' : 'Add Theme'}
      width={520}
      onClose={onClose}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={saving}>{isEdit ? 'Save Changes' : 'Create Theme'}</Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input label="Name" placeholder="Vogue" value={name} onChange={e => setName(e.target.value)} />
          <Input label="Slug" placeholder="vogue" value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} />
        </div>
        <Textarea label="Description" rows={3} value={description} onChange={e => setDescription(e.target.value)} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select label="Category" value={category} onChange={e => setCategory(e.target.value as ThemeCatalogCategory)}>
            {THEME_CATALOG_CATEGORIES.map(c => <option key={c} value={c}>{THEME_CATALOG_CATEGORY_LABELS[c]}</option>)}
          </Select>
          <Select label="Tier" value={tier} onChange={e => setTier(e.target.value as 'free' | 'premium')}>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
          </Select>
        </div>
        <Input label="Tags (comma-separated)" placeholder="luxury, editorial, fashion" value={tags} onChange={e => setTags(e.target.value)} />
        {isEdit && (
          <p className="text-[11.5px] text-slate leading-relaxed bg-cream/60 rounded-lg px-3 py-2">
            Colors, header/footer style, and home-page sections are authored via the theme catalog seed/content pipeline, not this form — this only manages listing metadata and lifecycle.
          </p>
        )}
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    </Modal>
  );
}

export function AdminThemeCatalog() {
  usePageTitle('Theme Catalog');
  const { themes, loading, error, refetch } = useAdminThemeCatalog();
  const [editing, setEditing] = useState<ThemeDefinition | 'new' | null>(null);
  const [actionError, setActionError] = useState('');

  async function setStatus(theme: ThemeDefinition, status: ThemeCatalogStatus) {
    setActionError('');
    try {
      await apiAdminSetThemeCatalogStatus(theme._id, status);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update status.');
    }
  }

  async function toggleFeatured(theme: ThemeDefinition) {
    setActionError('');
    try {
      await apiAdminSetThemeCatalogFeatured(theme._id, !theme.featured);
      refetch();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update.');
    }
  }

  const columns: TableColumn<ThemeDefinition>[] = [
    {
      key: 'name', header: 'Theme',
      render: t => (
        <div className="max-w-[280px]">
          <p className="font-semibold truncate">{t.name}</p>
          <p className="text-[11px] text-slate truncate">{t.description}</p>
        </div>
      ),
    },
    { key: 'category', header: 'Category', render: t => <span className="text-slate">{THEME_CATALOG_CATEGORY_LABELS[t.category]}</span> },
    { key: 'tier', header: 'Tier', render: t => <span className="text-slate capitalize">{t.tier}</span> },
    {
      key: 'status', header: 'Status',
      render: t => (
        <span
          className="px-[10px] py-[3px] rounded-[5px] text-[11px] font-semibold"
          style={{ background: STATUS_COLORS[t.status].bg, color: STATUS_COLORS[t.status].text }}
        >
          {t.status}
        </span>
      ),
    },
    { key: 'applyCount', header: 'Applied', render: t => <span className="text-slate whitespace-nowrap">{t.applyCount}× · {t.viewCount} views</span> },
    { key: 'featured', header: 'Featured', render: t => (
      <button
        onClick={() => toggleFeatured(t)}
        aria-label={t.featured ? 'Unfeature' : 'Feature'}
        className="bg-transparent border-none cursor-pointer p-1"
      >
        <Star size={16} className={t.featured ? 'text-amber-500 fill-amber-500' : 'text-bone'} />
      </button>
    ) },
    {
      key: 'actions', header: 'Actions',
      render: t => (
        <div className="flex gap-[6px] flex-wrap">
          <Button size="xs" variant="outline" icon={<Pencil size={11} />} onClick={() => setEditing(t)}>Edit</Button>
          {t.status !== 'published' ? (
            <Button size="xs" variant="outline" icon={<Eye size={11} />} onClick={() => setStatus(t, 'published')}>Publish</Button>
          ) : (
            <Button size="xs" variant="outline" icon={<Archive size={11} />} onClick={() => setStatus(t, 'archived')}>Archive</Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="bg-white border-b border-bone px-4 sm:px-7 py-[14px] sticky top-0 z-10 flex items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-[18px] font-bold text-charcoal leading-[1.3]">Theme Catalog</h1>
          <p className="text-[12px] text-slate mt-[2px]">The Theme Marketplace's global, admin-managed themes — {themes.length} total.</p>
        </div>
        <Button icon={<Plus size={14} />} onClick={() => setEditing('new')} className="shrink-0">Add Theme</Button>
      </div>

      <div className="px-4 sm:px-7 pt-5 pb-8 flex flex-col gap-4">
        {actionError && (
          <div className="bg-error-bg border border-error-border rounded-lg px-4 py-2.5 text-[12.5px] text-error">{actionError}</div>
        )}
        <div className="bg-white border border-bone rounded-[10px] overflow-hidden">
          {error ? (
            <p className="px-4 py-6 text-center text-[13px] text-error">{error}</p>
          ) : (
            <Table
              columns={columns}
              data={themes}
              keyExtractor={t => t._id}
              loading={loading}
              emptyState={{ icon: <Palette size={28} className="text-slate" />, title: 'No themes yet' }}
            />
          )}
        </div>
      </div>

      {editing && (
        <ThemeFormModal
          theme={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refetch(); }}
        />
      )}
    </div>
  );
}
