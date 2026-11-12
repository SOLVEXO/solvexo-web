import { describe, expect, it } from 'vitest';
import { daysLeft, deadlineText, questionnaireRows, taxIdLabel, whatsappReminderText, FBR_NTN_CHECK_URL } from './trust.utils';

const NOW = new Date('2026-11-12T10:00:00Z').getTime();

describe('seller trust utils', () => {
  it('counts days to the deadline and words them', () => {
    expect(daysLeft(null, NOW)).toBeNull();
    expect(daysLeft('2026-11-30T00:00:00Z', NOW)).toBe(18);
    expect(deadlineText('2026-11-30T00:00:00Z', NOW)).toBe('18 days left');
    expect(deadlineText('2026-11-13T00:00:00Z', NOW)).toBe('1 day left');
    expect(deadlineText('2026-11-12T10:00:00Z', NOW)).toBe('Due today');
    expect(deadlineText('2026-11-10T10:00:00Z', NOW)).toBe('2 days overdue');
    expect(deadlineText(undefined, NOW)).toBeNull();
  });

  it('names the tax number per country', () => {
    expect(taxIdLabel('PK')).toBe('NTN');
    expect(taxIdLabel(null)).toBe('NTN');
    expect(taxIdLabel('ae')).toBe('VAT TRN');
    expect(taxIdLabel('GB')).toBe('Tax ID');
  });

  it('turns questionnaire answers into readable rows, marking gaps', () => {
    const rows = questionnaireRows({ sourcing: 'dropshipper', sellsBrandedGoods: false, regulatedCategories: [], returnPolicy: 'no_returns', bankAccountInOwnName: false });
    const get = (l: string) => rows.find(r => r.label === l)?.value;
    expect(get('How they get products')).toBe('Dropshipping');
    expect(get('Branded products')).toBe('No');
    expect(get('Regulated products')).toBe('None');
    expect(get('Returns')).toBe('No returns');
    expect(get('Bank account')).toBe("Someone else's");
    expect(get('Works from')).toBe('Not answered');
    expect(questionnaireRows(null).every(r => r.value === 'Not answered')).toBe(true);
  });

  it('prefills a WhatsApp reminder with the store and deadline', () => {
    const t = whatsappReminderText('GlowSkin Store', '2026-11-30T00:00:00Z');
    expect(t).toContain('"GlowSkin Store"');
    expect(t).toContain('30 Nov 2026');
    expect(t).toContain('Cash on delivery keeps working');
  });

  it('keeps the FBR check page in one constant', () => {
    expect(FBR_NTN_CHECK_URL).toBe('https://e.fbr.gov.pk/esbn/Verification.aspx');
  });
});
