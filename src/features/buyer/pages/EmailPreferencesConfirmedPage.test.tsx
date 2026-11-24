import '@testing-library/jest-dom/vitest';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { SiteLangContext } from '@/i18n/site/siteLangContext';
import { EmailPreferencesConfirmedPage } from './EmailPreferencesConfirmedPage';
import { seoForPath } from '@/seo/publicPages';
import { isSitePath } from '@/i18n/site/siteLanguage';

afterEach(cleanup);

const at = (url: string, lang: 'en' | 'ar' = 'en') => render(
  <SiteLangContext.Provider value={{ lang, pageLang: lang, setLang: () => undefined }}>
    <MemoryRouter initialEntries={[url]}><Routes><Route path="/email-preferences/confirmed" element={<EmailPreferencesConfirmedPage />} /></Routes></MemoryRouter>
  </SiteLangContext.Provider>,
);

describe('EmailPreferencesConfirmedPage', () => {
  it('confirms the visitor is on the list and links home', () => {
    at('/email-preferences/confirmed?status=ok');
    expect(screen.getByRole('heading', { name: 'You’re on the list' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go to the home page/ })).toHaveAttribute('href', '/');
  });

  it('says the link expired for anything else, and links to Contact Us', () => {
    at('/email-preferences/confirmed?status=invalid');
    expect(screen.getByRole('heading', { name: 'This link has expired' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Contact us/ })).toHaveAttribute('href', '/contact-us');
  });

  it('has Arabic text for both states', () => {
    at('/email-preferences/confirmed?status=ok', 'ar');
    expect(screen.getByRole('heading', { name: 'تمت إضافتك إلى القائمة' })).toBeInTheDocument();
    cleanup();
    at('/email-preferences/confirmed', 'ar');
    expect(screen.getByRole('heading', { name: 'انتهت صلاحية هذا الرابط' })).toBeInTheDocument();
  });

  it('is kept out of search results and follows the site language', () => {
    expect(seoForPath('/email-preferences/confirmed')).toMatchObject({ index: false });
    expect(isSitePath('/email-preferences/confirmed')).toBe(true);
  });
});
