// `vitest-axe`'s own shipped types (`vitest-axe/extend-expect`) augment the
// old `Vi` global namespace, which vitest 4's actual `Assertion` interface
// (declared directly on the `'vitest'` module — see
// `@testing-library/jest-dom/vitest.d.ts` for the same modern pattern) no
// longer reads from. The matcher itself works correctly at runtime (wired
// in `vitest.setup.ts`); this file only fixes its TypeScript typing for
// this project's vitest version.
import 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> {
    toHaveNoViolations(): T;
  }
}
