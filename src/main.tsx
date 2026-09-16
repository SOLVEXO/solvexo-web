import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from '@/router';
import { CartProvider } from '@/contexts/CartContext';
import { WishlistProvider } from '@/contexts/WishlistContext';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { CurrencyPreferenceProvider } from '@/contexts/CurrencyPreferenceContext';
import { AuthGateProvider } from '@/contexts/AuthGateContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { captureSellerAcquisitionAttribution } from '@/utils/sellerAcquisitionAttribution';
import './index.css';

// Phase 9 — Merchant Acquisition Tracking. Must run here, once, on the
// very first page load of a fresh visit (before the router mounts) so a
// visitor arriving straight from an ad/campaign link with ?utm_* params —
// on ANY page, not only /register — has that touch captured immediately.
// Read back later, at seller-registration submit time, by RegisterPage.tsx.
captureSellerAcquisitionAttribution();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider>
      <AuthGateProvider>
        <CurrencyPreferenceProvider>
          <CartProvider>
            <WishlistProvider>
              <NotificationProvider>
                <RouterProvider router={router} />
              </NotificationProvider>
            </WishlistProvider>
          </CartProvider>
        </CurrencyPreferenceProvider>
      </AuthGateProvider>
    </ToastProvider>
  </StrictMode>,
);
