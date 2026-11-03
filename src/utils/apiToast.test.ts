import { describe, expect, it } from 'vitest';
import { describeError, flattenMessage, isQuietPath, isWorkspacePath, shouldToastError, successMessage } from './apiToast';

describe('apiToast', () => {
  it('limits automatic toasts to the workspaces', () => {
    expect(isWorkspacePath('/store/abc/orders')).toBe(true);
    expect(isWorkspacePath('/pk/store/abc/orders')).toBe(true);
    expect(isWorkspacePath('/admin/finance')).toBe(true);
    expect(isWorkspacePath('/pricing')).toBe(false);
    expect(isWorkspacePath('/storefront')).toBe(false);
    expect(isWorkspacePath('/product/x')).toBe(false);
  });

  it('keeps background writes quiet', () => {
    expect(isQuietPath('/api/storefront-analytics/session')).toBe(true);
    expect(isQuietPath('/api/notifications/mark-read')).toBe(true);
    expect(isQuietPath('/api/products/add-physical-product')).toBe(false);
  });

  it('builds a success message', () => {
    expect(successMessage('patch', { message: 'Product updated successfully' })).toBe('Product updated successfully');
    expect(successMessage('delete', { success: true })).toBe('Deleted');
    expect(successMessage('post', { message: 'OK' })).toBe('Created');
    expect(successMessage('put', { message: 'sections.1.settings broke' })).toBe('Saved');
  });

  it('describes every error type', () => {
    const base = { online: true, isNetworkError: false };
    expect(describeError({ ...base, status: 400, message: ['name should not be empty', 'price must be a number', 'x'] }).message).toBe('name should not be empty. price must be a number');
    expect(describeError({ ...base, status: 401 }).message).toMatch(/session/);
    expect(describeError({ ...base, status: 403, message: 'Forbidden' }).message).toMatch(/permission/);
    expect(describeError({ ...base, status: 404 }).key).toMatch(/^notfound/);
    expect(describeError({ ...base, status: 409, message: 'SKU already exists' }).message).toBe('SKU already exists');
    expect(describeError({ ...base, status: 429 }).key).toBe('ratelimit');
    expect(describeError({ ...base, status: 500, message: 'MongoServerError: x' }).message).toMatch(/our side/);
    expect(describeError({ isNetworkError: true, online: false }).key).toBe('offline');
    expect(describeError({ isNetworkError: true, online: true, code: 'ECONNABORTED' }).key).toBe('timeout');
    expect(describeError({ isNetworkError: true, online: true }).key).toBe('network');
  });

  it('flattens messages', () => {
    expect(flattenMessage(undefined)).toBe('');
    expect(flattenMessage(' hi ')).toBe('hi');
  });

  it('toasts reads only for big problems', () => {
    expect(shouldToastError({ method: 'get', status: 404, isNetworkError: false, authAttempt: false })).toBe(false);
    expect(shouldToastError({ method: 'get', status: 500, isNetworkError: false, authAttempt: false })).toBe(true);
    expect(shouldToastError({ method: 'get', isNetworkError: true, authAttempt: false })).toBe(true);
    expect(shouldToastError({ method: 'post', status: 400, isNetworkError: false, authAttempt: false })).toBe(true);
    expect(shouldToastError({ method: 'post', status: 401, isNetworkError: false, authAttempt: true })).toBe(false);
  });
});
