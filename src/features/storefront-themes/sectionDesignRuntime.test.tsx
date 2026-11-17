import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { SectionRulesGate, SectionVideoBg } from './sectionDesignRuntime';
import { useSectionReveal } from './useSectionReveal';

vi.mock('@/api/services/auth', () => ({
  TokenStorage: { isLoggedIn: () => loggedIn },
  isGuestUser: () => false,
}));
let loggedIn = false;

afterEach(cleanup);
beforeEach(() => { loggedIn = false; });

describe('SectionRulesGate', () => {
  it('shows a section with no rules', () => {
    render(<SectionRulesGate settings={{}}><p>hello</p></SectionRulesGate>);
    expect(screen.getByText('hello')).toBeTruthy();
  });

  it('hides a customers-only section from a visitor who is not signed in, shows it once signed in', () => {
    const { unmount } = render(<SectionRulesGate settings={{ showTo: 'customers' }}><p>members</p></SectionRulesGate>);
    expect(screen.queryByText('members')).toBeNull();
    unmount();
    loggedIn = true;
    render(<SectionRulesGate settings={{ showTo: 'customers' }}><p>members</p></SectionRulesGate>);
    expect(screen.getByText('members')).toBeTruthy();
  });

  it('never hides in the editor (ignore)', () => {
    render(<SectionRulesGate settings={{ showTo: 'customers' }} ignore><p>editing</p></SectionRulesGate>);
    expect(screen.getByText('editing')).toBeTruthy();
  });

  it('a schedule in the past hides, a schedule that has started shows', () => {
    const { unmount } = render(<SectionRulesGate settings={{ showUntil: '2000-01-01T00:00:00.000Z' }}><p>sale</p></SectionRulesGate>);
    expect(screen.queryByText('sale')).toBeNull();
    unmount();
    render(<SectionRulesGate settings={{ showFrom: '2000-01-01T00:00:00.000Z', showUntil: '2999-01-01T00:00:00.000Z' }}><p>sale</p></SectionRulesGate>);
    expect(screen.getByText('sale')).toBeTruthy();
  });
});

describe('SectionVideoBg', () => {
  it('renders nothing without a safe https video link', () => {
    const { container } = render(<SectionVideoBg settings={{ backgroundVideoUrl: 'http://x.com/a.mp4' }} />);
    expect(container.querySelector('video')).toBeNull();
  });

  it('renders a muted looping video and the dark overlay', () => {
    const { container } = render(<SectionVideoBg settings={{ backgroundVideoUrl: 'https://cdn.x/a.mp4', backgroundOverlay: 40 }} />);
    const v = container.querySelector('video')!;
    expect(v.getAttribute('src')).toBe('https://cdn.x/a.mp4');
    expect(v.muted).toBe(true);
    expect(v.loop).toBe(true);
    expect(v.getAttribute('aria-hidden')).toBe('true');
    expect((container.querySelector('.sx-vid-ov') as HTMLElement).style.background).toContain('0.4');
  });
});

describe('useSectionReveal', () => {
  let callback: IntersectionObserverCallback = () => {};
  beforeEach(() => {
    vi.stubGlobal('IntersectionObserver', class {
      constructor(cb: IntersectionObserverCallback) { callback = cb; }
      observe() {}
      unobserve() {}
      disconnect() {}
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  function Page({ enabled }: { enabled: boolean }) {
    useSectionReveal(enabled, 'a');
    return <div className="sx-anim sx-anim-fade" data-testid="sec">x</div>;
  }

  it('arms animated sections, then reveals them when they scroll into view', () => {
    render(<Page enabled />);
    const el = screen.getByTestId('sec');
    expect(el.hasAttribute('data-sx-pre')).toBe(true);
    callback([{ isIntersecting: true, target: el } as unknown as IntersectionObserverEntry], {} as IntersectionObserver);
    expect(el.hasAttribute('data-sx-pre')).toBe(false);
  });

  it('does nothing in the editor', () => {
    render(<Page enabled={false} />);
    expect(screen.getByTestId('sec').hasAttribute('data-sx-pre')).toBe(false);
  });

  it('never leaves a section hidden when it unmounts', () => {
    const { unmount } = render(<Page enabled />);
    const el = screen.getByTestId('sec');
    unmount();
    expect(el.hasAttribute('data-sx-pre')).toBe(false);
  });
});
