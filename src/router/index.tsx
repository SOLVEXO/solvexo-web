import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Root wrapper (reference nav + outlet + global Suspense)
import { RootLayout }   from '@/components/layouts/RootLayout';

// Layouts — eagerly imported (needed as wrappers immediately)
import { BuyerLayout }  from '@/components/layouts/BuyerLayout';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { SellerLayout } from '@/components/layouts/SellerLayout';
import { AdminLayout }  from '@/components/layouts/AdminLayout';
import { StoreLayout }  from '@/components/layouts/StoreLayout';
import { RequireRole }  from './RequireRole';

// ── Lazy helpers ──────────────────────────────────────────────────────────────
const named = <T extends Record<string, unknown>>(
  p: Promise<T>,
  key: keyof T,
): Promise<{ default: T[keyof T] }> =>
  p.then(m => ({ default: m[key] }));

// ── Public / Buyer ────────────────────────────────────────────────────────────
const Homepage             = lazy(() => named(import('@/features/buyer/pages/Homepage'),                         'Homepage'));
const UserProfile          = lazy(() => named(import('@/features/buyer/pages/settings/UserProfile'),            'UserProfile'));
const Marketplace          = lazy(() => named(import('@/features/buyer/pages/Marketplace'),                     'Marketplace'));
const ProductDetail        = lazy(() => named(import('@/features/buyer/pages/ProductDetail'),                   'ProductDetail'));
const CartPage             = lazy(() => named(import('@/features/buyer/pages/CartPage'),                        'CartPage'));
const CheckoutPage         = lazy(() => named(import('@/features/buyer/pages/CheckoutPage'),                    'CheckoutPage'));
const OrderSuccessPage     = lazy(() => named(import('@/features/buyer/pages/OrderSuccessPage'),                'OrderSuccessPage'));
const SellerStorefront     = lazy(() => named(import('@/features/buyer/pages/SellerStorefront'),                'SellerStorefront'));
const EducationMarketplace = lazy(() => named(import('@/features/buyer/pages/EducationMarketplace'),            'EducationMarketplace'));
const PricingPage          = lazy(() => named(import('@/features/buyer/pages/PricingPage'),                     'PricingPage'));
const ForSellersPage       = lazy(() => named(import('@/features/buyer/pages/ForSellersPage'),                  'ForSellersPage'));
const FaqPage              = lazy(() => named(import('@/features/buyer/pages/FaqPage'),                         'FaqPage'));

// ── Auth ──────────────────────────────────────────────────────────────────────
const LoginPage            = lazy(() => named(import('@/features/auth/pages/LoginPage'),                        'LoginPage'));
const AdminLoginPage       = lazy(() => named(import('@/features/auth/pages/admin/AdminLoginPage'),             'AdminLoginPage'));
const RegisterPage         = lazy(() => named(import('@/features/auth/pages/RegisterPage'),                     'RegisterPage'));
const OnboardingPage       = lazy(() => named(import('@/features/auth/pages/onboard/OnboardingPage'),          'OnboardingPage'));
const ForgotPasswordPage   = lazy(() => named(import('@/features/auth/pages/ForgotPasswordPage'),              'ForgotPasswordPage'));
const VerifyOTPPage        = lazy(() => named(import('@/features/auth/pages/VerifyOTPPage'),                    'VerifyOTPPage'));
const NewPasswordPage      = lazy(() => named(import('@/features/auth/pages/NewPasswordPage'),                  'NewPasswordPage'));

// ── Seller ────────────────────────────────────────────────────────────────────
const SellerDashboard      = lazy(() => named(import('@/features/seller/dashboard/SellerDashboard'),            'SellerDashboard'));
const SellerAnalytics      = lazy(() => named(import('@/features/seller/dashboard/SellerAnalytics'),             'SellerAnalytics'));
const StoreBuilder         = lazy(() => named(import('@/features/seller/dashboard/storemodule/StoreBuilder'),   'StoreBuilder'));
const SellerSettings       = lazy(() => named(import('@/features/seller/dashboard/settings/SellerSettings'),   'SellerSettings'));
const SellerShipping       = lazy(() => named(import('@/features/seller/dashboard/SellerShipping'),             'SellerShipping'));
const SellerMessages       = lazy(() => named(import('@/features/seller/dashboard/SellerMessages'),             'SellerMessages'));
const SellerStoreList      = lazy(() => named(import('@/features/seller/dashboard/storemodule/SellerStoreList'),'SellerStoreList'));
const POSRegister          = lazy(() => named(import('@/features/seller/store/pos/POSRegister'),                'POSRegister'));
const POSEmployeeLogin     = lazy(() => named(import('@/features/seller/store/pos/POSEmployeeLogin'),           'POSEmployeeLogin'));
const PosLanding           = lazy(() => named(import('@/features/seller/store/pos/PosLanding'),                 'PosLanding'));

// ── Store Workspace ───────────────────────────────────────────────────────────
const StoreDashboard     = lazy(() => import('@/features/seller/store/Dashboard/StoreDashboard'));
const StoreProductList   = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/products/StoreProductList'));
const StoreAddProduct    = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/products/StoreAddProduct'));
const StoreEditProduct   = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/products/StoreEditProduct'));
const StoreProductDetail = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/products/StoreProductDetail'));
const StoreCustomerList  = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/customer/CustomerList'));
const StoreSettings      = lazy(() => import('@/features/seller/store/Dashboard/Manage/StoreSettings'));
const StoreCategories    = lazy(() => import('@/features/seller/store/Dashboard/Manage/StoreCategories'));
const StoreOrderList     = lazy(() => named(import('@/features/seller/store/Dashboard/StoreSection/orders/OrderList'),        'StoreOrderList'));
const StoreReturnList    = lazy(() => named(import('@/features/seller/store/Dashboard/StoreSection/returns/ReturnList'),      'StoreReturnList'));
const StoreAnalytics     = lazy(() => named(import('@/features/seller/store/Dashboard/Analytic/analytics/Analytics'),        'StoreAnalytics'));
const StoreAIStudio      = lazy(() => named(import('@/features/seller/store/Dashboard/Analytic/ai/AiStudio'),                'StoreAIStudio'));
const StoreSEO           = lazy(() => named(import('@/features/seller/store/Dashboard/Analytic/seo/StoreSEO'),               'StoreSEO'));
const StoreFinance       = lazy(() => named(import('@/features/seller/store/Dashboard/Operations/finance/Finance'),          'StoreFinance'));
const StoreReviews       = lazy(() => named(import('@/features/seller/store/Dashboard/Operations/reviews/reviews'),          'StoreReviews'));
const StoreInventory     = lazy(() => named(import('@/features/seller/store/Dashboard/Operations/inventory/Inventory'),      'StoreInventory'));
const StoreMarketing     = lazy(() => named(import('@/features/seller/store/Dashboard/Operations/marketing/Marketing'),      'StoreMarketing'));
const StoreLoyalty       = lazy(() => named(import('@/features/seller/store/Dashboard/Operations/loyalty/Loyalty'),          'StoreLoyalty'));
const StoreSubscriptions = lazy(() => named(import('@/features/seller/store/Dashboard/Operations/subscriptions/Subscriptions'), 'StoreSubscriptions'));
const StoreIntegrations  = lazy(() => named(import('@/features/seller/store/Dashboard/Operations/integrations/Integrations'),'StoreIntegrations'));
const StoreActivity      = lazy(() => named(import('@/features/seller/store/Dashboard/Operations/activity/Activity'),        'StoreActivity'));
const StoreFollowers     = lazy(() => named(import('@/features/seller/store/Dashboard/StoreSection/followers/StoreFollowers'), 'StoreFollowers'));

// ── Admin ─────────────────────────────────────────────────────────────────────
const AdminOverview      = lazy(() => named(import('@/features/admin/pages/AdminOverview'),                     'AdminOverview'));
const AdminAnalytics     = lazy(() => named(import('@/features/admin/pages/AdminAnalytics'),                    'AdminAnalytics'));
const AdminUsers         = lazy(() => named(import('@/features/admin/pages/AdminUsers'),                        'AdminUsers'));
const AdminModeration    = lazy(() => named(import('@/features/admin/pages/AdminModeration'),                   'AdminModeration'));
const AdminMessaging     = lazy(() => named(import('@/features/admin/pages/AdminMessaging'),                    'AdminMessaging'));
const AdminMarketplace   = lazy(() => named(import('@/features/admin/pages/AdminMarketplace'),                  'AdminMarketplace'));
const AdminCategories    = lazy(() => named(import('@/features/admin/pages/AdminCategories'),                    'AdminCategories'));
const AdminSubscriptions = lazy(() => named(import('@/features/admin/pages/AdminSubscriptions'),                 'AdminSubscriptions'));
const AdminFinance       = lazy(() => named(import('@/features/admin/pages/AdminFinance'),                      'AdminFinance'));
const AdminAnnouncements = lazy(() => named(import('@/features/admin/pages/AdminAnnouncements'),                'AdminAnnouncements'));
const AdminBanners       = lazy(() => named(import('@/features/admin/pages/AdminBanners'),                       'AdminBanners'));
const AdminFaqs          = lazy(() => named(import('@/features/admin/pages/AdminFaqs'),                          'AdminFaqs'));
const AdminConfig        = lazy(() => named(import('@/features/admin/pages/AdminConfig'),                       'AdminConfig'));
const AdminSettings      = lazy(() => named(import('@/features/admin/pages/settings/AdminSettings'),           'AdminSettings'));

// ── Router ────────────────────────────────────────────────────────────────────
export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [

      // ── All buyer-facing pages — BuyerLayout adds the mobile bottom nav ─
      {
        element: <BuyerLayout />,
        children: [
          // Pages that also need the public marketing top navbar
          {
            path: '/',
            element: <PublicLayout />,
            children: [
              { index: true,             element: <Homepage /> },
              { path: 'pricing',         element: <PricingPage /> },
              { path: 'sellers',         element: <ForSellersPage /> },
              { path: 'faq',             element: <FaqPage /> },
            ],
          },
          // Pages with their own embedded navbar (no PublicLayout wrapper needed)
          { path: 'account/profile', element: <UserProfile /> },
          { path: 'marketplace',     element: <Marketplace /> },
          { path: 'cart',            element: <CartPage /> },
          { path: 'checkout',        element: <CheckoutPage /> },
          { path: 'order-success',   element: <OrderSuccessPage /> },
          { path: 'marketplace/:id', element: <ProductDetail /> },
          { path: 'store/:slug', element: <SellerStorefront /> },
          { path: 'education',   element: <EducationMarketplace /> },
        ],
      },

      // ── Auth ──────────────────────────────────────────────────────────
      { path: '/login',           element: <LoginPage /> },
      { path: '/admin/login',     element: <AdminLoginPage /> },
      { path: '/register',        element: <RegisterPage /> },
      { path: '/onboarding',      element: <OnboardingPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/verify-otp',      element: <VerifyOTPPage /> },
      { path: '/new-password',    element: <NewPasswordPage /> },

      // ── POS terminal — standalone (no seller sidebar) ──────────────────
      { path: '/seller/store/:storeId/pos/register', element: <POSRegister /> },
      { path: '/seller/store/:storeId/pos/login',    element: <POSEmployeeLogin /> },

      // ── Seller pages with dark sidebar ────────────────────────────────
      {
        path: '/seller',
        element: <SellerLayout />,
        children: [
          { index: true,           element: <Navigate to="/seller/dashboard" replace /> },
          { path: 'dashboard',     element: <SellerDashboard /> },
          { path: 'analytics',     element: <SellerAnalytics /> },
          { path: 'shipping',      element: <SellerShipping /> },
          { path: 'messages',      element: <SellerMessages /> },
          { path: 'stores',        element: <SellerStoreList /> },
          { path: 'store',         element: <StoreBuilder /> },
          { path: 'settings',      element: <SellerSettings /> },
        ],
      },

      // ── Store Workspace (each store's own mini-admin panel) ──────────
      {
        path: '/seller/store/:storeId',
        element: <StoreLayout />,
        children: [
          { index: true,                              element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard',                        element: <StoreDashboard /> },
          { path: 'pos',                               element: <PosLanding /> },
          { path: 'orders',                           element: <StoreOrderList /> },
          { path: 'products',                         element: <StoreProductList /> },
          { path: 'products/add',                     element: <StoreAddProduct /> },
          { path: 'products/edit/:productId',         element: <StoreEditProduct /> },
          { path: 'products/detail/:productId',       element: <StoreProductDetail /> },
          { path: 'customer/list',                    element: <StoreCustomerList /> },
          { path: 'analytics',                        element: <StoreAnalytics /> },
          { path: 'settings',                         element: <StoreSettings /> },
          { path: 'categories',                       element: <StoreCategories /> },
          { path: 'storebuilder',                     element: <StoreBuilder /> },
          { path: 'returns',                          element: <StoreReturnList /> },
          { path: 'seo',                              element: <StoreSEO /> },
          { path: 'ai/studio',                        element: <StoreAIStudio /> },
          { path: 'reviews',                          element: <StoreReviews /> },
          { path: 'finance',                          element: <StoreFinance /> },
          { path: 'inventory',                        element: <StoreInventory /> },
          { path: 'marketing',                        element: <StoreMarketing /> },
          { path: 'loyalty',                          element: <StoreLoyalty /> },
          { path: 'subscriptions',                    element: <StoreSubscriptions /> },
          { path: 'integrations',                     element: <StoreIntegrations /> },
          { path: 'activity',                         element: <StoreActivity /> },
          { path: 'followers',                        element: <StoreFollowers /> },
          { path: 'pos-admin',                        element: <Navigate to="../pos" replace /> },
          { path: 'shipping',                         element: <SellerShipping /> },
          { path: 'messages',                         element: <SellerMessages /> },
        ],
      },

      // ── Admin pages ───────────────────────────────────────────────────
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true,          element: <AdminOverview /> },
          { path: 'analytics',    element: <RequireRole role="admin"><AdminAnalytics /></RequireRole> },
          { path: 'users',        element: <AdminUsers /> },
          { path: 'moderation',   element: <AdminModeration /> },
          { path: 'messages',     element: <AdminMessaging /> },
          { path: 'marketplace',  element: <AdminMarketplace /> },
          { path: 'categories',   element: <AdminCategories /> },
          { path: 'subscriptions',element: <AdminSubscriptions /> },
          { path: 'finance',      element: <RequireRole role="admin"><AdminFinance /></RequireRole> },
          { path: 'announcements',element: <AdminAnnouncements /> },
          { path: 'banners',      element: <AdminBanners /> },
          { path: 'faqs',         element: <AdminFaqs /> },
          { path: 'config',       element: <AdminConfig /> },
          { path: 'settings',     element: <AdminSettings /> },
        ],
      },

      // ── 404 ───────────────────────────────────────────────────────────
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
