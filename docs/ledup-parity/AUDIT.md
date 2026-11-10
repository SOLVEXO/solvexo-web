# Ledup theme parity audit (theme-05-ledup vs https://ledup.pt)

Date 2026-11-10. Branch `feat/ledup-parity-audit`. Observation + plan only; no theme code changed.
Evidence labels: **OBSERVED** (measured/seen), **INFERRED**, **UNKNOWN**.
Screenshots are outside the repo (session scratchpad `ledup-ref/`, `ledup-ours/`). Nothing from ledup.pt (logo, photos, text, code) is to be copied; we replicate layout, behaviour and motion only.

## 0. What could / could not be captured
Captured (Playwright + Chrome, read-only, one session): home (4 widths, plus preloader frames), categories, products-list, a product page, documents, about-us, resellers, contact, terms, 404 (each at 1440/1024/768/390, full-page), computed-style/motion extraction on home, JS bundle library scan, link map (54 links).
NOT captured / unreliable:
- Full-page screenshots of ledup.pt are mostly blank below the hero because sections reveal on scroll (OBSERVED). Section-by-section viewport shots from an earlier session (`scratchpad/ld/shots/s-0..5.png`) are the visual source for lower sections.
- Header search panel and cart drawer: click selectors timed out (search/cart buttons not matched). Cart drawer DOM exists (`CartDrawer_drawer`, display:none) (OBSERVED), open state NOT captured.
- Mega menu: hover did not make it visible in headless run (`MegaMenu_megaMenu` opacity 0 / visibility hidden after hover). Structure known (left/middle/right columns, `parent_item.active`), open state from earlier session CSS only.
- Lighting-simulation (switches / Zona 1-5) step-by-step interaction: NOT performed. Counter showcase ("102") slide changes: NOT recorded. Projects slider drag/arrow behaviour: NOT recorded.
- Product page: `/product/onyx-3cct` rendered a *different* product (Exterior > Projetores Anti-Corrosão with LDP codes + per-CCT "Download" rows). Technical-spec table fields not extracted.
- Playwright MCP tool was not available; plain Playwright via node was used.
- Our theme: only the home demo (`ThemeDemoPreview` via temporary untracked harness `__e2e__/ledup.*`, to be deleted) was rendered. Other pages/states (mega menu, search, cart drawer, listing, product) NOT rendered because they need a live store/API.

## 1. Reference facts (ledup.pt)
- Stack: Next.js app with CSS modules (class names like `Header_header__outter_wrapper__`) (OBSERVED). Font Poppins 200/300/400/500/600 (OBSERVED). `<html>` has no Lenis class (OBSERVED), so **no Lenis smooth scroll** (INFERRED: native scroll).
- Animation libs: JS bundles contain `gsap` (5 chunks) and `ScrollTrigger` (6 chunks) strings (OBSERVED); no global `window.gsap` (bundled). Usage of ScrollTrigger for reveal/pinning INFERRED from inline `transform/opacity` styles on 83 elements (OBSERVED) and blank-until-scrolled sections.
- Overlays present in DOM: `Preloader_overlay` (fixed, full viewport), `PageTransitions_overlay` (route-transition overlay), `CartDrawer_scrim/drawer`, `MegaMenu` (OBSERVED). So ledup has a **page-transition overlay** that we do not.
- Home structure (OBSERVED, 5 sections, 1440w): HomeFirstSection slider 900px; HomeSecond 1142px (category/products area); HomeFourth 682px (white bg); HomeFifth 1275px; HomeThird 900px (+ footer). Headings: "Ideias que iluminam o caminho.", "A informação certa no momento certo.", counter "102".
- Header: `position: fixed; top:0; height 80px`, transition `all` (OBSERVED). Class does not change while scrolling 0 -> 4788px (OBSERVED), so no scrolled-state class swap; logo colour change over dark sections is done differently (INFERRED, not measured).
- Tokens (OBSERVED): bg #fafafa, brand brown rgb(75,66,59)=#4b423b, muted #a69d98 / #a1948c / #8c847e; most radii 20px, 50px (pills), 100%/50% circles, 16/12/10px; containers `calc(100% - 108px)`, 1440px with 80px padding, 900px, 600px.
- Type scale (OBSERVED): body 14px/20px 400; uppercase 14px spans; H1 36px/500/43.2; H3 uppercase 14px; H4 14px/600; small 12-13px.
- Transitions (OBSERVED, count): color .18s ease (28); transform .5s ease (20); opacity .5s ease (20); opacity .5s ease-in-out (11); background/box-shadow .25s; transform .28s cubic-bezier(.22,.61,.36,1) (cards); transform .35s; `right .3s` (cart drawer). Keyframes only: fadeInBackdrop, spin, bounce. All other motion is JS-driven (GSAP, INFERRED).
- Pages (OBSERVED): `/`, `/categories`, `/products-list` (query `parent_cat/child_cat/filter_cat`; "280 de 280 Produtos", sort Nome A-Z/Z-A, "Filtrar"), `/product/<slug>` (breadcrumb, per-variant rows "LDP-xxx 3000K Download"), `/documents` (Catálogos / Fichas técnicas / Brochuras), `/about-us` (timeline with years), `/resellers` (map with Leaflet/OSM, district > concelho > reseller card), `/contact` (stepped form: motivo, informação básica, detalhes), `/recover-password`, `/terms-and-conditions`, `/privacy-policy`, 404. No blog/news pages found (a "Novidades" link exists in footer, target not verified: UNKNOWN).

## 2. Component gap table
| Component | ledup.pt (observed) | Our theme | Gap | Pri | Effort |
|---|---|---|---|---|---|
| Preloader | full-screen overlay, runs on load | `components/LedupPreloader.tsx` (once/always/hide, video, tone, style) | duration/what plays on ref not measured (UNKNOWN) | P2 | S |
| Page transition | `PageTransitions_overlay` | none | missing | P1 | M |
| Header | fixed 80px glass pill, CTA "Contacto", search, account | `LedupNavbar.tsx`; in the demo render the header is a flat white bar with a white strip below it, no glass pill over a hero | floating-over-hero look not reproduced in demo (no hero in demo data) | P0 | M |
| Mega menu | 3 columns (left parents, middle, right promo), backdrop blur | `LedupMegaMenu.tsx` | open state unverified on both sides; highlighted-product column missing (INFERRED from earlier notes) | P1 | M |
| Search panel | large panel | `LedupSearchPanel.tsx` | not captured on ref | P2 | S |
| Cart drawer | right drawer, `right .3s` | `LedupCart.tsx` (ported) | look not compared | P2 | S |
| Hero | slider 900px, numbered switcher, curved bottom | `sections/HeroSection.tsx` (+ `tx-up` Tech classes) | demo has no hero; Tech classes | P0 | M |
| Category nav (Interior/Exterior/...) | category blocks + "Ver todas" | `ledup.category_tabs`, `LedupHeroCategoryBanner` | structure differs, not verified | P1 | M |
| Counter / product showcase ("102") | big number + product name/spec per slide | none (closest: `stats_counter`) | missing | P1 | L |
| Projects slider | "Ideias que iluminam o caminho" | `ledup.projects` | behaviour not recorded | P1 | M |
| Lighting simulation (switches, Zona 1-5) | interactive layers | none (`ledup.switcher` is a photo switcher) | missing; interaction not captured | P1 | L |
| Highlights / bento / stacked / statement | present | `ledup.highlights/bento/stacked/statement` | exist; demo shows plain white cards with icon, not the reference look | P2 | M |
| Footer | curved, brown, video bg | `LedupFooter.tsx` (renders; demo footer is minimal) | content depth | P2 | S |
| Product card | borderless, spec chips | `LedupProductCard.tsx` | exists | P3 | S |
| Listing + filters | sort + "Filtrar", 280 items, category tabs | `LedupProductBrowser/FilterSidebar` | facets are vendor/tag/option/price only (see section 5) | P1 | M |
| Product page | per-variant rows with Download, split bg | `pages/LedupProductPage.tsx` | datasheet download, complementary products missing | P1 | M |
| Documents page | catalogues/datasheets/brochures | none | missing | P1 | M |
| Resellers page | Leaflet map + list | `store_locations` section only | missing map/list page | P2 | L |
| Contact page | 3-step form | `contact_form` section | stepper missing | P2 | S |
| About page | year timeline | none | missing | P2 | M |
| News/blog | not verified | `LedupBlogFaqPages` | UNKNOWN | P3 | S |
| Cookie banner | not captured | `LedupCookieBanner` | UNKNOWN | P3 | S |
| Mobile menu | not captured here | `.ld-mobile-panel` | earlier session notes only | P2 | S |

## 3. Motion gap
Reference (OBSERVED unless noted): GSAP + ScrollTrigger in bundle; 83 elements with inline transform/opacity; preloader; page-transition overlay; mega menu opacity/translate; card hover `transform .28s cubic-bezier(.22,.61,.36,1)`; 0.5s ease opacity/transform reveals; drawer `right .3s`. Not measured: per-element delay, distance, scrub, pinning, parallax (UNKNOWN).
Ours: `grep` for `motion`, `lenis`, `framer-motion` inside `theme-05-ledup` returns **0 files** (confirmed). The app has `motion`/`lenis` in `src/components/comman/motion/*` (AnimatedCounter, BrandSplash, ClipReveal, Cursor ...) and `ProductMockups.tsx`, all outside the theme. Ledup motion is CSS only (`ledup.css`, `ledup-tx.css` `tx-up`), plus preloader and stats counter. No scroll reveal setting, no page transition, no reduced-motion handling verified (UNKNOWN, not grepped for `prefers-reduced-motion`).
Note: ledup.pt itself does not use Lenis; adding Lenis is optional, not required for parity.

## 4. Theme depth (re-counted)
- Files in theme-05-ledup: 130 (sections 31 incl. shared 15, components 21, pages 54, ui 12, layout 1).
- Registered section types: 44 (list: article_content, blog_post_list, blog_posts, cart_items, cart_summary, category_product_grid, collage, collection_banner, collection_list, collection_product_grid, contact_form, custom_html, divider, drop_countdown, faq, feature_list, featured_category_grid, featured_product, featured_products, gallery_grid, hero, hero_banner, image_banner, image_with_text, logo_list, marquee, metaobject_list, multicolumn, multirow, newsletter, page_content, product_catalog, product_main, recently_viewed, related_products, rich_text, search_results, stats_counter, store_locations, team_grid, testimonials, theme_section, trust_badges, video).
- Ledup custom sections (via `theme_section`): 7 (`ledup.category_tabs, highlights, bento, projects, switcher, stacked, statement`).
- Manifest: 67 `kind:` field entries in `manifestBase.ts`; 13 `custom.*` setting keys; groups Colors(5), Effects(8), Typography(2), Pagination(2), Product page(1), plus template-scoped groups.
- Per-section settings: `LedupSectionRenderer` imports `sectionSpacing`, `colorSchemeId` handling (spacing + colour scheme exist, shared with other themes). Reveal-animation setting: none.
- Missing vs a mature theme (proposals): per-section reveal animation (none/fade-up/stagger) + reduce-motion; announcement bar; header ghost/transparent-over-hero option; section width/alignment options; more block types for highlights/bento; sticky add-to-cart; product badges; documents/datasheet section; counter showcase section; lighting-simulation section; timeline section; reseller map section.

## 5. Technical debt
- `ledup-tx.css` (138 lines) is Tech's stylesheet, header still says "Tech Store theme"; 44 files in the theme reference `tx-` classes (top: `tx-btn` 30, `tx-bidi` 19, `tx-flip-rtl` 13, `tx-cta`, `tx-pill`, `tx-mq-track`, `tx-hero`, `tx-up`...). HeroSection (the home hero) depends on `tx-up`, `tx-on-image`, `tx-serif`, `tx-h`. Not Ledup-specific.
- 54 page files and many section files are Tech-derived copies (earlier session note), so look is Tech-like on checkout/account.
- `theme.base.ts` is a copy of Tech's settings engine.
- No tests for Ledup (UNKNOWN for new; none found in earlier session).

## 6. Data / backend dependencies (verified in code)
- Listing facets API (`store.service.ts` ~1983) returns: availability, price range, productTypes, vendors, tags, option names/values. **No numeric technical attributes** (watts, lm/W, IP, CCT) as facets. They could only be modelled as tags or variant options today.
- Metafields module exists (`metafield-definition/value` schemas keyed by ownerResource/ownerId); `store.service.ts` and products do not reference metafields in listing/filter code (grep empty) -> **filtering by metafield: not supported** (UNKNOWN whether a public values endpoint can feed spec tables; `public-metafields.controller.ts` exists).
- Datasheet download: product schema has `DigitalFile` for digital products only; no "attachments/datasheet" field for physical products found. Could use a metafield (file URL) or a Files-library link: UNKNOWN, needs design.
- API not changed.

## 7. Risks
- P0: demo/home shows no hero and a flat header, so the main identity (floating glass header over curved hero) is not visible in demo; hero relies on Tech `tx-` classes.
- P1: no attribute facets -> parity listing filters need backend work or tags/options convention.
- P1: depends on missing reference captures (mega menu, simulation, counter, projects) before building those sections; spend a capture pass with scroll-synchronised screenshots first.
- P2: GSAP is a new dependency (not in package.json? UNKNOWN, not checked); `motion` is already available and sufficient for reveals.
- P2: 130 files, CSS shared with Tech: edits to `ledup-tx.css` are safe only because it is a copy; verify Tech unaffected.

## 8. Build plan (small shippable tasks)
1. **Tokens/CSS cleanup**: rename `ledup-tx.css` to Ledup-owned `ld-` classes, remove "Tech" strings; replace `tx-up/on-image/serif/h` in HeroSection. Accept: no `tx-` in Ledup files; tsc/lint/vitest green; Tech unchanged.
2. **Animation foundation**: reveal helper using `motion` (`useInView`), per-section setting "Reveal animation" (none/fade-up/stagger), `prefers-reduced-motion` respected; optional page transition overlay. Out of scope: Lenis.
3. **Header/hero/footer fidelity**: demo data with hero image, glass pill over hero, ghost-to-solid state, curved hero, footer. Verify 1440/390 against reference shots.
4. **Category nav + counter showcase** (new `ledup.counter_showcase` custom section).
5. **Projects slider** (re-capture behaviour first).
6. **Lighting simulation** section (capture interaction first).
7. **Listing + filters**: spec chips from tags/options; decide backend attribute plan separately (API task, needs approval).
8. **Product page + downloads**: datasheet rows (metafield or files library, needs design), complementary products.
9. **Content pages**: documents, about timeline, resellers, contact stepper.
10. **Depth**: announcement bar, more blocks, sticky ATC.
Each task verification: desktop+mobile screenshots vs reference, reduced-motion check, keyboard/a11y, `npm run lint`, `npx tsc -b`, relevant vitest.

## Commands run
`git checkout -b feat/ledup-parity-audit` (done), Playwright scripts audit1/2/3 + probe (ok; some selectors timed out as noted), temporary vite dev server on :5199 with untracked `__e2e__/ledup.*` harness (to be removed). No repo source files modified besides this document.

## Addendum 2026-11-10: second capture pass (OBSERVED)
- Mega menu opens on click/hover of "Produtos & Aplicações": left = 6 parent categories (underline on active) + "Ver todas as categorias" pill; middle = two groups (e.g. "Iluminação interior", "Iluminação por espaço") + "Ver tudo em Interior" pill; right = "EM DESTAQUE" white product card. Surface bg #fafafa, radius 0 0 50px 50px, padding 75px, columns 258 / 774 / 258 px.
- Search: glass panel drops from the header, large "Procurar por nome, referência..." input with a round arrow button, dark blurred backdrop. Account: small white popover (user/email, password with eye, "Entrar", forgot link).
- Home: slider 2 slides (numbered 01/02); "Destaques" bento (photo tiles with round arrow, a product card, a copper "102 Lojas em território nacional" stat tile, catalogue tile); Projects: white rounded card, circular rotating "Arrastar para ver mais projetos" text + horizontal photo cards with hotspot dots; Simulation ("Sobre nós / Compromisso com a Excelência"): scene = base image `lights-controller/off.jpg` + stacked layer images (opacity 0 -> 1), 5 power-switch pills "ZONA 1..5" in a bottom bar; dark brown stacked card "Para quem exige mais da iluminação" with numbered list 01-03.
- Product page: split bg (grey left / white right), breadcrumb, gallery card, "Características Técnicas" rows with outline/filled pills (Referência, Acessórios para, Housing, Dimensões, Certificação), "Ficha Técnica" download pill, "Produtos Complementares".
## Built in this pass
Scroll-reveal (setting `custom.reveal`, reduced motion respected), Ledup-owned `ld-up/ld-serif` classes in HeroSection (no `tx-` in hero), new sections `ledup.simulation`, `ledup.timeline`, `ledup.documents`, bento "big number" tile, mega-menu "Featured" card, demo with bento + simulation. NOT built: counter-showcase slider, circular-text projects drag, datasheet button on product page (needs a data source), page-transition overlay, resellers map, removal of remaining `tx-` classes (43 other files).
