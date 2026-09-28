import type { AutomationSection } from '@/api/services/marketingAutomations';
import { createBlock, DEFAULT_STYLES, type EmailBlock, type EmailDesign } from './emailDesign';

export const AUTOMATION_MERGE_TAGS: Record<AutomationSection, string[]> = {
  welcome:     ['{{customerName}}', '{{storeName}}', '{{shopUrl}}', '{{discountCode}}'],
  backInStock: ['{{customerName}}', '{{storeName}}', '{{shopUrl}}', '{{productName}}', '{{productPrice}}', '{{productUrl}}'],
  priceDrop:   ['{{customerName}}', '{{storeName}}', '{{shopUrl}}', '{{productName}}', '{{oldPrice}}', '{{newPrice}}', '{{productUrl}}'],
  winBack:     ['{{customerName}}', '{{storeName}}', '{{shopUrl}}', '{{discountCode}}'],
};

function textToEditorHtml(text: string): string {
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return text.split(/\n{2,}/).map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`).join('');
}

/** A first design for an automation that has none yet — built from its
 *  current subject/message/discount code, so opening the editor starts from
 *  what the seller already has. */
export function automationStarterDesign(
  section: AutomationSection,
  current: { subject: string; message: string; discountCode?: string | null },
  logo: string | null,
): EmailDesign {
  const styles = { ...DEFAULT_STYLES };
  const b = <T extends EmailBlock['type']>(type: T, patch: Partial<Extract<EmailBlock, { type: T }>> = {}) =>
    ({ ...createBlock(type, styles), ...patch }) as EmailBlock;

  const blocks: EmailBlock[] = [
    b('header', { logoUrl: logo }),
    b('heading', { text: current.subject }),
    b('text', { html: textToEditorHtml(current.message), align: 'center' }),
  ];

  if (section === 'backInStock' || section === 'priceDrop') {
    blocks.push(b('dynamicProduct', { buttonLabel: section === 'priceDrop' ? 'View item' : 'Shop now' }));
  } else {
    if (current.discountCode) {
      blocks.push(b('discount', {
        code: current.discountCode,
        title: section === 'welcome' ? 'A welcome gift for you' : 'Come back and save',
        description: 'Use this code at checkout.',
      }));
    }
    blocks.push(b('button', { label: section === 'welcome' ? 'Start shopping' : 'Shop now', link: '{{shopUrl}}' }));
  }

  return { version: 1, previewText: '', styles, blocks };
}
