import { createElement, Fragment, type ReactNode } from 'react';
import i18n from '@/i18n';

/**
 * Translation for code that is not a React component (pure helpers, copy defaults). Language switches reload
 * the page, so reading the active language at call time is enough - no re-render subscription needed.
 */
export function ts(key: string, defaultValue: string, vars?: Record<string, unknown>): string {
  return i18n.t(key, { ns: 'storefront', defaultValue, ...vars }) as string;
}

/**
 * ts() for a sentence that holds styled pieces (a bold name, an accent word): the translator writes ONE sentence with
 * {{name}}-style placeholders and decides where each piece goes, so word order is right in every language.
 * Plain text values go in `vars`; React elements go in `nodes`.
 */
export function tsNodes(key: string, defaultValue: string, nodes: Record<string, ReactNode>, vars?: Record<string, unknown>): ReactNode {
  const marks = Object.fromEntries(Object.keys(nodes).map(k => [k, `\uE000${k}\uE000`]));
  const text = ts(key, defaultValue, { ...vars, ...marks });
  return createElement(Fragment, null, ...text.split(/\uE000(\w+)\uE000/).map((part, i) => (i % 2 === 1 ? createElement(Fragment, { key: i }, nodes[part]) : part)));
}

/** Translates an English theme-copy default (looked up literally under `copy.<text>`); unknown text is returned as is. */
export function tCopyDefault(text: string): string {
  return i18n.t(`copy.${text}`, { ns: 'storefront', defaultValue: text, keySeparator: false, nsSeparator: false }) as string;
}

/** Alias of ts() for modules that already have a local named ts. */
export const tt = ts;
