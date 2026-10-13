import '@testing-library/jest-dom/vitest'; // adds the toBeInTheDocument/toHaveValue... matcher types
import { afterEach, describe, it, expect, vi, beforeEach } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { StoreNotificationSettings } from '@/api/services/storeNotifications';

const api = vi.hoisted(() => ({
  apiGetStoreNotificationSettings: vi.fn(),
  apiUpdateStoreNotificationSettings: vi.fn(),
  apiPreviewCustomerEmail: vi.fn(),
  apiSendTestCustomerEmail: vi.fn(),
}));
vi.mock('@/api/services/storeNotifications', () => api);
// The seller's own inbox/preferences panel has its own context + tests; here it is only a marker.
vi.mock('@/components/comman/ui/NotificationsPanel', () => ({ NotificationsPanel: () => <div data-testid="my-alerts-panel">my alerts</div> }));

import { NotificationsHub } from './NotificationsHub';

const email = (key: string, group: 'orders' | 'returns' | 'invoices', over: Record<string, unknown> = {}) => ({
  key, group, label: `${key} label`, description: `${key} description`, variables: ['orderNumber', 'customerName'], resendable: true,
  canDisable: true, defaultSubject: `Default subject ${key}`, defaultBody: `Default body ${key}`, enabled: true, subject: null, body: null, customized: false, ...over,
});

function makeSettings(over: Partial<StoreNotificationSettings> = {}): StoreNotificationSettings {
  return {
    senderName: null, replyToEmail: null, staffOrderEmails: [], accentColor: null, footerText: null, showLogo: true, storeLogo: null,
    deliveryWarning: null, storeName: 'First Store', storeContactEmail: 'info@first.store',
    events: [
      email('order_confirmation', 'orders'),
      email('order_shipped', 'orders', { customized: true, subject: 'My subject', body: 'My body' }),
      email('return_update', 'returns', { enabled: false }),
      email('gift_card', 'invoices', { canDisable: false }),
    ] as unknown as StoreNotificationSettings['events'],
    ...over,
  };
}

const PREVIEW = { subject: 'Rendered subject', html: '<p>hello</p>', fromName: 'First Store', replyTo: 'info@first.store' };

function renderHub(props: Partial<{ canManage: boolean }> = {}) {
  return render(
    <MemoryRouter>
      <NotificationsHub storeId="store-1" canManage={props.canManage ?? true} />
    </MemoryRouter>,
  );
}

afterEach(() => cleanup());

beforeEach(() => {
  Object.values(api).forEach(f => f.mockReset());
  api.apiGetStoreNotificationSettings.mockResolvedValue({ success: true, data: makeSettings() });
  api.apiPreviewCustomerEmail.mockResolvedValue({ success: true, data: PREVIEW });
  api.apiUpdateStoreNotificationSettings.mockImplementation(async () => ({ success: true, data: makeSettings() }));
});

describe('NotificationsHub — Customer emails list', () => {
  it('shows a loading state, then the emails grouped under Orders / Returns / Invoices with a summary', async () => {
    renderHub();
    expect(screen.getByLabelText('Loading customer emails')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Returns & exchanges' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Invoices & gift cards' })).toBeInTheDocument();
    expect(screen.getByText(/4 emails · 1 customized · 1 off/)).toBeInTheDocument();
    expect(screen.getByText('Customized')).toBeInTheDocument();
    expect(screen.getByText('Off')).toBeInTheDocument();
    expect(screen.getByText('Always sent')).toBeInTheDocument();
  });

  it('shows an error with Retry, and recovers', async () => {
    api.apiGetStoreNotificationSettings.mockRejectedValueOnce(new Error('Network down'));
    renderHub();
    expect(await screen.findByRole('alert')).toHaveTextContent('Network down');
    fireEvent.click(screen.getByRole('button', { name: 'Retry' }));
    expect(await screen.findByRole('heading', { name: 'Orders' })).toBeInTheDocument();
    expect(api.apiGetStoreNotificationSettings).toHaveBeenCalledTimes(2);
  });

  it('switches an email off right away and saves it', async () => {
    renderHub();
    const toggle = await screen.findByRole('switch', { name: 'Send the "order_confirmation label" email' });
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'false'); // optimistic
    await waitFor(() => expect(api.apiUpdateStoreNotificationSettings).toHaveBeenCalledWith('store-1', { events: { order_confirmation: { enabled: false } } }));
  });

  it('rolls the switch back and says why when the save fails', async () => {
    api.apiUpdateStoreNotificationSettings.mockRejectedValueOnce(new Error('Server said no'));
    renderHub();
    const toggle = await screen.findByRole('switch', { name: 'Send the "order_confirmation label" email' });
    fireEvent.click(toggle);
    expect(await screen.findByText('Server said no')).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-checked', 'true');
  });

  it('has no switch for an email that is always sent', async () => {
    renderHub();
    await screen.findByText('Always sent');
    expect(screen.queryByRole('switch', { name: /gift_card/ })).toBeNull();
  });

  it('warns when customer emails are failing to deliver', async () => {
    api.apiGetStoreNotificationSettings.mockResolvedValue({ success: true, data: makeSettings({ deliveryWarning: { consecutiveFailures: 4, lastFailureAt: null } }) });
    renderHub();
    expect(await screen.findByRole('alert')).toHaveTextContent('last 4 emails');
  });
});

describe('NotificationsHub — editing one email', () => {
  async function openEditor(name = 'Edit the "order_confirmation label" email') {
    renderHub();
    fireEvent.click(await screen.findByRole('button', { name }));
    return screen.findByRole('dialog');
  }

  it('opens the editor from a click anywhere on the row, with the current text and a live preview', async () => {
    const dialog = await openEditor();
    expect(within(dialog).getByLabelText('Subject')).toHaveValue('Default subject order_confirmation');
    expect(within(dialog).getByLabelText('Message')).toHaveValue('Default body order_confirmation');
    await waitFor(() => expect(within(dialog).getByTitle('Email preview')).toBeInTheDocument(), { timeout: 3000 });
    expect(api.apiPreviewCustomerEmail).toHaveBeenCalledWith('store-1', { event: 'order_confirmation', subject: 'Default subject order_confirmation', body: 'Default body order_confirmation' });
    expect(within(dialog).getByText('Rendered subject')).toBeInTheDocument();
  });

  it('re-renders the preview after typing and ignores nothing it needs', async () => {
    const dialog = await openEditor();
    await waitFor(() => expect(api.apiPreviewCustomerEmail).toHaveBeenCalledTimes(1), { timeout: 3000 });
    fireEvent.change(within(dialog).getByLabelText('Subject'), { target: { value: 'Brand new subject' } });
    await waitFor(() => expect(api.apiPreviewCustomerEmail).toHaveBeenLastCalledWith('store-1', expect.objectContaining({ subject: 'Brand new subject' })), { timeout: 3000 });
  });

  it('shows the server\'s message in the preview when a placeholder is wrong', async () => {
    api.apiPreviewCustomerEmail.mockRejectedValue(new Error('Message: unknown placeholder {{nope}}'));
    const dialog = await openEditor();
    expect(await within(dialog).findByText(/unknown placeholder/, undefined, { timeout: 3000 })).toBeInTheDocument();
  });

  it('inserts a placeholder into the message', async () => {
    const dialog = await openEditor();
    const message = within(dialog).getByLabelText('Message') as HTMLTextAreaElement;
    fireEvent.change(message, { target: { value: 'Hi ' } });
    fireEvent.click(within(dialog).getByRole('button', { name: '{{customerName}}' }));
    expect(message.value).toContain('{{customerName}}');
  });

  it('keeps Save disabled until something changed, then saves the new text and closes', async () => {
    const dialog = await openEditor();
    const save = within(dialog).getByRole('button', { name: 'Save' });
    expect(save).toBeDisabled();
    fireEvent.change(within(dialog).getByLabelText('Subject'), { target: { value: '  Hello {{orderNumber}}  ' } });
    expect(save).toBeEnabled();
    fireEvent.click(save);
    await waitFor(() => expect(api.apiUpdateStoreNotificationSettings).toHaveBeenCalledWith('store-1', { events: { order_confirmation: { subject: 'Hello {{orderNumber}}', body: 'Default body order_confirmation' } } }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('saving text that equals the built-in default stores nothing (reset)', async () => {
    const dialog = await openEditor();
    const subject = within(dialog).getByLabelText('Subject');
    fireEvent.change(subject, { target: { value: 'something else' } });
    fireEvent.change(subject, { target: { value: 'Default subject order_confirmation ' } });
    // same as the default again, but the text field is "dirty" only if it differs from what was loaded
    fireEvent.change(within(dialog).getByLabelText('Message'), { target: { value: 'edited' } });
    fireEvent.change(within(dialog).getByLabelText('Message'), { target: { value: 'Default body order_confirmation' } });
    fireEvent.change(subject, { target: { value: 'Default subject order_confirmation ' } });
    // trailing space = differs from the loaded value → dirty; trimmed text equals the default → reset
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.apiUpdateStoreNotificationSettings).toHaveBeenCalledWith('store-1', { events: { order_confirmation: { reset: true } } }));
  });

  it('"Reset to default" is offered only for a customized email and resets it', async () => {
    const dialog = await openEditor('Edit the "order_shipped label" email');
    fireEvent.click(within(dialog).getByRole('button', { name: /Reset to default/ }));
    await waitFor(() => expect(api.apiUpdateStoreNotificationSettings).toHaveBeenCalledWith('store-1', { events: { order_shipped: { reset: true } } }));
  });

  it('does not offer reset for an email that was never customized', async () => {
    const dialog = await openEditor();
    expect(within(dialog).queryByRole('button', { name: /Reset to default/ })).toBeNull();
  });

  it('shows the server error and stays open when saving fails', async () => {
    api.apiUpdateStoreNotificationSettings.mockRejectedValueOnce(new Error('Subject: unknown placeholder {{x}}'));
    const dialog = await openEditor();
    fireEvent.change(within(dialog).getByLabelText('Subject'), { target: { value: 'oops {{x}}' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByText(/unknown placeholder/)).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('asks before throwing away unsaved edits; clean close is immediate', async () => {
    const dialog = await openEditor();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull()); // nothing changed → closes

    fireEvent.click(await screen.findByRole('button', { name: 'Edit the "order_confirmation label" email' }));
    const again = await screen.findByRole('dialog');
    fireEvent.change(within(again).getByLabelText('Subject'), { target: { value: 'changed' } });
    fireEvent.click(within(again).getByRole('button', { name: 'Cancel' }));
    const confirm = await screen.findByRole('alertdialog');
    fireEvent.click(within(confirm).getByRole('button', { name: 'Keep editing' }));
    expect(screen.queryByRole('alertdialog')).toBeNull();
    fireEvent.click(within(again).getByRole('button', { name: 'Cancel' }));
    fireEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Discard' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(api.apiUpdateStoreNotificationSettings).not.toHaveBeenCalled();
  });

  it('sends a test email of the unsaved draft to the person clicking, and reports the result', async () => {
    api.apiSendTestCustomerEmail.mockResolvedValue({ success: true, message: 'Test email sent to me@shop.test.', data: { to: 'me@shop.test' } });
    const dialog = await openEditor();
    fireEvent.change(within(dialog).getByLabelText('Subject'), { target: { value: 'Draft subject' } });
    fireEvent.click(within(dialog).getByRole('button', { name: /Send test email/ }));
    expect(await within(dialog).findByText('Test email sent to me@shop.test.')).toBeInTheDocument();
    expect(api.apiSendTestCustomerEmail).toHaveBeenCalledWith('store-1', { event: 'order_confirmation', subject: 'Draft subject', body: 'Default body order_confirmation' });
  });

  it('shows why a test email could not be sent', async () => {
    api.apiSendTestCustomerEmail.mockRejectedValue(new Error('The test email could not be sent.'));
    const dialog = await openEditor();
    fireEvent.click(within(dialog).getByRole('button', { name: /Send test email/ }));
    expect(await within(dialog).findByText('The test email could not be sent.')).toBeInTheDocument();
  });
});

describe('NotificationsHub — Look & sender', () => {
  async function openLook() {
    renderHub();
    await screen.findByRole('heading', { name: 'Orders' });
    fireEvent.click(screen.getByRole('button', { name: /Look & sender/ }));
    return screen.findByRole('heading', { name: 'Appearance' });
  }

  it('shows the current values and no save bar until something changes', async () => {
    api.apiGetStoreNotificationSettings.mockResolvedValue({ success: true, data: makeSettings({ senderName: 'Team', replyToEmail: 'help@first.store', accentColor: '#2563eb', footerText: 'Karachi' }) });
    await openLook();
    expect(screen.getByLabelText('Sender name')).toHaveValue('Team');
    expect(screen.getByLabelText('Reply-to email')).toHaveValue('help@first.store');
    expect(screen.getByLabelText('Email colour')).toHaveValue('#2563eb');
    expect(screen.getByLabelText('Footer line (optional)')).toHaveValue('Karachi');
    expect(screen.queryByText('You have unsaved changes')).toBeNull();
  });

  it('shows the unsaved-changes bar, validates before saving, then saves exactly the edited fields', async () => {
    await openLook();
    fireEvent.change(screen.getByLabelText('Reply-to email'), { target: { value: 'not-an-email' } });
    expect(await screen.findByText('You have unsaved changes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument();
    expect(api.apiUpdateStoreNotificationSettings).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText('Reply-to email'), { target: { value: 'Help@First.store' } });
    fireEvent.change(screen.getByLabelText('Sender name'), { target: { value: ' First Store Team ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Use colour #2563eb' }));
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(api.apiUpdateStoreNotificationSettings).toHaveBeenCalledWith('store-1', {
      senderName: 'First Store Team', replyToEmail: 'Help@First.store', showLogo: true, accentColor: '#2563eb', footerText: null, staffOrderEmails: [],
    }));
  });

  it('rejects a bad colour and a bad extra recipient without calling the server', async () => {
    await openLook();
    fireEvent.change(screen.getByLabelText('Email colour'), { target: { value: 'red' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByText('Use a colour like #d97757.')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Email colour'), { target: { value: '' } });
    const staff = screen.getByPlaceholderText('Type an email, press Enter');
    fireEvent.change(staff, { target: { value: 'broken' } });
    fireEvent.keyDown(staff, { key: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/"broken" is not a valid email address/)).toBeInTheDocument();
    expect(api.apiUpdateStoreNotificationSettings).not.toHaveBeenCalled();
  });

  it('Discard puts every field back', async () => {
    await openLook();
    fireEvent.change(screen.getByLabelText('Sender name'), { target: { value: 'Changed' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Discard' }));
    expect(screen.getByLabelText('Sender name')).toHaveValue('');
    expect(screen.queryByText('You have unsaved changes')).toBeNull();
  });

  it('shows the server error and keeps the edits when saving fails', async () => {
    api.apiUpdateStoreNotificationSettings.mockRejectedValueOnce(new Error('accentColor must look like #d97757'));
    await openLook();
    fireEvent.change(screen.getByLabelText('Sender name'), { target: { value: 'Keep me' } });
    fireEvent.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByText('accentColor must look like #d97757')).toBeInTheDocument();
    expect(screen.getByLabelText('Sender name')).toHaveValue('Keep me');
  });

  it('keeps unsaved edits when you switch panes and come back', async () => {
    await openLook();
    fireEvent.change(screen.getByLabelText('Sender name'), { target: { value: 'Draft name' } });
    fireEvent.click(screen.getByRole('button', { name: /Customer emails/ }));
    fireEvent.click(screen.getByRole('button', { name: /Look & sender/ }));
    expect(screen.getByLabelText('Sender name')).toHaveValue('Draft name');
  });
});

describe('NotificationsHub — permissions and My alerts', () => {
  it('without manage permission shows only the person\'s own alerts (no tabs, no settings call)', async () => {
    renderHub({ canManage: false });
    expect(await screen.findByTestId('my-alerts-panel')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Customer emails/ })).toBeNull();
    expect(api.apiGetStoreNotificationSettings).not.toHaveBeenCalled();
  });

  it('the My alerts tab shows the preferences panel', async () => {
    renderHub();
    await screen.findByRole('heading', { name: 'Orders' });
    fireEvent.click(screen.getByRole('button', { name: /My alerts/ }));
    expect(await screen.findByTestId('my-alerts-panel')).toBeInTheDocument();
  });
});

import { axe } from 'vitest-axe';

describe('NotificationsHub — accessibility (axe)', () => {
  it('the Customer emails list has no violations', async () => {
    const { container } = renderHub();
    await screen.findByRole('heading', { name: 'Orders' });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the Look & sender form has no violations', async () => {
    const { container } = renderHub();
    await screen.findByRole('heading', { name: 'Orders' });
    fireEvent.click(screen.getByRole('button', { name: /Look & sender/ }));
    await screen.findByRole('heading', { name: 'Appearance' });
    expect(await axe(container)).toHaveNoViolations();
  });

  it('the email editor dialog has no violations', async () => {
    renderHub();
    fireEvent.click(await screen.findByRole('button', { name: 'Edit the "order_confirmation label" email' }));
    const dialog = await screen.findByRole('dialog');
    await waitFor(() => expect(within(dialog).getByTitle('Email preview')).toBeInTheDocument(), { timeout: 3000 });
    expect(await axe(dialog, { iframes: false })).toHaveNoViolations();
  });
});
