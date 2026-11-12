/**
 * ElevenLabs "Solvexo Support" agent. Agent ids are public (the widget puts them in the page), so the live one is
 * kept here; VITE_ELEVENLABS_AGENT_ID (Vercel, plain variable) overrides it, e.g. to try another agent on a preview.
 */
const LIVE_AGENT_ID = 'agent_2501m7537axxe6yth1gk9fqf3cfd';
export const SUPPORT_AGENT_ID = (import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined)?.trim() || LIVE_AGENT_ID;
