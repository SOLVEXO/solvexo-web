import { createBrowserRouter, Navigate } from 'react-router-dom';

// Root wrapper (reference nav + outlet)
import { RootLayout }       from '@/components/layouts/RootLayout';

// Layouts
import { PublicLayout }     from '@/components/layouts/PublicLayout';
import { SellerLayout }     from '@/components/layouts/SellerLayout';
import { AdminLayout }      from '@/components/layouts/AdminLayout';

// ── Public / Buyer Pages ──────────────────────────────────────────────────────
import { Homepage }             from '@/features/buyer/pages/Homepage';
import { UserProfile }          from '@/features/buyer/pages/settings/UserProfile';
import { Marketplace }          from '@/features/buyer/pages/Marketplace';
import { ProductDetail }        from '@/features/buyer/pages/ProductDetail';
import { CartPage }             from '@/features/buyer/pages/CartPage';
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
import { SellerDashboard }    from '@/features/seller/dashboard/SellerDashboard';
import { SellerInventory }    from '@/features/seller/dashboard/SellerInventory';
import { SellerMarketing }    from '@/features/seller/dashboard/SellerMarketing';
import { SellerCategories }   from '@/features/seller/dashboard/SellerCategories';
import { StoreBuilder }       from '@/features/seller/dashboard/storemodule/StoreBuilder';
import { SellerSettings }     from '@/features/seller/dashboard/settings/SellerSettings';
import { POSRegister }        from '@/features/seller/store/pos/POSRegister';
import { StoreSEO }          from '@/features/seller/store/seo/StoreSEO';
import { SellerShipping }     from '@/features/seller/dashboard/SellerShipping';
import { SellerMessages }     from '@/features/seller/dashboard/SellerMessages';
import { StoreReviews }      from '@/features/seller/store/reviews/reviews';
import { SellerLoyalty }      from '@/features/seller/dashboard/SellerLoyalty';
import { SellerSubscriptions } from '@/features/seller/dashboard/SellerSubscriptions';
import { SellerIntegrations } from '@/features/seller/dashboard/SellerIntegrations';
import { SellerActivity }     from '@/features/seller/dashboard/SellerActivity';
import { SellerStoreList } from '@/features/seller/dashboard/storemodule/SellerStoreList';

// ── Store Workspace (own layout, own sidebar) ─────────────────────────────────
import { StoreLayout }    from '@/components/layouts/StoreLayout';
import StoreDashboard     from '@/features/seller/store/StoreDashboard';
import StoreProductList   from '@/features/seller/store/products/StoreProductList';
import StoreAddProduct    from '@/features/seller/store/products/StoreAddProduct';
import StoreEditProduct   from '@/features/seller/store/products/StoreEditProduct';
import StoreProductDetail from '@/features/seller/store/products/StoreProductDetail';
import StoreCustomerList     from '@/features/seller/store/customer/CustomerList';
import StoreSettings      from '@/features/seller/store/StoreSettings';
import { StoreOrderList }     from '@/features/seller/store/orders/OrderList';
import { StoreReturnList }      from '@/features/seller/store/returns/ReturnList';
import { StoreAnalytics }    from '@/features/seller/store/analytics/Analytics';
import { StoreAIStudio }     from '@/features/seller/store/ai/AiStudio';
import { StoreFinance }      from '@/features/seller/store/finance/Finance';

// ── Admin Pages ───────────────────────────────────────────────────────────────
import { AdminOverview }      from '@/features/admin/pages/AdminOverview';
import { AdminUsers }         from '@/features/admin/pages/AdminUsers';
import { AdminModeration }    from '@/features/admin/pages/AdminModeration';
import { AdminMarketplace }   from '@/features/admin/pages/AdminMarketplace';
import { AdminFinance }       from '@/features/admin/pages/AdminFinance';
import { AdminAnnouncements } from '@/features/admin/pages/AdminAnnouncements';
import { AdminConfig }        from '@/features/admin/pages/AdminConfig';
import { AdminSettings }      from '@/features/admin/pages/settings/AdminSettings';

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
          { index: true,          element: <Homepage /> },
          { path: 'pricing',      element: <PricingPage /> },
          { path: 'sellers',      element: <ForSellersPage /> },
          { path: 'account/profile', element: <UserProfile /> },
        ],
      },

      // ── Marketplace pages — own embedded nav ──────────────────────────
      { path: '/marketplace',     element: <Marketplace /> },
      { path: '/cart',            element: <CartPage /> },
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
      { path: '/seller/store/:storeId/pos',      element: <POSRegister /> },

      // ── Seller pages with dark sidebar ────────────────────────────────
      {
        path: '/seller',
        element: <SellerLayout />,
        children: [
          { index: true,              element: <Navigate to="/seller/dashboard" replace /> },
          { path: 'dashboard',        element: <SellerDashboard /> },
          { path: 'inventory',        element: <SellerInventory /> },
          { path: 'loyalty',          element: <SellerLoyalty /> },
          { path: 'subscriptions',    element: <SellerSubscriptions /> },
          { path: 'marketing',        element: <SellerMarketing /> },
          { path: 'shipping',         element: <SellerShipping /> },
          { path: 'messages',         element: <SellerMessages /> },
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
          { path: 'orders',         element: <StoreOrderList /> },
          { path: 'products',                    element: <StoreProductList /> },
          { path: 'products/add',              element: <StoreAddProduct /> },
          { path: 'products/edit/:productId',   element: <StoreEditProduct /> },
          { path: 'products/detail/:productId', element: <StoreProductDetail /> },
          { path: 'customer/list',      element: <StoreCustomerList /> },
          { path: 'analytics',      element: <StoreAnalytics /> },
          { path: 'settings',       element: <StoreSettings /> },
          { path: 'storebuilder',  element: <StoreBuilder /> },
          { path: 'returns',          element: <StoreReturnList /> },
          { path: 'analytics',        element: <StoreAnalytics /> },
          { path: 'seo',              element: <StoreSEO /> },
          { path: 'ai/studio',               element: <StoreAIStudio /> },
          { path: 'reviews',          element: <StoreReviews /> },
          { path: 'finance',          element: <StoreFinance /> },

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
          { path: 'settings',      element: <AdminSettings /> },
        ],
      },

      // ── 404 ───────────────────────────────────────────────────────────
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
