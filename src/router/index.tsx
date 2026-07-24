import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Root wrapper (reference nav + outlet + global Suspense)
import { RootLayout }   from '@/components/layouts/RootLayout';

// Layouts — eagerly imported (needed as wrappers immediately)
import { BuyerLayout }  from '@/components/layouts/BuyerLayout';
import { AccountLayout } from '@/components/layouts/AccountLayout';
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
const PrivacyPolicyPage    = lazy(() => named(import('@/features/buyer/pages/PrivacyPolicyPage'),               'PrivacyPolicyPage'));
const TermsOfServicePage   = lazy(() => named(import('@/features/buyer/pages/TermsOfServicePage'),              'TermsOfServicePage'));
const CookiePolicyPage     = lazy(() => named(import('@/features/buyer/pages/CookiePolicyPage'),                'CookiePolicyPage'));
const ContactUsPage        = lazy(() => named(import('@/features/buyer/pages/ContactUsPage'),                   'ContactUsPage'));
const MaintenancePage      = lazy(() => named(import('@/features/buyer/pages/MaintenancePage'),                 'MaintenancePage'));

// ── Account (buyer) ───────────────────────────────────────────────────────────
const AccountDashboard     = lazy(() => named(import('@/features/buyer/pages/account/AccountDashboard'),        'AccountDashboard'));
const PersonalInfo         = lazy(() => named(import('@/features/buyer/pages/account/PersonalInfo'),             'PersonalInfo'));
const AccountOrders        = lazy(() => named(import('@/features/buyer/pages/MyOrdersPage'),                     'OrdersTab'));
const AccountWishlist      = lazy(() => named(import('@/features/buyer/pages/account/Wishlist'),                 'Wishlist'));
const AccountAddresses     = lazy(() => named(import('@/features/buyer/pages/account/Addresses'),                'Addresses'));
const AccountReviews       = lazy(() => named(import('@/features/buyer/pages/MyReviewsPage'),                    'ReviewsTab'));
const AccountNotifications = lazy(() => named(import('@/features/buyer/pages/account/Notifications'),           'Notifications'));
const AccountSecurity      = lazy(() => named(import('@/features/buyer/pages/account/Security'),                 'Security'));
const AccountSettings      = lazy(() => named(import('@/features/buyer/pages/account/Settings'),                 'Settings'));
const AccountMessages      = lazy(() => named(import('@/features/buyer/pages/account/Messages'),                 'Messages'));
const AccountSubscriptions = lazy(() => named(import('@/features/buyer/pages/MySubscriptionsPage'),              'SubscriptionsTab'));

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
const StorePlanBilling   = lazy(() => import('@/features/seller/store/Dashboard/Manage/StorePlanBilling'));
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

// ── Admin ─────────────────────────────────────────────────────────────────────
const AdminOverview      = lazy(() => named(import('@/features/admin/pages/AdminOverview'),                     'AdminOverview'));
const AdminAnalytics     = lazy(() => named(import('@/features/admin/pages/AdminAnalytics'),                    'AdminAnalytics'));
const AdminUsers         = lazy(() => named(import('@/features/admin/pages/AdminUsers'),                        'AdminUsers'));
const AdminModeration    = lazy(() => named(import('@/features/admin/pages/AdminModeration'),                   'AdminModeration'));
const AdminMessaging     = lazy(() => named(import('@/features/admin/pages/AdminMessaging'),                    'AdminMessaging'));
const AdminMarketplace   = lazy(() => named(import('@/features/admin/pages/AdminMarketplace'),                  'AdminMarketplace'));
const AdminCategories    = lazy(() => named(import('@/features/admin/pages/AdminCategories'),                    'AdminCategories'));
const AdminSubscriptions = lazy(() => named(import('@/features/admin/pages/AdminSubscriptions'),                 'AdminSubscriptions'));
const AdminPlatformPlans = lazy(() => named(import('@/features/admin/pages/AdminPlatformPlans'),                 'AdminPlatformPlans'));
const AdminFinance       = lazy(() => named(import('@/features/admin/pages/AdminFinance'),                      'AdminFinance'));
const AdminAnnouncements = lazy(() => named(import('@/features/admin/pages/AdminAnnouncements'),                'AdminAnnouncements'));
const AdminBanners       = lazy(() => named(import('@/features/admin/pages/AdminBanners'),                       'AdminBanners'));
const AdminFaqs          = lazy(() => named(import('@/features/admin/pages/AdminFaqs'),                          'AdminFaqs'));
const AdminConfig        = lazy(() => named(import('@/features/admin/pages/AdminConfig'),                       'AdminConfig'));
const AdminMarketing     = lazy(() => named(import('@/features/admin/pages/AdminMarketing'),                     'AdminMarketing'));
const AdminSettings      = lazy(() => named(import('@/features/admin/pages/settings/AdminSettings'),           'AdminSettings'));
const AdminSEO           = lazy(() => named(import('@/features/admin/pages/AdminSEO'),                          'AdminSEO'));
const AdminAiStudio      = lazy(() => named(import('@/features/admin/pages/AdminAiStudio'),                     'AdminAiStudio'));

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
              { path: 'privacy-policy',  element: <PrivacyPolicyPage /> },
              { path: 'terms-of-service', element: <TermsOfServicePage /> },
              { path: 'cookie-policy',   element: <CookiePolicyPage /> },
              { path: 'contact-us',      element: <ContactUsPage /> },
            ],
          },
          // Account — nested routes, each section is its own deep-linkable page
          {
            path: 'account',
            element: <AccountLayout />,
            children: [
              { index: true,          element: <Navigate to="dashboard" replace /> },
              { path: 'dashboard',     element: <AccountDashboard /> },
              { path: 'profile',       element: <PersonalInfo /> },
              { path: 'orders',        element: <AccountOrders /> },
              { path: 'wishlist',      element: <AccountWishlist /> },
              { path: 'addresses',     element: <AccountAddresses /> },
              { path: 'reviews',       element: <AccountReviews /> },
              { path: 'notifications', element: <AccountNotifications /> },
              { path: 'security',      element: <AccountSecurity /> },
              { path: 'settings',      element: <AccountSettings /> },
              { path: 'messages',      element: <AccountMessages /> },
              { path: 'subscriptions', element: <AccountSubscriptions /> },
            ],
          },
          // Pages with their own embedded navbar (no PublicLayout wrapper needed)
          { path: 'marketplace',     element: <Marketplace /> },
          { path: 'cart',            element: <CartPage /> },
          { path: 'checkout',        element: <CheckoutPage /> },
          { path: 'order-success',   element: <OrderSuccessPage /> },
          { path: 'marketplace/:id', element: <ProductDetail /> },
          { path: 'store/:slug', element: <SellerStorefront /> },
          { path: 'EducationMarketplace',   element: <EducationMarketplace /> },
        ],
      },

      // ── Maintenance mode (backend 503 redirects here — see client.ts) ──
      { path: '/maintenance',     element: <MaintenancePage /> },

      // ── Auth ──────────────────────────────────────────────────────────
      { path: '/login',           element: <LoginPage /> },
      { path: '/admin/login',     element: <AdminLoginPage /> },
      { path: '/register',        element: <RegisterPage /> },
      { path: '/onboard',      element: <OnboardingPage /> },
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
          { path: 'plan-billing',                     element: <StorePlanBilling /> },
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
          { path: 'activity',                         element: <Navigate to="../settings" replace /> },
          { path: 'followers',                        element: <Navigate to="../customer/list" replace /> },
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
          { path: 'users',        element: <RequireRole role="admin"><AdminUsers /></RequireRole> },
          { path: 'moderation',   element: <RequireRole role="admin"><AdminModeration /></RequireRole> },
          { path: 'messages',     element: <AdminMessaging /> },
          { path: 'marketplace',  element: <RequireRole role="admin"><AdminMarketplace /></RequireRole> },
          { path: 'categories',   element: <AdminCategories /> },
          { path: 'subscriptions',element: <AdminSubscriptions /> },
          { path: 'platform-plans',element: <AdminPlatformPlans /> },
          { path: 'finance',      element: <RequireRole role="admin"><AdminFinance /></RequireRole> },
          { path: 'announcements',element: <RequireRole role="admin"><AdminAnnouncements /></RequireRole> },
          { path: 'banners',      element: <AdminBanners /> },
          { path: 'faqs',         element: <AdminFaqs /> },
          { path: 'config',       element: <RequireRole role="admin"><AdminConfig /></RequireRole> },
          { path: 'marketing',    element: <RequireRole role="admin"><AdminMarketing /></RequireRole> },
          { path: 'settings',     element: <AdminSettings /> },
          { path: 'seo',          element: <RequireRole role="admin"><AdminSEO /></RequireRole> },
          { path: 'ai-studio',    element: <RequireRole role="admin"><AdminAiStudio /></RequireRole> },
        ],
      },

      // ── 404 ───────────────────────────────────────────────────────────
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);
