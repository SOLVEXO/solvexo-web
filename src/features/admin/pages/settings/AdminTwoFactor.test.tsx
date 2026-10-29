import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({
  apiAdminTwoFactorStatus: vi.fn(), apiStartAdminTwoFactor: vi.fn(), apiEnableAdminTwoFactor: vi.fn(),
  apiDisableAdminTwoFactor: vi.fn(), apiNewAdminRecoveryCodes: vi.fn(),
}));
vi.mock('@/api/services/adminTeam', () => api);
const toast = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn(), info: vi.fn() }));
vi.mock('@/contexts/ToastContext', () => ({ useToast: () => toast }));
vi.mock('qrcode', () => ({ default: { toDataURL: vi.fn(async () => 'data:image/png;base64,QR') } }));

import { AdminTwoFactor } from './AdminTwoFactor';

const CODES = ['ABCDE-FGHJK', 'LMNPQ-RSTUV'];

afterEach(() => cleanup());
beforeEach(() => { Object.values(api).forEach(f => f.mockReset()); Object.values(toast).forEach(f => f.mockReset()); });

describe('AdminTwoFactor', () => {
  it('turns two-factor on: QR + manual key, then the code, then shows the recovery codes once', async () => {
    api.apiAdminTwoFactorStatus
      .mockResolvedValueOnce({ data: { enabled: false, enabledAt: null, recoveryCodesLeft: 0 } })
      .mockResolvedValue({ data: { enabled: true, enabledAt: '2026-10-29T00:00:00Z', recoveryCodesLeft: 10 } });
    api.apiStartAdminTwoFactor.mockResolvedValue({ data: { secret: 'JBSWY3DPEHPK3PXP', otpauthUri: 'otpauth://totp/x', issuer: 'Solvexo Admin', account: 'o@s.test' } });
    api.apiEnableAdminTwoFactor.mockResolvedValue({ data: { recoveryCodes: CODES } });

    render(<AdminTwoFactor />);
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on' }));
    expect(await screen.findByAltText(/QR code/)).toHaveAttribute('src', 'data:image/png;base64,QR');
    expect(screen.getByText('JBSW Y3DP EHPK 3PXP')).toBeInTheDocument();

    const verify = screen.getByRole('button', { name: 'Verify and turn on' });
    expect(verify).toBeDisabled();
    fireEvent.change(screen.getByLabelText('6-digit code'), { target: { value: '123 456' } });
    expect(verify).toBeEnabled();
    fireEvent.click(verify);

    await waitFor(() => expect(api.apiEnableAdminTwoFactor).toHaveBeenCalledWith('123456'));
    expect(await screen.findByText('Save your recovery codes')).toBeInTheDocument();
    CODES.forEach(c => expect(screen.getByText(c)).toBeInTheDocument());
    expect(await screen.findByText(/10 recovery codes left/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: "I've saved them" }));
    expect(screen.queryByText('Save your recovery codes')).toBeNull();
  });

  it('turning off asks for the password and a code', async () => {
    api.apiAdminTwoFactorStatus.mockResolvedValue({ data: { enabled: true, enabledAt: null, recoveryCodesLeft: 2 } });
    api.apiDisableAdminTwoFactor.mockResolvedValue({ success: true });

    render(<AdminTwoFactor />);
    expect(await screen.findByText(/running low on recovery codes/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Turn off' }));

    const confirm = screen.getByRole('button', { name: 'Turn off' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pw' } });
    fireEvent.change(screen.getByLabelText('Code'), { target: { value: 'abcde-fghjk' } });
    fireEvent.click(confirm);
    await waitFor(() => expect(api.apiDisableAdminTwoFactor).toHaveBeenCalledWith('pw', 'ABCDE-FGHJK'));
    expect(toast.success).toHaveBeenCalledWith('Two-factor sign-in is off.');
  });

  it('shows the server message when the setup code is wrong', async () => {
    api.apiAdminTwoFactorStatus.mockResolvedValue({ data: { enabled: false, enabledAt: null, recoveryCodesLeft: 0 } });
    api.apiStartAdminTwoFactor.mockResolvedValue({ data: { secret: 'JBSWY3DPEHPK3PXP', otpauthUri: 'otpauth://totp/x', issuer: 'Solvexo Admin', account: 'o@s.test' } });
    api.apiEnableAdminTwoFactor.mockRejectedValue(new Error("That code didn't match."));

    render(<AdminTwoFactor />);
    fireEvent.click(await screen.findByRole('button', { name: 'Turn on' }));
    fireEvent.change(await screen.findByLabelText('6-digit code'), { target: { value: '000000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Verify and turn on' }));
    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("That code didn't match."));
    expect(screen.queryByText('Save your recovery codes')).toBeNull();
  });
});
