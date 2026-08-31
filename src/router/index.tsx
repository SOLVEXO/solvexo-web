import { createBrowserRouter, Navigate } from 'react-router-dom';
import { getStoreSlugFromHost, isCustomDomainCandidate } from '@/utils/storefrontUrl';

// Root wrapper (reference nav + outlet)
import { RootLayout }   from '@/components/layouts/RootLayout';

// Layouts
import { BuyerLayout }  from '@/components/layouts/BuyerLayout';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { SellerLayout } from '@/components/layouts/SellerLayout';
import { AdminLayout }  from '@/components/layouts/AdminLayout';
import { StoreLayout }  from '@/components/layouts/StoreLayout';
import { RequireRole }  from './RequireRole';

// Critical conversion-path pages
import { LoginPage }    from '@/features/auth/pages/LoginPage';
import { RegisterPage } from '@/features/auth/pages/RegisterPage';
import { OnboardingPage, OnboardingEntry } from '@/features/auth/pages/onboard/OnboardingPage';

// Remaining auth pages
import { AdminLoginPage }     from '@/features/auth/pages/admin/AdminLoginPage';
import { ForgotPasswordPage } from '@/features/auth/pages/ForgotPasswordPage';
import { VerifyOTPPage }      from '@/features/auth/pages/VerifyOTPPage';
import { NewPasswordPage }    from '@/features/auth/pages/NewPasswordPage';

// Public marketing pages
import { Homepage }             from '@/features/buyer/pages/Homepage';
import { PricingPage }          from '@/features/buyer/pages/PricingPage';
import { ForSellersPage }       from '@/features/buyer/pages/ForSellersPage';
import { FaqPage }              from '@/features/buyer/pages/FaqPage';
import { PrivacyPolicyPage }    from '@/features/buyer/pages/PrivacyPolicyPage';
import { TermsOfServicePage }   from '@/features/buyer/pages/TermsOfServicePage';
import { CookiePolicyPage }     from '@/features/buyer/pages/CookiePolicyPage';
import { ContactUsPage }        from '@/features/buyer/pages/ContactUsPage';
import { AboutPage }            from '@/features/buyer/pages/AboutPage';
import { SecurityPage }         from '@/features/buyer/pages/SecurityPage';
import { ProductsOverviewPage } from '@/features/buyer/pages/products/ProductsOverviewPage';
import { PlatformProductPage }  from '@/features/buyer/pages/products/PlatformProductPage';
import { SolutionsOverviewPage } from '@/features/buyer/pages/solutions/SolutionsOverviewPage';
import { SolutionPage }         from '@/features/buyer/pages/solutions/SolutionPage';

// ── Public / Buyer ────────────────────────────────────────────────────────────
import { StorefrontLayout } from '@/features/storefront/StorefrontLayout';
import { ThemedRoute } from '@/features/storefront-themes/ThemedRoute';
import { MaintenancePage } from '@/features/buyer/pages/MaintenancePage';

// ── Seller ────────────────────────────────────────────────────────────────────
import { SellerAnalytics } from '@/features/seller/dashboard/SellerAnalytics';
import { StoreBuilderRedirect } from '@/features/seller/store/Dashboard/OnlineStore/StoreBuilderRedirect';
import { PagesPage } from '@/features/seller/store/Dashboard/OnlineStore/pages/PagesPage';
import { BlogPage } from '@/features/seller/store/Dashboard/OnlineStore/blog/BlogPage';
import { ThemeLibraryPage } from '@/features/seller/store/Dashboard/OnlineStore/themes/ThemeLibraryPage';
import { AtelierCustomizePage } from '@/features/seller/store/Dashboard/OnlineStore/themes/AtelierCustomizePage';
import { AtelierEditCodePage } from '@/features/seller/store/Dashboard/OnlineStore/themes/AtelierEditCodePage';
import { AtelierHeaderFooterPage } from '@/features/seller/store/Dashboard/OnlineStore/themes/AtelierHeaderFooterPage';
import { ThemeDemoPreview } from '@/features/seller/store/Dashboard/OnlineStore/themes/AtelierThemeDemoPreview';
import { SellerSettings } from '@/features/seller/dashboard/settings/SellerSettings';
import { SellerShipping } from '@/features/seller/dashboard/SellerShipping';
import { SellerMessages } from '@/features/seller/dashboard/SellerMessages';
import { SellerStoreList } from '@/features/seller/store/Dashboard/OnlineStore/SellerStoreList';

// ── Store Workspace ───────────────────────────────────────────────────────────
import StoreDashboard from '@/features/seller/store/Dashboard/StoreDashboard';
import StoreNotFound from '@/features/seller/store/Dashboard/StoreNotFound';
import StoreProductList from '@/features/seller/store/Dashboard/StoreSection/products/StoreProductList';
import StoreAddProduct from '@/features/seller/store/Dashboard/StoreSection/products/StoreAddProduct';
import StoreEditProduct from '@/features/seller/store/Dashboard/StoreSection/products/StoreEditProduct';
import StoreProductDetail from '@/features/seller/store/Dashboard/StoreSection/products/StoreProductDetail';
import StoreCustomerList from '@/features/seller/store/Dashboard/StoreSection/customer/CustomerList';
import StoreSettings from '@/features/seller/store/Dashboard/Manage/StoreSettings';
import StoreCategories from '@/features/seller/store/Dashboard/Manage/StoreCategories';
import StoreCollections from '@/features/seller/store/Dashboard/Manage/StoreCollections';
import FilesLibrary from '@/features/seller/store/Dashboard/Manage/FilesLibrary';
import StorePlanBilling from '@/features/seller/store/Dashboard/Manage/StorePlanBilling';
import { StoreOrderList } from '@/features/seller/store/Dashboard/StoreSection/orders/OrderList';
import { StoreOrderDetail } from '@/features/seller/store/Dashboard/StoreSection/orders/OrderDetail';
import DraftOrdersList from '@/features/seller/store/Dashboard/StoreSection/orders/DraftOrdersList';
import DraftOrderForm from '@/features/seller/store/Dashboard/StoreSection/orders/DraftOrderForm';
import { StoreReturnList } from '@/features/seller/store/Dashboard/StoreSection/returns/ReturnList';
import { StoreAnalytics } from '@/features/seller/store/Dashboard/Analytic/analytics/Analytics';
import { StoreAIStudio } from '@/features/seller/store/Dashboard/Analytic/ai/AiStudio';
import { StoreSEO } from '@/features/seller/store/Dashboard/Analytic/seo/StoreSEO';
import { StoreFinance } from '@/features/seller/store/Dashboard/Operations/finance/Finance';
import { StoreReviews } from '@/features/seller/store/Dashboard/Operations/reviews/reviews';
import { StoreInventory } from '@/features/seller/store/Dashboard/Operations/inventory/Inventory';
import { StoreMarketing } from '@/features/seller/store/Dashboard/Operations/marketing/Marketing';
import { StoreLoyalty } from '@/features/seller/store/Dashboard/Operations/loyalty/Loyalty';
import { StoreSubscriptions } from '@/features/seller/store/Dashboard/Operations/subscriptions/Subscriptions';
import { StoreIntegrations } from '@/features/seller/store/Dashboard/Operations/integrations/Integrations';
// Seller-facing surfaces for two features whose backend + frontend API
// clients already existed (automatic discounts, gift cards — both already
// wired into checkout pricing) but had no dashboard page anywhere to reach
// them from — the same "built but unreachable" gap as AtelierLivePreview's
// hardcoded-theme bug, just in a different corner of the app.
import StoreDiscounts from '@/features/seller/store/Dashboard/Manage/StoreDiscounts';
import StoreGiftCards from '@/features/seller/store/Dashboard/Manage/StoreGiftCards';

// ── Admin ─────────────────────────────────────────────────────────────────────
import { AdminOverview } from '@/features/admin/pages/AdminOverview';
import { AdminAnalytics } from '@/features/admin/pages/AdminAnalytics';
import { AdminUsers } from '@/features/admin/pages/AdminUsers';
import { AdminModeration } from '@/features/admin/pages/AdminModeration';
import { AdminActivityLog } from '@/features/admin/pages/AdminActivityLog';
import { AdminMessaging } from '@/features/admin/pages/AdminMessaging';
import { AdminMarketplace } from '@/features/admin/pages/AdminMarketplace';
import { AdminLeads } from '@/features/admin/pages/AdminLeads';
import { AdminSubscriptions } from '@/features/admin/pages/AdminSubscriptions';
import { AdminPlatformPlans } from '@/features/admin/pages/AdminPlatformPlans';
import { AdminFinance } from '@/features/admin/pages/AdminFinance';
import { AdminAnnouncements } from '@/features/admin/pages/AdminAnnouncements';
import { AdminBanners } from '@/features/admin/pages/AdminBanners';
import { AdminFaqs } from '@/features/admin/pages/AdminFaqs';
import { AdminShippingZones } from '@/features/admin/pages/AdminShippingZones';
import { AdminContactMessages } from '@/features/admin/pages/AdminContactMessages';
import { AdminTestimonials } from '@/features/admin/pages/AdminTestimonials';
import { AdminManualPayments } from '@/features/admin/pages/AdminManualPayments';
import { AdminCommissionRules } from '@/features/admin/pages/AdminCommissionRules';
import { AdminConfig } from '@/features/admin/pages/AdminConfig';
import { AdminFxSettings } from '@/features/admin/pages/AdminFxSettings';
import { AdminMarketing } from '@/features/admin/pages/AdminMarketing';
import { AdminSettings } from '@/features/admin/pages/settings/AdminSettings';
import { AdminSEO } from '@/features/admin/pages/AdminSEO';
import { AdminAiStudio } from '@/features/admin/pages/AdminAiStudio';

// ── Storefront subdomain router ────────────────────────────────────────────────
// A store's own subdomain (`hello.solvexo.store`) serves ONLY its storefront
// — home/blog/custom-pages — never the marketplace/seller/admin app. Kept as
// a wholly separate route tree (not a branch of the main tree) since a
// `:pageSlug` catch-all would otherwise have to coexist with dozens of
// unrelated top-level paths (`/marketplace`, `/cart`, `/admin`, ...) on the
// same origin — instead the two trees never overlap, selected once at boot
// by `getStoreSlugFromHost()` below.
const storefrontRouter = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      {
        path: '/',
        element: <StorefrontLayout />,
        children: [
          // Every leaf route mounts through `ThemedRoute`, which dispatches
          // to whichever independent theme is active on the store — see
          // `ThemedRoute.tsx`. The legacy 12-theme shared engine has been
          // fully removed (archived under `_legacy-theme-backup/`).
          { index: true, element: <ThemedRoute routeKey="home" /> },
          { path: 'blog', element: <ThemedRoute routeKey="blogIndex" /> },
          { path: 'blog/:postSlug', element: <ThemedRoute routeKey="blogPost" /> },
          { path: 'cart', element: <ThemedRoute routeKey="cart" /> },
          { path: 'checkout', element: <ThemedRoute routeKey="checkout" /> },
          { path: 'login', element: <ThemedRoute routeKey="login" /> },
          { path: 'register', element: <ThemedRoute routeKey="register" /> },
          { path: 'verify-otp', element: <ThemedRoute routeKey="verifyOtp" /> },
          { path: 'forgot-password', element: <ThemedRoute routeKey="forgotPassword" /> },
          { path: 'new-password', element: <ThemedRoute routeKey="newPassword" /> },
          { path: 'account', element: <ThemedRoute routeKey="account" /> },
          // Must come before the `:pageSlug` catch-all below — 'category'/
          // 'collections'/'checkout' are reserved custom-page slugs precisely
          // so they can never collide with these (see RESERVED_CUSTOM_PAGE_SLUGS).
          { path: 'category/:slugOrId', element: <ThemedRoute routeKey="category" /> },
          { path: 'collections/:slugOrId', element: <ThemedRoute routeKey="collection" /> },
          { path: 'product/:slug', element: <ThemedRoute routeKey="product" /> },
          { path: 'search', element: <ThemedRoute routeKey="search" /> },
          { path: ':pageSlug', element: <ThemedRoute routeKey="customPage" /> },
        ],
      },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

// ── Main app router (marketplace/buyer/seller/admin — the apex domain) ────────
const mainRouter = createBrowserRouter([
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
              { path: 'help',            element: <Navigate to="/faq" replace /> },
              { path: 'privacy-policy',  element: <PrivacyPolicyPage /> },
              { path: 'terms-of-service', element: <TermsOfServicePage /> },
              { path: 'cookie-policy',   element: <CookiePolicyPage /> },
              { path: 'contact-us',      element: <ContactUsPage /> },
              { path: 'contact',         element: <Navigate to="/contact-us" replace /> },
              { path: 'about',           element: <AboutPage /> },
              { path: 'security',        element: <SecurityPage /> },
              { path: 'products',        element: <ProductsOverviewPage /> },
              { path: 'products/:slug',  element: <PlatformProductPage /> },
              { path: 'solutions',       element: <SolutionsOverviewPage /> },
              { path: 'solutions/:slug', element: <SolutionPage /> },
            ],
          },
          // The apex-domain "Account" section (Dashboard/Orders/Wishlist/
          // Reviews/Payments/Profile/Security/Addresses/Notifications/
          // Subscriptions/Messages) and the whole Marketplace/Cart/Checkout/
          // Order-Success/ProductDetail/Education flow that used to live here
          // were removed (frontend-only, at the seller's explicit request) —
          // they were the pre-"store-wise" unified buyer experience, from
          // before every store got its own themed subdomain
          // (`storefrontRouter` above, via `ThemedRoute`, already has its own
          // real `account`/`cart`/`checkout`/`login` etc. that correctly
          // render in THAT store's active theme). Nothing here was still
          // reachable: `LoginPage`'s own `SELLER_ONLY_LOGIN = true` and
          // `ProfileAvatar`'s own `SHOW_BUYER_FEATURES = false` had already
          // hidden every path that led here. `getRoleRedirect`'s buyer/apex
          // fallback and `ProfileAvatar`'s buyer menu items were updated in
          // the same pass so nothing is left pointing at a deleted route —
          // see those files' own comments. The actual page files under
          // `features/buyer/pages/{Marketplace,CartPage,CheckoutPage,
          // OrderSuccessPage,ProductDetail,EducationMarketplace,account/*,
          // MyOrdersPage,MyReviewsPage,MySubscriptionsPage}` and
          // `components/layouts/AccountLayout.tsx` are now unreferenced by
          // any route — kept on disk only because this session couldn't
          // delete files directly; safe to delete outright.
        ],
      },

      // ── Maintenance mode (backend 503 redirects here — see client.ts) ──
      { path: '/maintenance',     element: <MaintenancePage /> },

      // ── Auth ──────────────────────────────────────────────────────────
      { path: '/login',           element: <LoginPage /> },
      { path: '/admin/login',     element: <AdminLoginPage /> },
      { path: '/register',        element: <RegisterPage /> },
      { path: '/onboard',      element: <OnboardingEntry /> },
      { path: '/onboard/:sessionId', element: <OnboardingPage /> },
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/verify-otp',      element: <VerifyOTPPage /> },
      { path: '/new-password',    element: <NewPasswordPage /> },

      // ── Seller pages with dark sidebar ────────────────────────────────
      {
        path: '/seller',
        element: <SellerLayout />,
        children: [
          { index: true,           element: <Navigate to="/seller/stores" replace /> },
          { path: 'analytics',     element: <SellerAnalytics /> },
          { path: 'stores',        element: <SellerStoreList /> },
          { path: 'store',         element: <StoreBuilderRedirect /> },
          { path: 'settings',      element: <SellerSettings /> },
        ],
      },

      // ── Store Workspace (each store's own mini-admin panel) ──────────
      {
        path: '/store/:storeId',
        element: <StoreLayout />,
        children: [
          { index: true,                              element: <Navigate to="dashboard" replace /> },
          { path: 'dashboard',                        element: <StoreDashboard /> },
          { path: 'orders',                           element: <StoreOrderList /> },
          { path: 'orders/detail/:orderId',           element: <StoreOrderDetail /> },
          { path: 'draft-orders',                     element: <DraftOrdersList /> },
          { path: 'draft-orders/:draftId',             element: <DraftOrderForm /> },
          { path: 'products',                         element: <StoreProductList /> },
          { path: 'products/add',                     element: <StoreAddProduct /> },
          { path: 'products/edit/:productId',         element: <StoreEditProduct /> },
          { path: 'products/detail/:productId',       element: <StoreProductDetail /> },
          { path: 'customer/list',                    element: <StoreCustomerList /> },
          { path: 'analytics',                        element: <StoreAnalytics /> },
          { path: 'settings',                         element: <StoreSettings /> },
          { path: 'account',                          element: <SellerSettings variant="store" /> },
          { path: 'categories',                       element: <StoreCategories /> },
          { path: 'collections',                      element: <StoreCollections /> },
          { path: 'files',                            element: <FilesLibrary /> },
          { path: 'plan-billing',                     element: <StorePlanBilling /> },
          // Verification's sidebar NAV item and workspace banner were removed
          // (dashboard-declutter request) while the underlying feature/page/
          // backend stay intact — this redirect just keeps the old URL from
          // 404ing for anyone with it bookmarked or linked, matching the
          // activity/followers/pos-admin pattern below.
          { path: 'verification',                     element: <Navigate to="../settings" replace /> },
          { path: 'storebuilder',                     element: <Navigate to="online-store/themes" replace /> },
          { path: 'online-store/themes',               element: <ThemeLibraryPage /> },
          // `:themeId` is carried in the URL for a real reason now — it used
          // to be the literal word "atelier" unconditionally, even while
          // editing a Nova (or any other) store's theme, which is exactly
          // the kind of "as a developer I can't tell what's happening here"
          // confusion a real URL segment is supposed to prevent (matches
          // Shopify's own `/admin/themes/<id>/editor` convention). None of
          // the three pages below actually READ this param — each already
          // resolves the store's real active theme itself via
          // `apiGetStoreTheme(storeId)` — so this is purely a legibility fix,
          // not a functional one; `ThemeLibraryPage.tsx`'s links now build
          // this segment from the real `entry.id` instead of hardcoding it.
          { path: 'online-store/themes/:themeId/customize', element: <AtelierCustomizePage /> },
          { path: 'online-store/themes/:themeId/edit-code', element: <AtelierEditCodePage /> },
          { path: 'online-store/themes/:themeId/header-footer', element: <AtelierHeaderFooterPage /> },
          { path: 'online-store/pages',               element: <PagesPage /> },
          { path: 'online-store/blog',                element: <BlogPage /> },
          { path: 'returns',                          element: <StoreReturnList /> },
          { path: 'seo',                              element: <StoreSEO /> },
          { path: 'ai/studio',                        element: <StoreAIStudio /> },
          { path: 'reviews',                          element: <StoreReviews /> },
          { path: 'finance',                          element: <StoreFinance /> },
          { path: 'inventory',                        element: <StoreInventory /> },
          { path: 'marketing',                        element: <StoreMarketing /> },
          { path: 'discounts',                        element: <StoreDiscounts /> },
          { path: 'gift-cards',                       element: <StoreGiftCards /> },
          { path: 'loyalty',                          element: <StoreLoyalty /> },
          { path: 'subscriptions',                    element: <StoreSubscriptions /> },
          { path: 'integrations',                     element: <StoreIntegrations /> },
          { path: 'activity',                         element: <Navigate to="../settings" replace /> },
          { path: 'followers',                        element: <Navigate to="../customer/list" replace /> },
          { path: 'pos-admin',                        element: <Navigate to="../dashboard" replace /> },
          { path: 'shipping',                         element: <SellerShipping /> },
          { path: 'messages',                         element: <SellerMessages /> },
          { path: '*',                                element: <StoreNotFound /> },
        ],
      },

      // ── Theme Library preview — deliberately OUTSIDE `StoreLayout` ─────
      // A storefront preview has to look like the real, finished storefront
      // a buyer would see — full-bleed, zero admin chrome. Nesting this
      // under `/store/:storeId`'s `StoreLayout` (as it used to be) wrapped
      // every preview in the seller's own dashboard sidebar/header, which is
      // exactly the "why is my dashboard showing inside the theme preview"
      // bug reported against the previous version of this route. Same
      // literal path as before (`/store/:storeId/online-store/themes/:themeId/preview`),
      // so the existing relative `<Link to={`${entry.id}/preview`}>` in
      // `ThemeLibraryPage.tsx` still resolves to this exact route — only
      // where it's registered in the tree changed, not the URL.
      { path: '/store/:storeId/online-store/themes/:themeId/preview', element: <ThemeDemoPreview /> },

      // ── Admin pages ───────────────────────────────────────────────────
      {
        path: '/admin',
        element: <AdminLayout />,
        children: [
          { index: true,          element: <AdminOverview /> },
          { path: 'analytics',    element: <RequireRole role="admin"><AdminAnalytics /></RequireRole> },
          { path: 'users',        element: <RequireRole role="admin"><AdminUsers /></RequireRole> },
          { path: 'moderation',   element: <RequireRole role="admin"><AdminModeration /></RequireRole> },
          { path: 'activity-log', element: <RequireRole role="admin"><AdminActivityLog /></RequireRole> },
          { path: 'messages',     element: <AdminMessaging /> },
          { path: 'leads',        element: <RequireRole role="admin"><AdminLeads /></RequireRole> },
          { path: 'marketplace',  element: <RequireRole role="admin"><AdminMarketplace /></RequireRole> },
          { path: 'subscriptions',element: <AdminSubscriptions /> },
          { path: 'platform-plans',element: <AdminPlatformPlans /> },
          { path: 'finance',      element: <RequireRole role="admin"><AdminFinance /></RequireRole> },
          { path: 'manual-payments', element: <RequireRole role="admin"><AdminManualPayments /></RequireRole> },
          { path: 'fx-settings', element: <RequireRole role="admin"><AdminFxSettings /></RequireRole> },
          { path: 'commission-rules', element: <RequireRole role="admin"><AdminCommissionRules /></RequireRole> },
          { path: 'announcements',element: <RequireRole role="admin"><AdminAnnouncements /></RequireRole> },
          { path: 'banners',      element: <AdminBanners /> },
          { path: 'faqs',         element: <AdminFaqs /> },
          { path: 'shipping-zones', element: <AdminShippingZones /> },
          { path: 'contact',      element: <AdminContactMessages /> },
          { path: 'testimonials', element: <AdminTestimonials /> },
          { path: 'config',       element: <RequireRole role="admin"><AdminConfig /></RequireRole> },
          { path: 'marketing',    element: <RequireRole role="admin"><AdminMarketing /></RequireRole> },
          { path: 'settings',     element: <AdminSettings /> },
          { path: 'seo',          element: <RequireRole role="admin"><AdminSEO /></RequireRole> },
          { path: 'ai-studio',    element: <RequireRole role="admin"><AdminAiStudio /></RequireRole> },
          { path: 'theme-catalog', element: <RequireRole role="admin"><AdminThemeCatalog /></RequireRole> },
        ],
      },

      // ── 404 ───────────────────────────────────────────────────────────
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
]);

// Decided once at module load — the hostname doesn't change without a full
// page reload, so this never needs to be reactive. A `*.solvexo.store`
// subdomain resolves its slug synchronously here; an arbitrary connected
// Custom Domain (`isCustomDomainCandidate`) can't be resolved synchronously
// (it needs a real DNS-backed lookup), so it's routed into the SAME
// storefront tree and resolved asynchronously once mounted — see
// `StorefrontLayout.tsx`.
export const router = (getStoreSlugFromHost() || isCustomDomainCandidate()) ? storefrontRouter : mainRouter;
