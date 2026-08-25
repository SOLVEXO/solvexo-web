import * as monaco from 'monaco-editor';
import { loader } from '@monaco-editor/react';
// `monaco-editor`'s package.json `exports` map is `"./*": "./esm/vs/*.js"`
// — the `esm/vs/` prefix is already implied by the package's own export map,
// so the import specifier must NOT repeat it (found via a real Vite
// resolution error: "Failed to resolve import ... Does the file exist?").
import editorWorker from 'monaco-editor/editor/editor.worker?worker';
import jsonWorker from 'monaco-editor/language/json/json.worker?worker';
import cssWorker from 'monaco-editor/language/css/css.worker?worker';
import tsWorker from 'monaco-editor/language/typescript/ts.worker?worker';

/**
 * Self-hosts Monaco entirely from the npm package (bundled by Vite, via
 * `?worker` imports) instead of `@monaco-editor/react`'s default behavior of
 * fetching Monaco's core + language workers from the jsdelivr CDN at
 * runtime. Found via real testing to be a genuine reliability problem, not
 * just a sandbox artifact: the Code Editor page's Monaco instance mounted
 * inconsistently across otherwise-identical runs, consistent with an
 * external network fetch racing/timing out — a real production risk for a
 * merchant-facing developer tool (a restricted-egress hosting environment,
 * a jsdelivr outage, or a strict CSP with no external script-src would
 * silently break Edit Code entirely). `loader.config({ monaco })` below is
 * what tells `@monaco-editor/react` to use this local instance instead of
 * ever reaching out to a CDN. Imported once, only from `CodeEditorPage.tsx`
 * (itself a lazy-loaded route chunk), so this never adds weight to any
 * other page's bundle.
 */
self.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'json') return new jsonWorker();
    if (label === 'css' || label === 'scss' || label === 'less') return new cssWorker();
    if (label === 'typescript' || label === 'javascript') return new tsWorker();
    return new editorWorker();
  },
};

loader.config({ monaco });
