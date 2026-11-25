import { describe, it, expect, vi, beforeAll, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen, fireEvent, within, cleanup } from '@testing-library/react';
import { Select, MultiSelect } from './Dropdown';
import { FilterDropdown } from './FilterDropdown';

afterEach(cleanup);

beforeAll(() => {
  // jsdom has no layout engine / matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (q: string) => ({ matches: false, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, onchange: null, dispatchEvent: () => false }),
  });
  Element.prototype.scrollIntoView = vi.fn();
});

const click = (el: Element) => fireEvent.click(el);
const key = (el: Element, k: string) => fireEvent.keyDown(el, { key: k });
const type = (el: Element, value: string) => fireEvent.change(el, { target: { value } });

const STATUS = (
  <>
    <option value="">All orders</option>
    <option value="open">Open</option>
    <option value="paid">Paid</option>
    <option value="gone" disabled>Archived</option>
  </>
);

describe('Select (old <option> children, old onChange(e))', () => {
  it('shows the label of the current value and is labelled', () => {
    render(<Select label="Order status" value="paid" onChange={() => {}}>{STATUS}</Select>);
    const trigger = screen.getByRole('combobox', { name: 'Order status' });
    expect(trigger.textContent).toContain('Paid');
  });

  it('calls onChange with e.target.value, like a native select', () => {
    const onChange = vi.fn();
    render(<Select label="Order status" value="" onChange={e => onChange(e.target.value)}>{STATUS}</Select>);
    click(screen.getByRole('combobox'));
    click(screen.getByRole('option', { name: 'Open' }));
    expect(onChange).toHaveBeenCalledWith('open');
  });

  it('does not pick a disabled option', () => {
    const onChange = vi.fn();
    render(<Select value="" onChange={onChange}>{STATUS}</Select>);
    click(screen.getByRole('combobox'));
    click(screen.getByRole('option', { name: 'Archived' }));
    expect(onChange).not.toHaveBeenCalled();
  });

  it('works without a value prop (uncontrolled) and with <optgroup>', () => {
    render(
      <Select defaultValue="b" label="Letter">
        <optgroup label="First"><option value="a">A</option></optgroup>
        <optgroup label="Second"><option value="b">B</option></optgroup>
      </Select>,
    );
    const trigger = screen.getByRole('combobox');
    expect(trigger.textContent).toContain('B');
    click(trigger);
    expect(screen.getByText('First')).toBeTruthy();
    click(screen.getByRole('option', { name: 'A' }));
    expect(trigger.textContent).toContain('A');
  });
});

describe('Select behaviour', () => {
  const many = Array.from({ length: 12 }, (_, i) => ({ value: `v${i}`, label: `Item ${i}`, description: i === 3 ? 'special one' : undefined }));

  it('has no search box for a short list, and shows one above 8 options', () => {
    const { unmount } = render(<Select value="" options={many.slice(0, 5)} onChange={() => {}} />);
    click(screen.getByRole('combobox'));
    expect(screen.queryByRole('searchbox')).toBeNull();
    unmount();
    render(<Select value="" options={many} onChange={() => {}} />);
    click(screen.getByRole('combobox'));
    expect(screen.getByRole('searchbox')).toBeTruthy();
  });

  it('filters by label and description, and says when nothing matches', () => {
    render(<Select value="" options={many} onChange={() => {}} />);
    click(screen.getByRole('combobox'));
    const search = screen.getByRole('searchbox');
    type(search, 'special');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    type(search, 'zzz');
    expect(screen.queryAllByRole('option')).toHaveLength(0);
    expect(screen.getByText('No results')).toBeTruthy();
  });

  it('"Create new" row passes what was typed', () => {
    const onCreate = vi.fn();
    render(<Select value="" options={many} onChange={() => {}} onCreate={onCreate} />);
    click(screen.getByRole('combobox'));
    type(screen.getByRole('searchbox'), 'Brand new');
    click(screen.getByRole('button', { name: /Create “Brand new”/ }));
    expect(onCreate).toHaveBeenCalledWith('Brand new');
  });

  it('keyboard: arrows move, Enter picks, Escape closes without closing a dialog behind it', () => {
    const onChange = vi.fn();
    const onDialogKey = vi.fn();
    document.addEventListener('keydown', onDialogKey);
    render(<Select value="" options={many.slice(0, 4)} onChange={e => onChange(e.target.value)} />);
    const trigger = screen.getByRole('combobox');
    key(trigger, 'ArrowDown');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    key(trigger, 'ArrowDown');
    key(trigger, 'Enter');
    expect(onChange).toHaveBeenCalledWith('v1');
    key(trigger, 'ArrowDown');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
    onDialogKey.mockClear();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(onDialogKey).not.toHaveBeenCalled();
    document.removeEventListener('keydown', onDialogKey);
  });

  it('clearable shows a clear button that sends an empty value', () => {
    const onChange = vi.fn();
    render(<Select value="v1" clearable options={[{ value: '', label: 'None' }, ...many.slice(0, 3)]} onChange={e => onChange(e.target.value)} />);
    click(screen.getByLabelText('Clear selection'));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('error and hint text render under the field', () => {
    const { rerender } = render(<Select value="" options={many.slice(0, 3)} hint="Pick one" onChange={() => {}} />);
    expect(screen.getByText('Pick one')).toBeTruthy();
    rerender(<Select value="" options={many.slice(0, 3)} error="Required" onChange={() => {}} />);
    expect(screen.getByRole('alert').textContent).toBe('Required');
    expect(screen.getByRole('combobox').getAttribute('aria-invalid')).toBe('true');
  });

  it('disabled cannot be opened', () => {
    render(<Select value="" disabled options={many.slice(0, 3)} onChange={() => {}} />);
    click(screen.getByRole('combobox'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });

  it('keeps a real hidden <select> for forms (name + required)', () => {
    const { container } = render(<form><Select name="country" required value="" options={many.slice(0, 3)} onChange={() => {}} /></form>);
    const native = container.querySelector('select[name="country"]') as HTMLSelectElement;
    expect(native).toBeTruthy();
    expect(native.required).toBe(true);
  });

  it('closes on a click outside', () => {
    render(<div><button>elsewhere</button><Select value="" options={many.slice(0, 3)} onChange={() => {}} /></div>);
    click(screen.getByRole('combobox'));
    expect(screen.getByRole('listbox')).toBeTruthy();
    fireEvent.mouseDown(screen.getByText('elsewhere'));
    expect(screen.queryByRole('listbox')).toBeNull();
  });
});

describe('options built by a small component', () => {
  const TypeOptions = () => (
    <>
      <optgroup label="Basic"><option value="text">Text</option></optgroup>
      <optgroup label="Choice"><option value="dropdown">Dropdown</option></optgroup>
    </>
  );
  it('are listed and can be picked', () => {
    const onChange = vi.fn();
    render(<Select value="" onChange={e => onChange(e.target.value)}><option value="">Add a field</option><TypeOptions /></Select>);
    click(screen.getByRole('combobox'));
    expect(screen.getAllByRole('option')).toHaveLength(3);
    click(screen.getByRole('option', { name: 'Dropdown' }));
    expect(onChange).toHaveBeenCalledWith('dropdown');
  });
});

describe('MultiSelect', () => {
  function Demo() {
    const [v, setV] = useState<string[]>(['a']);
    return (
      <MultiSelect label="Tags" values={v} onValuesChange={setV}>
        <option value="a">Alpha</option><option value="b">Beta</option>
      </MultiSelect>
    );
  }
  it('adds and removes chips', () => {
    render(<Demo />);
    const box = screen.getByRole('combobox', { name: 'Tags' });
    expect(within(box).getByText('Alpha')).toBeTruthy();
    click(box);
    click(screen.getByRole('option', { name: 'Beta' }));
    expect(within(box).getByText('Beta')).toBeTruthy();
    click(within(box).getByLabelText('Remove Alpha'));
    expect(within(box).queryByText('Alpha')).toBeNull();
  });
});

describe('FilterDropdown (compact wrapper)', () => {
  it('still takes options + onChange(value) and a placeholder entry', () => {
    const onChange = vi.fn();
    render(<FilterDropdown value="" placeholder="All types" options={[{ value: 'x', label: 'Type X' }]} onChange={onChange} />);
    click(screen.getByRole('combobox'));
    click(screen.getByRole('option', { name: 'Type X' }));
    expect(onChange).toHaveBeenCalledWith('x');
  });
});
