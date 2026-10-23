import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import i18n from '@/i18n';
import { tsNodes } from './tStatic';

describe('tsNodes', () => {
  it('puts each styled piece where the translated sentence has its placeholder', async () => {
    await i18n.changeLanguage('ur');
    const urdu = renderToStaticMarkup(<p>{tsNodes('pg.by_author', 'By {{author}}', { author: <b>Sara</b> })}</p>);
    expect(urdu).toBe('<p><b>Sara</b> کی طرف سے</p>');
    await i18n.changeLanguage('en');
    const english = renderToStaticMarkup(<p>{tsNodes('pg.by_author', 'By {{author}}', { author: <b>Sara</b> })}</p>);
    expect(english).toBe('<p>By <b>Sara</b></p>');
  });

  it('mixes styled pieces with plain values', async () => {
    await i18n.changeLanguage('en');
    const html = renderToStaticMarkup(<p>{tsNodes('pg.points_to_reach', '{{points}} more points to reach {{tier}}', { tier: <strong>Gold</strong> }, { points: '120' })}</p>);
    expect(html).toBe('<p>120 more points to reach <strong>Gold</strong></p>');
  });
});
