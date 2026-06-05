// ── Form Schemas ──────────────────────────────────────────────────────────────
// Each schema maps field names → arrays of Validator functions.
// Validators run in order; the first failure becomes the error message.
// ───────────────────────────────────────────────────────────────────────────────

import { required, email, phone, password, matchesField, exactLength } from './validators';
import type { Validator } from './validators';

// ── Schema type ──────────────────────────────────────────────────────────────
export type Schema<T> = {
  [K in keyof T]?: Validator<T>[];
};

// ── runSchema: executes all validators, returns an errors object ─────────────
export function runSchema<T>(
  schema: Schema<T>,
  data: T,
): Partial<Record<keyof T, string>> {
  const errors: Partial<Record<keyof T, string>> = {};
  for (const key of Object.keys(schema) as (keyof T)[]) {
    const validators = schema[key];
    if (!validators) continue;
    for (const validate of validators) {
      const err = validate(String((data as Record<string, unknown>)[key as string] ?? ''), data);
      if (err) { errors[key] = err; break; }
    }
  }
  return errors;
}

// ── runField: validates a single field ───────────────────────────────────────
export function runField<T>(
  schema: Schema<T>,
  field: keyof T,
  data: T,
): string | null {
  const validators = schema[field];
  if (!validators) return null;
  for (const validate of validators) {
    const err = validate(String((data as Record<string, unknown>)[field as string] ?? ''), data);
    if (err) return err;
  }
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH SCHEMAS
// ─────────────────────────────────────────────────────────────────────────────

// ── Register ─────────────────────────────────────────────────────────────────
export interface RegisterFormData {
  name:     string;
  email:    string;
  password: string;
  phone:    string;
  address:  string;
  role:     string;
}

export const registerSchema: Schema<RegisterFormData> = {
  name:     [required<RegisterFormData>('Full name')],
  email:    [required<RegisterFormData>('Email address'), email<RegisterFormData>()],
  password: [required<RegisterFormData>('Password'), password<RegisterFormData>()],
  phone:    [required<RegisterFormData>('Phone number'), phone<RegisterFormData>()],
  address:  [required<RegisterFormData>('Address')],
};

// ── Login ─────────────────────────────────────────────────────────────────────
export interface LoginFormData {
  email:    string;
  password: string;
}

export const loginSchema: Schema<LoginFormData> = {
  email:    [required<LoginFormData>('Email address'), email<LoginFormData>()],
  password: [required<LoginFormData>('Password')],
};

// ── Forgot Password ───────────────────────────────────────────────────────────
export interface ForgotPasswordFormData {
  email: string;
}

export const forgotPasswordSchema: Schema<ForgotPasswordFormData> = {
  email: [required<ForgotPasswordFormData>('Email address'), email<ForgotPasswordFormData>()],
};

// ── Verify OTP ────────────────────────────────────────────────────────────────
export interface OtpFormData {
  otp: string;
}

export const otpSchema: Schema<OtpFormData> = {
  otp: [required<OtpFormData>('Verification code'), exactLength<OtpFormData>(6, 'Code')],
};

// ── New Password ─────────────────────────────────────────────────────────────
export interface NewPasswordFormData {
  password:        string;
  confirmPassword: string;
}

export const newPasswordSchema: Schema<NewPasswordFormData> = {
  password: [
    required<NewPasswordFormData>('New password'),
    password<NewPasswordFormData>(),
  ],
  confirmPassword: [
    required<NewPasswordFormData>('Confirm password'),
    matchesField<NewPasswordFormData>('password', 'Passwords do not match.'),
  ],
};

// ── Onboarding — Step 1 (Store Info) ─────────────────────────────────────────
export interface StoreInfoFormData {
  storeName:        string;
  storeCategory:    string;
  storeDescription: string;
}

export const storeInfoSchema: Schema<StoreInfoFormData> = {
  storeName:     [required<StoreInfoFormData>('Store name')],
  storeCategory: [required<StoreInfoFormData>('Store category')],
};
