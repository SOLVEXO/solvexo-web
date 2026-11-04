import type { BadgeTone } from '../../../orderUi';

export const PILL_TONE: Record<BadgeTone, 'neutral' | 'good' | 'warn' | 'bad'> = {
  success: 'good', warning: 'warn', info: 'neutral', danger: 'bad', neutral: 'neutral',
};