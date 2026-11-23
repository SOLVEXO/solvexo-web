// The home page's hero, pre-built into its HTML (src/seo/prerender.ts) so the headline (the page's largest text, what
// Google measures as Largest Contentful Paint) shows as soon as the HTML and CSS arrive, instead of after the whole app
// has downloaded and started. It sits over the page until the real hero (HomeHeroLight) mounts and removes it in the
// same frame. Same Tailwind classes as HomeHeroLight's copy column, so the swap does not move anything.
//
// Plain strings, no React and no "@/" imports: vite.config.ts loads this file while building.

export const HOME_HERO_SHELL_ID = 'solvexo-home-shell';

/** English copy: must match HOME_HERO_TEXT.en (homeHeroShell.test.ts checks it). */
export const HOME_HERO_SHELL_TEXT = {
  eyebrow: 'Your next chapter in commerce',
  headline1: 'Big ideas.',
  headline2: 'Beautiful stores.',
  headline3: 'Connected business.',
  lead: 'Build a store that feels like you. Sell online and in person. Bring your orders, stock and customers together.',
  exploreSelling: 'Explore selling with Solvexo',
  productTour: 'Take a product tour',
  onePlatform: 'One platform. More possibilities.',
};

const GCC = 'ae|sa|qa|kw|bh|om';

/**
 * The markup that goes right after `#root`. Hidden without JavaScript (those visitors and crawlers get the plain
 * #solvexo-static content instead) and for visitors who will see the Arabic site (saved choice or a GCC address),
 * since this copy is English. Taken out of the accessibility tree: the real hero replaces it moments later.
 */
export function homeHeroShellHtml(): string {
  const t = HOME_HERO_SHELL_TEXT;
  return [
    `<style>html:not(.js) #${HOME_HERO_SHELL_ID},.sx-site-ar #${HOME_HERO_SHELL_ID}{display:none}</style>`,
    `<script>(function(){try{var l=null;try{l=localStorage.getItem('solvexo_site_lang')}catch(e){}var c=(/^\\/([a-z]{2})(\\/|$)/.exec(location.pathname)||[])[1];if(l==='ar'||(l!=='en'&&/^(${GCC})$/.test(c||'')))document.documentElement.classList.add('sx-site-ar')}catch(e){}})()</script>`,
    `<div id="${HOME_HERO_SHELL_ID}" aria-hidden="true" style="position:absolute;top:0;left:0;right:0;z-index:45;background:#faf9f5">`,
    '<div class="h-[72px] border-b border-[#e5e5dd]"><div class="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center gap-2">',
    '<img src="/brand/solvexo-icon.png" alt="" width="36" height="36" />',
    '<span class="font-sans font-extrabold tracking-[-0.02em] leading-none text-[#111110] text-[22px]">Solvex<span class="text-brand-orange">o</span></span>',
    '</div></div>',
    '<section class="relative overflow-hidden bg-[#faf9f5] text-[#1c1d1b]">',
    '<div class="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-5 px-[6%] lg:px-[5%] pt-12 sm:pt-16 lg:pt-[86px] pb-10 lg:pb-[70px] lg:min-h-[730px]">',
    '<div class="flex flex-col justify-center">',
    '<p class="flex items-center gap-[9px] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-[#8f5a43]">',
    '<span class="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0"></span>',
    `<span class="normal-case tracking-[0.02em] text-[12px] sm:text-[13px]">Solvexo</span><span>—</span> ${t.eyebrow}</p>`,
    '<p class="font-sans font-semibold text-[40px] sm:text-[54px] lg:text-[clamp(40px,4vw,60px)] leading-[1.1] tracking-[-0.05em] mt-6 mb-6">',
    `${t.headline1}<br />${t.headline2}<br /><span class="text-brand-orange">${t.headline3}</span></p>`,
    `<p class="text-[15px] leading-[1.85] text-[#64665f] max-w-[400px]">${t.lead}</p>`,
    '<div class="flex flex-wrap items-center gap-x-6 gap-y-4 mt-7">',
    `<a href="/sellers" tabindex="-1" class="inline-flex items-center gap-[26px] px-[22px] py-[17px] rounded-[7px] text-[13px] font-semibold text-white bg-brand-orange no-underline">${t.exploreSelling} <span style="display:inline-block;width:17px"></span></a>`,
    `<a href="/products" tabindex="-1" class="inline-flex items-center gap-[18px] py-[14px] text-[13px] font-semibold border-0 border-b border-[#aaa] text-[#1c1d1b] no-underline">${t.productTour} <span style="display:inline-block;width:15px"></span></a>`,
    '</div>',
    `<div class="mt-9 flex items-center gap-3 text-[11px] text-[#64665f]"><span class="inline-flex items-center gap-2 border border-[#e5e5dd] rounded-full px-2.5 py-[7px]" style="width:58px;height:27px"></span>${t.onePlatform}</div>`,
    '</div></div></section></div>',
  ].join('\n    ');
}
