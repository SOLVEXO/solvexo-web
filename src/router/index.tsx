import { createBrowserRouter, Navigate } from 'react-router-dom';

// Root wrapper (reference nav + outlet)
import { RootLayout }       from '@/components/layouts/RootLayout';

// Layouts
import { PublicLayout }     from '@/components/layouts/PublicLayout';
import { SellerLayout }     from '@/components/layouts/SellerLayout';
import { AdminLayout }      from '@/components/layouts/AdminLayout';

// ── Public / Buyer Pages ──────────────────────────────────────────────────────
import { Homepage }             from '@/features/buyer/pages/Homepage';
import { Marketplace }          from '@/features/buyer/pages/Marketplace';
import { ProductDetail }        from '@/features/buyer/pages/ProductDetail';
import { SellerStorefront }     from '@/features/buyer/pages/SellerStorefront';
import { EducationMarketplace } from '@/features/buyer/pages/EducationMarketplace';
import { PricingPage }          from '@/features/buyer/pages/PricingPage';
import { ForSellersPage }       from '@/features/buyer/pages/ForSellersPage';

// ── Auth ──────────────────────────────────────────────────────────────────────
import { LoginPage }            from '@/features/auth/pages/LoginPage';
import { AdminLoginPage }       from '@/features/auth/pages/admin/AdminLoginPage';
import { RegisterPage }         from '@/features/auth/pages/RegisterPage';
import { OnboardingPage }       from '@/features/auth/pages/onboard/OnboardingPage';
import { ForgotPasswordPage }   from '@/features/auth/pages/ForgotPasswordPage';
import { VerifyOTPPage }        from '@/features/auth/pages/VerifyOTPPage';
import { NewPasswordPage }      from '@/features/auth/pages/NewPasswordPage';

// ── Seller Pages ──────────────────────────────────────────────────────────────
import { SellerDashboard }    from '@/features/seller/pages/SellerDashboard';
import { SellerProducts }     from '@/features/seller/pages/SellerProducts';
import { AddProduct }         from '@/features/seller/pages/AddProduct';
import { DigitalUpload }      from '@/features/seller/pages/DigitalUpload';
import { SellerOrders }       from '@/features/seller/pages/SellerOrders';
import { SellerInventory }    from '@/features/seller/pages/SellerInventory';
import { SellerAnalytics }    from '@/features/seller/pages/SellerAnalytics';
import { SellerAIStudio }     from '@/features/seller/pages/SellerAIStudio';
import { SellerCustomers }    from '@/features/seller/pages/SellerCustomers';
import { SellerMarketing }    from '@/features/seller/pages/SellerMarketing';
import { SellerCategories }   from '@/features/seller/pages/SellerCategories';
import { StoreBuilder }       from '@/features/seller/pages/storemodule/StoreBuilder';
import { SellerSettings }     from '@/features/seller/pages/SellerSettings';
import { POSRegister }        from '@/features/seller/pos/POSRegister';
import { SellerReturns }      from '@/features/seller/pages/SellerReturns';
import { SellerSEO }          from '@/features/seller/pages/SellerSEO';
import { SellerFinance }      from '@/features/seller/pages/SellerFinance';
import { SellerShipping }     from '@/features/seller/pages/SellerShipping';
import { SellerMessages }     from '@/features/seller/pages/SellerMessages';
import { SellerReviews }      from '@/features/seller/pages/SellerReviews';
import { SellerLoyalty }      from '@/features/seller/pages/SellerLoyalty';
import { SellerSubscriptions } from '@/features/seller/pages/SellerSubscriptions';
import { SellerIntegrations } from '@/features/seller/pages/SellerIntegrations';
import { SellerActivity }     from '@/features/seller/pages/SellerActivity';
import { SellerStoreList } from '@/features/seller/pages/storemodule/SellerStoreList';

// ── Store Workspace (own layout, own sidebar) ─────────────────────────────────
import { StoreLayout }    from '@/components/layouts/StoreLayout';
import StoreDashboard     from '@/features/store/pages/StoreDashboard';
import StoreOrders        from '@/features/store/pages/StoreOrders';
import StoreProducts      from '@/features/store/pages/StoreProducts';
import StoreCustomers     from '@/features/store/pages/StoreCustomers';
import StoreAnalytics     from '@/features/store/pages/StoreAnalytics';
import StoreSettings      from '@/features/store/pages/StoreSettings';

// ── Admin Pages ───────────────────────────────────────────────────────────────
import { AdminOverview }      from '@/features/admin/pages/AdminOverview';
import { AdminUsers }         from '@/features/admin/pages/AdminUsers';
import { AdminModeration }    from '@/features/admin/pages/AdminModeration';
import { AdminMarketplace }   from '@/features/admin/pages/AdminMarketplace';
import { AdminFinance }       from '@/features/admin/pages/AdminFinance';
import { AdminAnnouncements } from '@/features/admin/pages/AdminAnnouncements';
import { AdminConfig }        from '@/features/admin/pages/AdminConfig';

export const router = createBrowserRouter([
  {
    // RootLayout wraps EVERYTHING — adds the reference nav bar at top
    element: <RootLayout />,
    children: [

      // ── Public pages with PublicLayout navbar ─────────────────────────
      {
        path: '/',
        element: <PublicLayout />,
        children: [
          { index: true,     element: <Homepage /> },
          { path: 'pricing', element: <PricingPage /> },
          { path: 'sellers', element: <ForSellersPage /> },
        ],
      },

      // ── Marketplace pages — own embedded nav ──────────────────────────
      { path: '/marketplace',     element: <Marketplace /> },
      { path: '/marketplace/:id', element: <ProductDetail /> },
      { path: '/store/:slug',     element: <SellerStorefront /> },
      { path: '/education',       element: <EducationMarketplace /> },

      // ── Auth ──────────────────────────────────────────────────────────
      { path: '/login',           element: <LoginPage /> },
      { path: '/admin/login',     element: <AdminLoginPage /> },
      { path: '/register',        element: <RegisterPage /> },
      { path: '/onboarding',      element: <OnboardingPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/verify-otp',      element: <VerifyOTPPage /> },
      { path: '/new-password',    element: <NewPasswordPage /> },

      // ── POS — standalone (no seller sidebar) ──────────────────────────
      { path: '/seller/pos',      element: <POSRegister /> },

      // ── Seller pages with dark sidebar ────────────────────────────────
      {
        path: '/seller',
        element: <SellerLayout />,
        children: [
          { index: true,              element: <Navigate to="/seller/dashboard" replace /> },
          { path: 'dashboard',        element: <SellerDashboard /> },
          { path: 'products',         element: <SellerProducts /> },
          { path: 'products/add',     element: <AddProduct /> },
          { path: 'products/digital', element: <DigitalUpload /> },
          { path: 'orders',           element: <SellerOrders /> },
          { path: 'returns',          element: <SellerReturns /> },
          { path: 'inventory',        element: <SellerInventory /> },
          { path: 'analytics',        element: <SellerAnalytics /> },
          { path: 'seo',              element: <SellerSEO /> },
          { path: 'ai',               element: <SellerAIStudio /> },
          { path: 'customers',        element: <SellerCustomers /> },
          { path: 'loyalty',          element: <SellerLoyalty /> },
          { path: 'subscriptions',    element: <SellerSubscriptions /> },
          { path: 'marketing',        element: <SellerMarketing /> },
          { path: 'finance',          element: <SellerFinance /> },
          { path: 'shipping',         element: <SellerShipping /> },
          { path: 'messages',         element: <SellerMessages /> },
          { path: 'reviews',          element: <SellerReviews /> },
          { path: 'integrations',     element: <SellerIntegrations /> },
          { path: 'activity',         element: <SellerActivity /> },
          { path: 'stores',             element: <SellerStoreList /> },
          { path: 'store',            element: <StoreBuilder /> },
          { path: 'settings',         element: <SellerSettings /> },
          { path: 'categories',       element: <SellerCategories /> },
        ],
      },

      // ── Store Workspace (each store's own mini-admin panel) ──────────
      {
        path: '/seller/store/:storeId',
        element: <StoreLayout />,
        children: [
          { index: true,            element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard',      element: <StoreDashboard /> },
          { path: 'orders',         element: <StoreOrders /> },
          { path: 'products',       element: <StoreProducts /> },
          { path: 'customers',      element: <StoreCustomers /> },
          { path: 'analytics',      element: <StoreAnalytics /> },
          { path: 'settings',       element: <StoreSettings /> },
        ],
      },

      // ── Admin pages ───────────────────────────────────────────────────
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true,           element: <AdminOverview /> },
          { path: 'users',         element: <AdminUsers /> },
          { path: 'moderation',    element: <AdminModeration /> },
          { path: 'marketplace',   element: <AdminMarketplace /> },
          { path: 'finance',       element: <AdminFinance /> },
          { path: 'announcements', element: <AdminAnnouncements /> },
          { path: 'config',        element: <AdminConfig /> },
        ],
      },

      // ── 404 ───────────────────────────────────────────────────────────
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
