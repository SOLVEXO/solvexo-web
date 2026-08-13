import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `Solvexo.store: ${title}`;
    return () => { document.title = 'Solvexo'; };
  }, [title]);
}
