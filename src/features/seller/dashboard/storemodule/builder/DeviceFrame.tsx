import type { ReactNode } from 'react';

/** Mechanical device-width wrapper for the Theme Catalog preview page —
 *  just constrains/scrolls its children to `width`, no per-device chrome. */
export function DeviceFrame({ width, children }: { width: number; children: ReactNode }) {
  return (
    <div style={{ width, maxWidth: '100%', height: '100%', margin: '0 auto', overflow: 'auto' }}>
      {children}
    </div>
  );
}
