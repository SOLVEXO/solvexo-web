import { useCallback, useEffect, useRef, useState } from 'react';
import { apiAutoTranslateEmail } from '@/api/services/storeNotifications';
import { useStoreWorkspaceOptional } from '@/components/layouts/StoreLayout';
import { Button, Select } from '@/components/comman/ui';
import { Modal } from '@/components/comman/ui/Modal';
import { apiListSellerMarkets } from '@/api/services/marketsSeller';
import type { CustomerEmailSetting, EventTranslations } from '@/api/services/storeNotifications';
import { languageName } from '@/utils/languages';
import { EmailEditorPanel } from './EmailEditorPanel';
import { EmailTranslationEditor } from './EmailTranslationEditor';

interface Props {
  storeId: string;
  email: CustomerEmailSetting;
  eventTranslations: EventTranslations | undefined;
  defaultTranslations?: Record<string, Record<string, { subject: string; body: string }>>;
  onClose: () => void;
  onSave: (key: string, change: { subject?: string; body?: string; reset?: boolean }) => Promise<void>;
  onSaveTranslation: (key: string, locale: string, value: { subject: string; body: string } | null) => Promise<void>;
}

/** Opens the English editor, plus a language switcher (languages of the store's markets) that swaps to the translation editor. */
export function EmailEditorHost({ storeId, email, eventTranslations, defaultTranslations, onClose, onSave, onSaveTranslation }: Props) {
  const [languages, setLanguages] = useState<string[]>([]);
  const sourceLanguage = useStoreWorkspaceOptional()?.store?.defaultLanguage ?? 'en';
  const [locale, setLocale] = useState(sourceLanguage);
  const [pendingLocale, setPendingLocale] = useState<string | null>(null);
  const dirtyRef = useRef(false);
  const onDirtyChange = useCallback((d: boolean) => { dirtyRef.current = d; }, []);

  // The switcher is optional: if the markets cannot be loaded the seller simply edits English as before.
  useEffect(() => {
    let cancelled = false;
    apiListSellerMarkets(storeId)
      .then(res => {
        if (cancelled) return;
        const set = new Set<string>();
        (res.data ?? []).forEach(m => m.languages.forEach(l => { if (l && l !== sourceLanguage) set.add(l); }));
        if (sourceLanguage !== 'en') set.add('en'); // buyers in English get the built-in English text unless translated
        setLanguages([...set]);
      })
      .catch(() => { /* no switcher */ });
    return () => { cancelled = true; };
  }, [storeId, sourceLanguage]);

  const change = (next: string) => {
    if (next === locale) return;
    if (dirtyRef.current) setPendingLocale(next);
    else setLocale(next);
  };

  const switcher = languages.length > 0 ? (
    <div className="max-w-[260px]">
      <Select label="Language" value={locale} onChange={e => change(e.target.value)}>
        <option value={sourceLanguage}>{languageName(sourceLanguage)}</option>
        {languages.map(l => <option key={l} value={l}>{languageName(l)}{eventTranslations?.[email.key]?.[l] ? '' : ' (untranslated)'}</option>)}
      </Select>
    </div>
  ) : undefined;

  return (
    <>
      {locale === sourceLanguage ? (
        <EmailEditorPanel storeId={storeId} email={email} onClose={onClose} onSave={onSave} headerExtra={switcher} onDirtyChange={onDirtyChange} />
      ) : (
        <EmailTranslationEditor
          key={locale}
          email={email}
          locale={locale}
          translation={eventTranslations?.[email.key]?.[locale]}
          builtIn={defaultTranslations?.[locale]?.[email.key]}
          onSave={onSaveTranslation}
          onClose={onClose}
          sourceLanguage={sourceLanguage}
          onAutoTranslate={() => apiAutoTranslateEmail(storeId, { event: email.key, locale }).then(r => r.data)}
          headerExtra={switcher}
          onDirtyChange={onDirtyChange}
        />
      )}
      {pendingLocale && (
        <Modal
          title="Discard unsaved changes?"
          onClose={() => setPendingLocale(null)}
          footer={(
            <>
              <Button variant="outline" size="sm" onClick={() => setPendingLocale(null)}>Keep editing</Button>
              <Button variant="danger" size="sm" onClick={() => { dirtyRef.current = false; setLocale(pendingLocale); setPendingLocale(null); }}>Discard</Button>
            </>
          )}
        >
          <p className="text-[13px] text-charcoal">Your changes to this email are not saved. Switching language will lose them.</p>
        </Modal>
      )}
    </>
  );
}
