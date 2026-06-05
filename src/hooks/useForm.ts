// ── useForm Hook ──────────────────────────────────────────────────────────────
// Central form state management hook with built-in schema validation.
// Usage:
//   const { values, errors, set, blur, handleSubmit, reset } = useForm(
//     registerSchema,
//     { name: '', email: '', ... },
//     { onSubmit: (data) => apiCall(data) }
//   );
// ───────────────────────────────────────────────────────────────────────────────

import { useState, useCallback, type ChangeEvent } from 'react';
import { runSchema, runField, type Schema } from '@/utils/validation/schemas';

interface UseFormOptions<T> {
  onSubmit?: (data: T) => void | Promise<void>;
  validateOnBlur?: boolean;
}

export function useForm<T extends object>(
  schema: Schema<T>,
  initialValues: T,
  options?: UseFormOptions<T>,
) {
  const { onSubmit, validateOnBlur = true } = options ?? {};

  const [values, setValues]   = useState<T>(initialValues);
  const [errors, setErrors]   = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  // ── onChange handler factory ──────────────────────────────────────────────
  // Usage: onChange={set('fieldName')}
  const set = useCallback(<K extends keyof T>(key: K) =>
    (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setValues(prev => ({ ...prev, [key]: e.target.value }));
      setErrors(prev => ({ ...prev, [key]: undefined }));
    },
  []);

  // ── Direct value setter (for non-input fields like role, toggles, etc.) ──
  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, []);

  // ── onBlur handler factory ────────────────────────────────────────────────
  // Usage: onBlur={blur('fieldName')}
  const blur = useCallback(<K extends keyof T>(key: K) => () => {
    setTouched(prev => ({ ...prev, [key]: true }));
    if (validateOnBlur) {
      const err = runField(schema, key, values);
      setErrors(prev => ({ ...prev, [key]: err ?? undefined }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schema, validateOnBlur, values]);

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Mark all schema fields as touched
    const allTouched = Object.keys(schema).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {} as Partial<Record<keyof T, boolean>>,
    );
    setTouched(allTouched);

    // Run all validators
    const newErrors = runSchema(schema, values);
    setErrors(newErrors);

    // If no errors, call onSubmit
    if (Object.keys(newErrors).length === 0 && onSubmit) {
      await onSubmit(values);
    }
  }, [schema, values, onSubmit]);

  // ── Reset ─────────────────────────────────────────────────────────────────
  const reset = useCallback((newValues?: T) => {
    setValues(newValues ?? initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  // ── Derived: is the form valid? ──────────────────────────────────────────
  const isValid = Object.keys(runSchema(schema, values)).length === 0;

  return {
    values,
    errors,
    touched,
    set,
    setValue,
    blur,
    handleSubmit,
    reset,
    isValid,
  };
}
