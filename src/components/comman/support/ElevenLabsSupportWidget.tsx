import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { SUPPORT_AGENT_ID } from './supportAgent';

/** Pinned so a new widget release can't change the site unannounced. */
const WIDGET_SRC = 'https://unpkg.com/@elevenlabs/convai-widget-embed@0.22.0';
const SCRIPT_ID = 'elevenlabs-convai-widget';

/** Pages with their own bottom bar, where the bubble would sit on top of the main button. */
const HIDDEN_ON = ['/start'];

/**
 * The "Solvexo Support" AI agent (ElevenLabs Agents) as a chat/voice bubble on the public site.
 * Shown only when VITE_ELEVENLABS_AGENT_ID is set (Vercel → Environment Variables, as a plain variable).
 * The agent itself — prompt, knowledge base, voice, languages, text or voice mode — is managed in ElevenLabs;
 * this only places ElevenLabs' own embed on the page.
 */
export function ElevenLabsSupportWidget() {
  const { pathname } = useLocation();
  const hidden = !SUPPORT_AGENT_ID || HIDDEN_ON.some(p => pathname === p || pathname.startsWith(`${p}/`));

  useEffect(() => {
    if (hidden) return;
    if (!document.getElementById(SCRIPT_ID)) {
      const s = document.createElement('script');
      s.id = SCRIPT_ID;
      s.src = WIDGET_SRC;
      s.async = true;
      s.type = 'text/javascript';
      document.body.appendChild(s);
    }
    const el = document.createElement('elevenlabs-convai');
    el.setAttribute('agent-id', SUPPORT_AGENT_ID);
    document.body.appendChild(el);
    return () => { el.remove(); };
  }, [hidden]);

  return null;
}
