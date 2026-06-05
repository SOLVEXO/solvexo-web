import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    document.title = `Solvexo | ${title}`;
    return () => { document.title = 'Solvexo'; };
  }, [title]);
}
