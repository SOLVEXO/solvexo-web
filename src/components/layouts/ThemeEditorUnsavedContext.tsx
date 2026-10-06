import { createContext, useContext, useEffect } from 'react';

/** Shared guard for all routes inside the fullscreen theme editor. */
const ThemeEditorUnsavedContext = createContext<(dirty: boolean) => void>(() => {});

export const ThemeEditorUnsavedProvider = ThemeEditorUnsavedContext.Provider;

/** Reports the current editor's dirty state to the shell that owns navigation. */
export function useThemeEditorUnsavedChanges(dirty: boolean) {
  const report = useContext(ThemeEditorUnsavedContext);
  useEffect(() => {
    report(dirty);
    return () => report(false);
  }, [dirty, report]);
}
