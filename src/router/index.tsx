import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { getStoreSlugFromHost, isCustomDomainCandidate } from '@/utils/storefrontUrl';

// Root wrapper (reference nav + outlet)
import { RootLayout }   from '@/components/layouts/RootLayout';

// Layouts — kept EAGER (not lazy): each one is the persistent chrome for its
// whole section (sidebar/nav), small relative to the feature pages it wraps,
// and needed the instant a seller/admin/buyer enters that section anyway.
import { BuyerLayout }  from '@/components/layouts/BuyerLayout';
import { PublicLayout } from '@/components/layouts/PublicLayout';
import { SellerLayout } from '@/components/layouts/SellerLayout';
import { AdminLayout }  from '@/components/layouts/AdminLayout';
import { StoreLayout }  from '@/components/layouts/StoreLayout';
import { RequireRole }  from './RequireRole';

// ── Every route below is code-split via React.lazy() — this used to be ~100
// EAGER imports, meaning literally every seller/admin/buyer/storefront page
// (analytics charts, the theme builder, AI Studio, POS, every admin screen)
// shipped in ONE ~3.2MB JS bundle that had to fully download+parse before
// the very first pixel could paint, regardless of which single page was
// actually being visited — the real cause of a long white-screen on load.
// `RootLayout` already wraps its one top-level `<Outlet/>` in a single
// `<Suspense fallback={<PageSpinner/>}>` (see RootLayout.tsx), so every
// lazy component below suspends into that ONE boundary — no per-route
// `<Suspense>` wrapping needed here, and the route-tree JSX below is
// completely unchanged from before; only how each name is IMPORTED changed. ──

// Critical conversion-path pages
const LoginPage    = lazy(() => import('@/features/auth/pages/LoginPage').then(m => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage').then(m => ({ default: m.RegisterPage })));
const OnboardingPage  = lazy(() => import('@/features/auth/pages/onboard/OnboardingPage').then(m => ({ default: m.OnboardingPage })));
const OnboardingEntry = lazy(() => import('@/features/auth/pages/onboard/OnboardingPage').then(m => ({ default: m.OnboardingEntry })));

// Remaining auth pages
const AdminLoginPage     = lazy(() => import('@/features/auth/pages/admin/AdminLoginPage').then(m => ({ default: m.AdminLoginPage })));
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage').then(m => ({ default: m.ForgotPasswordPage })));
const VerifyOTPPage      = lazy(() => import('@/features/auth/pages/VerifyOTPPage').then(m => ({ default: m.VerifyOTPPage })));
const NewPasswordPage    = lazy(() => import('@/features/auth/pages/NewPasswordPage').then(m => ({ default: m.NewPasswordPage })));

// Public marketing pages
const Homepage             = lazy(() => import('@/features/buyer/pages/Homepage').then(m => ({ default: m.Homepage })));
const PricingPage          = lazy(() => import('@/features/buyer/pages/PricingPage').then(m => ({ default: m.PricingPage })));
const ForSellersPage       = lazy(() => import('@/features/buyer/pages/ForSellersPage').then(m => ({ default: m.ForSellersPage })));
const FaqPage              = lazy(() => import('@/features/buyer/pages/FaqPage').then(m => ({ default: m.FaqPage })));
const PrivacyPolicyPage    = lazy(() => import('@/features/buyer/pages/PrivacyPolicyPage').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage   = lazy(() => import('@/features/buyer/pages/TermsOfServicePage').then(m => ({ default: m.TermsOfServicePage })));
const CookiePolicyPage     = lazy(() => import('@/features/buyer/pages/CookiePolicyPage').then(m => ({ default: m.CookiePolicyPage })));
const ContactUsPage        = lazy(() => import('@/features/buyer/pages/ContactUsPage').then(m => ({ default: m.ContactUsPage })));
const AboutPage            = lazy(() => import('@/features/buyer/pages/AboutPage').then(m => ({ default: m.AboutPage })));
const SecurityPage         = lazy(() => import('@/features/buyer/pages/SecurityPage').then(m => ({ default: m.SecurityPage })));
const ProductsOverviewPage = lazy(() => import('@/features/buyer/pages/products/ProductsOverviewPage').then(m => ({ default: m.ProductsOverviewPage })));
const PlatformProductPage  = lazy(() => import('@/features/buyer/pages/products/PlatformProductPage').then(m => ({ default: m.PlatformProductPage })));
const SolutionsOverviewPage = lazy(() => import('@/features/buyer/pages/solutions/SolutionsOverviewPage').then(m => ({ default: m.SolutionsOverviewPage })));
const SolutionPage         = lazy(() => import('@/features/buyer/pages/solutions/SolutionPage').then(m => ({ default: m.SolutionPage })));

// ── Public / Buyer ────────────────────────────────────────────────────────────
const StorefrontLayout = lazy(() => import('@/features/storefront/StorefrontLayout').then(m => ({ default: m.StorefrontLayout })));
const ThemedRoute = lazy(() => import('@/features/storefront-themes/ThemedRoute').then(m => ({ default: m.ThemedRoute })));
const MaintenancePage = lazy(() => import('@/features/buyer/pages/MaintenancePage').then(m => ({ default: m.MaintenancePage })));

// ── Seller ────────────────────────────────────────────────────────────────────
const SellerAnalytics = lazy(() => import('@/features/seller/dashboard/SellerAnalytics').then(m => ({ default: m.SellerAnalytics })));
const StoreBuilderRedirect = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/StoreBuilderRedirect').then(m => ({ default: m.StoreBuilderRedirect })));
const PagesPage = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/pages/PagesPage').then(m => ({ default: m.PagesPage })));
const MenuManagerPage = lazy(() => import('@/features/seller/store/Dashboard/Manage/MenuManagerPage').then(m => ({ default: m.MenuManagerPage })));
const BlogPage = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/blog/BlogPage').then(m => ({ default: m.BlogPage })));
const ThemeLibraryPage = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/themes/ThemeLibraryPage').then(m => ({ default: m.ThemeLibraryPage })));
const AtelierCustomizePage = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/themes/AtelierCustomizePage').then(m => ({ default: m.AtelierCustomizePage })));
const AtelierEditCodePage = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/themes/AtelierEditCodePage').then(m => ({ default: m.AtelierEditCodePage })));
const AtelierHeaderFooterPage = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/themes/AtelierHeaderFooterPage').then(m => ({ default: m.AtelierHeaderFooterPage })));
const ThemeDemoPreview = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/themes/AtelierThemeDemoPreview').then(m => ({ default: m.ThemeDemoPreview })));
const ThemeSharePreviewPage = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/themes/ThemeSharePreviewPage').then(m => ({ default: m.ThemeSharePreviewPage })));
const SellerSettings = lazy(() => import('@/features/seller/dashboard/settings/SellerSettings').then(m => ({ default: m.SellerSettings })));
const SellerShipping = lazy(() => import('@/features/seller/dashboard/SellerShipping').then(m => ({ default: m.SellerShipping })));
const SellerMessages = lazy(() => import('@/features/seller/dashboard/SellerMessages').then(m => ({ default: m.SellerMessages })));
const SellerStoreList = lazy(() => import('@/features/seller/store/Dashboard/OnlineStore/SellerStoreList').then(m => ({ default: m.SellerStoreList })));

// ── Store Workspace ───────────────────────────────────────────────────────────
const StoreDashboard = lazy(() => import('@/features/seller/store/Dashboard/StoreDashboard'));
const StoreNotFound = lazy(() => import('@/features/seller/store/Dashboard/StoreNotFound'));
const StoreProductList = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/products/StoreProductList'));
const StoreAddProduct = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/products/StoreAddProduct'));
const StoreEditProduct = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/products/StoreEditProduct'));
const StoreProductDetail = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/products/StoreProductDetail'));
const StoreCustomerList = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/customer/CustomerList'));
const StoreSettings = lazy(() => import('@/features/seller/store/Dashboard/Manage/StoreSettings'));
const StoreCategories = lazy(() => import('@/features/seller/store/Dashboard/Manage/StoreCategories'));
const StoreCollections = lazy(() => import('@/features/seller/store/Dashboard/Manage/StoreCollections'));
const FilesLibrary = lazy(() => import('@/features/seller/store/Dashboard/Manage/FilesLibrary'));
const StorePlanBilling = lazy(() => import('@/features/seller/store/Dashboard/Manage/StorePlanBilling'));
const StoreOrderList = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/orders/OrderList').then(m => ({ default: m.StoreOrderList })));
const StoreOrderDetail = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/orders/OrderDetail').then(m => ({ default: m.StoreOrderDetail })));
const DraftOrdersList = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/orders/DraftOrdersList'));
const DraftOrderForm = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/orders/DraftOrderForm'));
const StoreReturnList = lazy(() => import('@/features/seller/store/Dashboard/StoreSection/returns/ReturnList').then(m => ({ default: m.StoreReturnList })));
const StoreAnalytics = lazy(() => import('@/features/seller/store/Dashboard/Analytic/analytics/Analytics').then(m => ({ default: m.StoreAnalytics })));
const StoreAIStudio = lazy(() => import('@/features/seller/store/Dashboard/Analytic/ai/AiStudio').then(m => ({ default: m.StoreAIStudio })));
const StoreSEO = lazy(() => import('@/features/seller/store/Dashboard/Analytic/seo/StoreSEO').then(m => ({ default: m.StoreSEO })));
const StoreFinance = lazy(() => import('@/features/seller/store/Dashboard/Operations/finance/Finance').then(m => ({ default: m.StoreFinance })));
const StoreReviews = lazy(() => import('@/features/seller/store/Dashboard/Operations/reviews/reviews').then(m => ({ default: m.StoreReviews })));
const StoreInventory = lazy(() => import('@/features/seller/store/Dashboard/Operations/inventory/Inventory').then(m => ({ default: m.StoreInventory })));
const StoreMarketing = lazy(() => import('@/features/seller/store/Dashboard/Operations/marketing/Marketing').then(m => ({ default: m.StoreMarketing })));
const StoreLoyalty = lazy(() => import('@/features/seller/store/Dashboard/Operations/loyalty/Loyalty').then(m => ({ default: m.StoreLoyalty })));
const StoreSubscriptions = lazy(() => import('@/features/seller/store/Dashboard/Operations/subscriptions/Subscriptions').then(m => ({ default: m.StoreSubscriptions })));
const StoreIntegrations = lazy(() => import('@/features/seller/store/Dashboard/Operations/integrations/Integrations').then(m => ({ default: m.StoreIntegrations })));
// Seller-facing surfaces for two features whose backend + frontend API
// clients already existed (automatic discounts, gift cards — both already
// wired into checkout pricing) but had no dashboard page anywhere to reach
// them from — the same "built but unreachable" gap as AtelierLivePreview's
// hardcoded-theme bug, just in a different corner of the app.
const StoreDiscounts = lazy(() => import('@/features/seller/store/Dashboard/Manage/StoreDiscounts'));
const StoreGiftCards = lazy(() => import('@/features/seller/store/Dashboard/Manage/StoreGiftCards'));
const StoreMobileApp = lazy(() => import('@/features/seller/store/Dashboard/Manage/MobileApp'));
const MetafieldDefinitionsPage = lazy(() => import('@/features/seller/store/Dashboard/Manage/MetafieldDefinitionsPage').then(m => ({ default: m.MetafieldDefinitionsPage })));

// ── Admin ─────────────────────────────────────────────────────────────────────
const AdminOverview = lazy(() => import('@/features/admin/pages/AdminOverview').then(m => ({ default: m.AdminOverview })));
const AdminAnalytics = lazy(() => import('@/features/admin/pages/AdminAnalytics').then(m => ({ default: m.AdminAnalytics })));
const AdminUsers = lazy(() => import('@/features/admin/pages/AdminUsers').then(m => ({ default: m.AdminUsers })));
const AdminModeration = lazy(() => import('@/features/admin/pages/AdminModeration').then(m => ({ default: m.AdminModeration })));
const AdminActivityLog = lazy(() => import('@/features/admin/pages/AdminActivityLog').then(m => ({ default: m.AdminActivityLog })));
const AdminMessaging = lazy(() => import('@/features/admin/pages/AdminMessaging').then(m => ({ default: m.AdminMessaging })));
const AdminMarketplace = lazy(() => import('@/features/admin/pages/AdminMarketplace').then(m => ({ default: m.AdminMarketplace })));
const AdminLeads = lazy(() => import('@/features/admin/pages/AdminLeads').then(m => ({ default: m.AdminLeads })));
const AdminSubscriptions = lazy(() => import('@/features/admin/pages/AdminSubscriptions').then(m => ({ default: m.AdminSubscriptions })));
const AdminPlatformPlans = lazy(() => import('@/features/admin/pages/AdminPlatformPlans').then(m => ({ default: m.AdminPlatformPlans })));
const AdminFinance = lazy(() => import('@/features/admin/pages/AdminFinance').then(m => ({ default: m.AdminFinance })));
const AdminAnnouncements = lazy(() => import('@/features/admin/pages/AdminAnnouncements').then(m => ({ default: m.AdminAnnouncements })));
const AdminThemeCatalog = lazy(() => import('@/features/admin/pages/AdminThemeCatalog').then(m => ({ default: m.AdminThemeCatalog })));
const AdminBanners = lazy(() => import('@/features/admin/pages/AdminBanners').then(m => ({ default: m.AdminBanners })));
const AdminFaqs = lazy(() => import('@/features/admin/pages/AdminFaqs').then(m => ({ default: m.AdminFaqs })));
const AdminShippingZones = lazy(() => import('@/features/admin/pages/AdminShippingZones').then(m => ({ default: m.AdminShippingZones })));
const AdminContactMessages = lazy(() => import('@/features/admin/pages/AdminContactMessages').then(m => ({ default: m.AdminContactMessages })));
const AdminTestimonials = lazy(() => import('@/features/admin/pages/AdminTestimonials').then(m => ({ default: m.AdminTestimonials })));
const AdminManualPayments = lazy(() => import('@/features/admin/pages/AdminManualPayments').then(m => ({ default: m.AdminManualPayments })));
const AdminCommissionRules = lazy(() => import('@/features/admin/pages/AdminCommissionRules').then(m => ({ default: m.AdminCommissionRules })));
const AdminConfig = lazy(() => import('@/features/admin/pages/AdminConfig').then(m => ({ default: m.AdminConfig })));
const AdminFxSettings = lazy(() => import('@/features/admin/pages/AdminFxSettings').then(m => ({ default: m.AdminFxSettings })));
const AdminMarketing = lazy(() => import('@/features/admin/pages/AdminMarketing').then(m => ({ default: m.AdminMarketing })));
const AdminSettings = lazy(() => import('@/features/admin/pages/settings/AdminSettings').then(m => ({ default: m.AdminSettings })));
const AdminSEO = lazy(() => import('@/features/admin/pages/AdminSEO').then(m => ({ default: m.AdminSEO })));
const AdminAiStudio = lazy(() => import('@/features/admin/pages/AdminAiStudio').then(m => ({ default: m.AdminAiStudio })));
const AdminStoreAppRequests = lazy(() => import('@/features/admin/pages/AdminStoreAppRequests').then(m => ({ default: m.AdminStoreAppRequests })));

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
          { path: 'checkout/:checkoutId/return', element: <ThemedRoute routeKey="checkoutReturn" /> },
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
      { path: '*', element: <ThemedRoute routeKey="notFound" /> },
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
          { path: 'online-store/menus',                element: <MenuManagerPage /> },
          { path: 'online-store/blog',                element: <BlogPage /> },
          { path: 'returns',                          element: <StoreReturnList /> },
          { path: 'seo',                              element: <StoreSEO /> },
          { path: 'ai/studio',                        element: <StoreAIStudio /> },
          { path: 'reviews',                          element: <StoreReviews /> },
          { path: 'finance',                          element: <StoreFinance /> },
          { path: 'inventory',                        element: <StoreInventory /> },
          { path: 'marketing',                        element: <StoreMarketing /> },
          { path: 'discounts',                        element: <StoreDiscounts /> },
          { path: 'metafields',                       element: <MetafieldDefinitionsPage /> },
          { path: 'gift-cards',                       element: <StoreGiftCards /> },
          { path: 'loyalty',                          element: <StoreLoyalty /> },
          { path: 'subscriptions',                    element: <StoreSubscriptions /> },
          { path: 'integrations',                     element: <StoreIntegrations /> },
          { path: 'mobile-app',                       element: <StoreMobileApp /> },
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

      // Real, shareable "see this before it's live" link — public, no auth,
      // no dashboard chrome (same reasoning as the Theme Demo Preview route
      // right above). See `ThemeSharePreviewPage`'s own doc comment.
      { path: '/theme-preview/:storeId/:token', element: <ThemeSharePreviewPage /> },

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
          { path: 'store-app-requests', element: <RequireRole role="admin"><AdminStoreAppRequests /></RequireRole> },
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
