import '@testing-library/jest-dom/vitest'; // adds the toBeInTheDocument/toHaveValue... matcher types
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';

const api = vi.hoisted(() => ({ apiResendOrderEmail: vi.fn(), apiAddOrderComment: vi.fn() }));
vi.mock('@/api/services/orders', () => api);

import { OrderTimelineCard } from './OrderTimelineCard';
import type { OrderTimelineEntry } from '@/api/services/product';

const entries: OrderTimelineEntry[] = [
  { type: 'email', message: 'Shipping confirmation email sent to sara@x.com', actorId: null, actorRole: 'system', createdAt: new Date().toISOString() },
  { type: 'email', message: 'Refund email to sara@x.com could not be delivered', actorId: null, actorRole: 'system', createdAt: new Date().toISOString() },
  { type: 'placed', message: 'Order placed', actorId: null, actorRole: 'user', createdAt: new Date().toISOString() },
];

const baseProps = { storeId: 'store-1', orderId: 'order-1', entries, currentUserId: 'seller-1', canComment: false, onPosted: vi.fn() };

afterEach(() => cleanup());
beforeEach(() => { api.apiResendOrderEmail.mockReset(); api.apiAddOrderComment.mockReset(); });

describe('OrderTimelineCard — email entries and Resend', () => {
  it('shows each customer email on the timeline, including one that could not be delivered', () => {
    render(<OrderTimelineCard {...baseProps} />);
    expect(screen.getByText('Shipping confirmation email sent to sara@x.com')).toBeInTheDocument();
    expect(screen.getByText('Refund email to sara@x.com could not be delivered')).toBeInTheDocument();
  });

  it('has no Resend control unless the person may edit orders', () => {
    render(<OrderTimelineCard {...baseProps} canResend={false} />);
    expect(screen.queryByLabelText('Customer email to resend')).toBeNull();
  });

  it('offers shipping confirmation for a normal order and "Ready for pickup" for a pickup order', () => {
    const { rerender } = render(<OrderTimelineCard {...baseProps} canResend isPickup={false} />);
    const options = () => Array.from(screen.getByLabelText('Customer email to resend').querySelectorAll('option')).map(o => o.textContent);
    expect(options()).toEqual(['Resend an email to the customer…', 'Order confirmation', 'Shipping confirmation', 'Delivered', 'Order canceled', 'Refund']);
    rerender(<OrderTimelineCard {...baseProps} canResend isPickup />);
    expect(options()).toEqual(['Resend an email to the customer…', 'Order confirmation', 'Ready for pickup', 'Picked up', 'Order canceled', 'Refund']);
  });

  it('keeps Send disabled until an email is chosen, then sends it and reloads the order', async () => {
    api.apiResendOrderEmail.mockResolvedValue({ success: true, message: 'Email sent' });
    const onResent = vi.fn();
    render(<OrderTimelineCard {...baseProps} canResend onResent={onResent} />);
    const send = screen.getByRole('button', { name: 'Send' });
    expect(send).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Customer email to resend'), { target: { value: 'order_shipped' } });
    expect(send).toBeEnabled();
    fireEvent.click(send);
    expect(await screen.findByText('Email sent to the customer.')).toBeInTheDocument();
    expect(api.apiResendOrderEmail).toHaveBeenCalledWith('store-1', 'order-1', 'order_shipped');
    expect(onResent).toHaveBeenCalledTimes(1);
    expect(screen.getByLabelText('Customer email to resend')).toHaveValue('');
  });

  it('shows the server\'s reason when the resend is refused, and does not reload', async () => {
    api.apiResendOrderEmail.mockRejectedValue(new Error('This order has not shipped yet.'));
    const onResent = vi.fn();
    render(<OrderTimelineCard {...baseProps} canResend onResent={onResent} />);
    fireEvent.change(screen.getByLabelText('Customer email to resend'), { target: { value: 'order_shipped' } });
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('This order has not shipped yet.');
    await waitFor(() => expect(onResent).not.toHaveBeenCalled());
  });
});
