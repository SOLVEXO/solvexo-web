import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { FloatingContactBar } from './FloatingContactBar';
import type { FloatingContactConfig } from '@/api/services/store';

const BASE: FloatingContactConfig = {
  enabled: true, position: 'right', vertical: 'middle', size: 'md', style: 'brand', showLabels: true, labelMode: 'hover', device: 'all',
  phone: '', phoneLabel: '', whatsapp: '923001234567', whatsappMessage: '', whatsappLabel: '', email: '', emailLabel: '',
  facebook: '', instagram: '', tiktok: '', youtube: '', x: '', snapchat: '', linkedin: '',
  items: [], shape: 'flush', bubbleText: '', customBg: '', customFg: '', sizePx: 0, edgeOffset: 0, bottomOffset: 0, gapPx: -1,
};

function renderBar(cfg: Partial<FloatingContactConfig>) {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <FloatingContactBar config={{ ...BASE, ...cfg }} brandColor="#123456" />
    </MemoryRouter>,
  );
}

function nav(): HTMLElement {
  return screen.getByLabelText('Contact us');
}

describe('FloatingContactBar', () => {
  afterEach(cleanup);
  it('places a centre button in the middle of the screen', () => {
    renderBar({ position: 'center', vertical: 'bottom' });
    const el = nav();
    expect(el.style.left).toBe('50%');
    expect(el.style.bottom).toBe('96px');
    expect(el.style.transform).toContain('translateX(-50%)');
  });

  it('shows names always when labelMode is always, and hides them for icons only', () => {
    const { unmount } = renderBar({ labelMode: 'always' });
    expect(nav().className).toContain('fcb-always');
    expect(nav().className).not.toContain('fcb-nolabel');
    unmount();

    renderBar({ labelMode: 'none', showLabels: false });
    expect(nav().className).toContain('fcb-nolabel');
    expect(nav().className).not.toContain('fcb-always');
  });

  it('lifts a round button above a sticky bar by bottomOffset', () => {
    renderBar({ shape: 'round', vertical: 'bottom', bottomOffset: 40 });
    expect(nav().style.bottom).toBe('64px');
  });

  it('opens a wa.me chat with the pre-filled message', () => {
    renderBar({ whatsappMessage: 'Hi there' });
    const link = screen.getByRole('link', { name: /whatsapp/i });
    expect(link.getAttribute('href')).toBe('https://wa.me/923001234567?text=Hi%20there');
  });
});