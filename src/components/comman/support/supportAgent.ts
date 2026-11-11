/** ElevenLabs "Solvexo Support" agent id (Vercel → Environment Variables → VITE_ELEVENLABS_AGENT_ID, a plain variable). Empty = off. */
export const SUPPORT_AGENT_ID = (import.meta.env.VITE_ELEVENLABS_AGENT_ID as string | undefined)?.trim() || '';
