import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGetStoreInventory } from '@/api/services/product';
import type { ThemePackageStructure } from '@/api/services/storeTheme';
import { ShopifyTemplateEditor } from './ShopifyTemplateEditor';

vi.mock('@/api/services/product', () => ({
  apiGetStoreInventory: vi.fn().mockResolvedValue({
    data: { pagination: { totalPages: 1 }, products: [{ productId: 'product-1', name: 'Product One', status: 'active' }] },
  }),
}));
vi.mock('@/api/services/collections', () => ({
  apiListCollections: vi.fn().mockResolvedValue({ data: [] }),
}));
vi.mock('@/api/services/storePages', () => ({
  apiListStorePages: vi.fn().mockResolvedValue({ data: [] }),
}));
vi.mock('@/api/services/storeBlog', () => ({
  apiListBlogs: vi.fn().mockResolvedValue({ data: [] }),
  apiListBlogPosts: vi.fn().mockResolvedValue({ data: [] }),
}));
vi.mock('@/api/services/menus', () => ({
  apiListMenus: vi.fn().mockResolvedValue({ data: [] }),
}));

afterEach(cleanup);

const templatePath = 'templates/index.json';
const structure: ThemePackageStructure = {
  version: 1,
  templates: [templatePath],
  sectionGroups: ['sections/header-group.json'],
  themeSettings: [{
    name: 'Brand',
    settings: [{ id: 'brand_name', type: 'text', label: 'Brand name', default: 'My shop' }],
  }],
  components: [{
    kind: 'section',
    type: 'hero',
    path: 'sections/hero.liquid',
    schema: {
      name: 'Hero',
      settings: [
        { id: 'heading', type: 'text', label: 'Heading', default: 'Welcome' },
        { id: 'hero_image', type: 'image_picker', label: 'Hero image' },
        { id: 'featured_product', type: 'product', label: 'Featured product' },
      ],
      presets: [{ name: 'Hero' }],
    },
  }],
};

describe('ShopifyTemplateEditor', () => {
  it('adds a section and applies subsequent setting edits to the unsaved template content', () => {
    const onChange = vi.fn();
    const props = {
      storeId: 'store-1',
      structure,
      files: [{ path: templatePath, encoding: 'utf8' as const, content: '{"sections":{},"order":[]}' }],
      selectedPath: templatePath,
      currentContent: '{"sections":{},"order":[]}',
      dirty: false,
      onSelectFile: vi.fn(),
      onChange,
    };
    const { rerender, getByRole, getByLabelText } = render(<ShopifyTemplateEditor {...props} />);

    fireEvent.change(getByRole('combobox', { name: 'Add section' }), { target: { value: 'hero::0' } });
    const changedTemplate = onChange.mock.calls.at(-1)?.[0] as string;
    const added = JSON.parse(changedTemplate) as { sections: Record<string, { settings: Record<string, unknown> }>; order: string[] };
    expect(added.order).toHaveLength(1);
    expect(added.sections[added.order[0]].settings.heading).toBe('Welcome');

    rerender(<ShopifyTemplateEditor {...props} currentContent={changedTemplate} dirty />);
    fireEvent.change(getByLabelText('Heading'), { target: { value: 'New heading' } });
    const edited = JSON.parse(onChange.mock.calls.at(-1)?.[0] as string) as typeof added;
    expect(edited.sections[edited.order[0]].settings.heading).toBe('New heading');
  });

  it('edits global theme settings in settings_data.json', () => {
    const onChange = vi.fn();
    const settingsPath = 'config/settings_data.json';
    const props = {
      storeId: 'store-1',
      structure,
      files: [
        { path: templatePath, encoding: 'utf8' as const, content: '{"sections":{},"order":[]}' },
        { path: settingsPath, encoding: 'utf8' as const, content: '{"current":{"brand_name":"Old"},"presets":{}}' },
      ],
      selectedPath: settingsPath,
      currentContent: '{"current":{"brand_name":"Old"},"presets":{}}',
      dirty: false,
      onSelectFile: vi.fn(),
      onChange,
    };
    const { getByRole, getByLabelText } = render(<ShopifyTemplateEditor {...props} />);
    fireEvent.click(getByRole('button', { name: 'Theme settings' }));
    fireEvent.change(getByLabelText('Brand name'), { target: { value: 'New brand' } });
    const updated = JSON.parse(onChange.mock.calls.at(-1)?.[0] as string) as { current: Record<string, unknown>; presets: Record<string, unknown> };
    expect(updated.current.brand_name).toBe('New brand');
    expect(updated.presets).toEqual({});
    expect(props.onSelectFile).toHaveBeenCalledWith(settingsPath, props.files[1].content);
  });

  it('selects a packaged image asset and previews the selected file', () => {
    const onChange = vi.fn();
    const empty = '{"sections":{},"order":[]}';
    const { getByRole, getByLabelText, rerender, container } = render(<ShopifyTemplateEditor
      storeId="store-1"
      structure={structure}
      files={[
        { path: templatePath, encoding: 'utf8', content: empty },
        { path: 'assets/hero.png', encoding: 'base64', content: 'cG5n' },
      ]}
      selectedPath={templatePath}
      currentContent={empty}
      dirty={false}
      onSelectFile={vi.fn()}
      onChange={onChange}
    />);

    fireEvent.change(getByRole('combobox', { name: 'Add section' }), { target: { value: 'hero::0' } });
    const added = onChange.mock.calls.at(-1)?.[0] as string;
    rerender(<ShopifyTemplateEditor
      storeId="store-1"
      structure={structure}
      files={[
        { path: templatePath, encoding: 'utf8', content: added },
        { path: 'assets/hero.png', encoding: 'base64', content: 'cG5n' },
      ]}
      selectedPath={templatePath}
      currentContent={added}
      dirty
      onSelectFile={vi.fn()}
      onChange={onChange}
    />);
    fireEvent.change(getByLabelText('Hero image'), { target: { value: 'assets/hero.png' } });
    const updated = JSON.parse(onChange.mock.calls.at(-1)?.[0] as string);
    expect(updated.sections[updated.order[0]].settings.hero_image).toBe('assets/hero.png');
    rerender(<ShopifyTemplateEditor
      storeId="store-1"
      structure={structure}
      files={[
        { path: templatePath, encoding: 'utf8', content: onChange.mock.calls.at(-1)?.[0] as string },
        { path: 'assets/hero.png', encoding: 'base64', content: 'cG5n' },
      ]}
      selectedPath={templatePath}
      currentContent={onChange.mock.calls.at(-1)?.[0] as string}
      dirty
      onSelectFile={vi.fn()}
      onChange={onChange}
    />);
    expect(container.querySelector('img')?.getAttribute('src')).toBe('data:image/png;base64,cG5n');
  });

  it('loads store-scoped resources and saves a selected resource ID', async () => {
    const onChange = vi.fn();
    const { getByRole, findByLabelText, rerender } = render(<ShopifyTemplateEditor
      storeId="store-1"
      structure={structure}
      files={[{ path: templatePath, encoding: 'utf8', content: '{"sections":{},"order":[]}' }]}
      selectedPath={templatePath}
      currentContent='{"sections":{},"order":[]}'
      dirty={false}
      onSelectFile={vi.fn()}
      onChange={onChange}
    />);

    fireEvent.change(getByRole('combobox', { name: 'Add section' }), { target: { value: 'hero::0' } });
    const added = onChange.mock.calls.at(-1)?.[0] as string;
    rerender(<ShopifyTemplateEditor
      storeId="store-1"
      structure={structure}
      files={[{ path: templatePath, encoding: 'utf8', content: added }]}
      selectedPath={templatePath}
      currentContent={added}
      dirty
      onSelectFile={vi.fn()}
      onChange={onChange}
    />);
    expect(apiGetStoreInventory).toHaveBeenCalledWith('store-1', 1, 100);
    const productChoice = await findByLabelText('Product One');
    fireEvent.click(productChoice);
    const updated = JSON.parse(onChange.mock.calls.at(-1)?.[0] as string);
    expect(updated.sections[updated.order[0]].settings.featured_product).toBe('product-1');
  });

  it('can hide a section while preserving its editable settings', () => {
    const onChange = vi.fn();
    const sectionId = 'hero-section';
    const content = JSON.stringify({ sections: { [sectionId]: { type: 'hero', settings: { heading: 'Welcome' } } }, order: [sectionId] });
    const { getByRole, queryByLabelText, rerender } = render(<ShopifyTemplateEditor
      storeId="store-1"
      structure={structure}
      files={[{ path: templatePath, encoding: 'utf8', content }]}
      selectedPath={templatePath}
      currentContent={content}
      dirty={false}
      onSelectFile={vi.fn()}
      onChange={onChange}
    />);

    fireEvent.click(getByRole('button', { name: 'Hide Hero' }));
    const updated = onChange.mock.calls.at(-1)?.[0] as string;
    const hidden = JSON.parse(updated);
    expect(hidden.sections[sectionId]).toMatchObject({ disabled: true, settings: { heading: 'Welcome' } });
    rerender(<ShopifyTemplateEditor
      storeId="store-1"
      structure={structure}
      files={[{ path: templatePath, encoding: 'utf8', content: updated }]}
      selectedPath={templatePath}
      currentContent={updated}
      dirty
      onSelectFile={vi.fn()}
      onChange={onChange}
    />);
    expect(queryByLabelText('Heading')).toBeNull();
  });
});
