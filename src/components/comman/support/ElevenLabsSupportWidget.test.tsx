import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.hoisted(() => { vi.stubEnv('VITE_ELEVENLABS_AGENT_ID', 'agent_test123'); });

import { ElevenLabsSupportWidget } from './ElevenLabsSupportWidget';

afterEach(() => { cleanup(); document.querySelectorAll('elevenlabs-convai, #elevenlabs-convai-widget').forEach(n => n.remove()); });
const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><ElevenLabsSupportWidget /></MemoryRouter>);

describe('ElevenLabs support widget', () => {
  it('adds the agent bubble and loads the pinned embed script once', () => {
    at('/pricing');
    const el = document.querySelector('elevenlabs-convai');
    expect(el?.getAttribute('agent-id')).toBe('agent_test123');
    const scripts = document.querySelectorAll('#elevenlabs-convai-widget');
    expect(scripts).toHaveLength(1);
    expect((scripts[0] as HTMLScriptElement).src).toBe('https://unpkg.com/@elevenlabs/convai-widget-embed@0.22.0');
  });

  it('removes the bubble when the page goes away, and stays off the ad landing page', () => {
    const { unmount } = at('/');
    unmount();
    expect(document.querySelector('elevenlabs-convai')).toBeNull();
    at('/start');
    expect(document.querySelector('elevenlabs-convai')).toBeNull();
  });
});
