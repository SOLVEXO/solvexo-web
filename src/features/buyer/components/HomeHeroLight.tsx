import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowUpRight, ArrowRight, Check, LayoutGrid, ListOrdered, Diamond, Home, Sparkles, Menu } from 'lucide-react';
import { Reveal } from '@/components/comman/motion/Reveal';
import { SolvexoIcon } from '@/components/comman/ui/SolvexoLogo';
import { countryFromPathname } from '@/utils/countryPrefix';
import { useSiteText } from '@/i18n/site/useSiteText';
import { HOME_HERO_TEXT } from './HomeHeroLight.text';

/**
 * The home page's light hero (owner's new website design): copy on the left, an illustrative workspace + storefront
 * mock-up on the right. Every figure in the mock-up is labelled as sample data. Product photos are the unbranded
 * Maison theme-demo images already shipped in /public.
 */

const PHOTOS = {
  hero: '/theme-demo/maison/bag-1.jpg',
  thumbs: ['/theme-demo/maison/watch-1.jpg', '/theme-demo/maison/bag-2.jpg', '/theme-demo/maison/bracelet-1.jpg'],
};

const BARS = [32, 49, 42, 67, 55, 83, 96];

/** Sample amounts in the visitor's own currency where we know it from the URL's country (/pk → PKR), else USD. */
function useSampleMoney() {
  const { pathname } = useLocation();
  const pk = countryFromPathname(pathname) === 'pk';
  const fmt = new Intl.NumberFormat(pk ? 'en-PK' : 'en-US', { style: 'currency', currency: pk ? 'PKR' : 'USD', maximumFractionDigits: 0 });
  return { sales: fmt.format(pk ? 84250 : 3420), order1: fmt.format(pk ? 4200 : 168), order2: fmt.format(pk ? 2850 : 114) };
}

export function HomeHeroLight() {
  const navigate = useNavigate();
  const money = useSampleMoney();
  const t = useSiteText(HOME_HERO_TEXT);

  return (
    <section className="relative overflow-hidden bg-[#faf9f5] text-[#1c1d1b]">
      <div className="max-w-[1440px] mx-auto grid lg:grid-cols-2 gap-10 lg:gap-5 px-[6%] lg:px-[5%] pt-12 sm:pt-16 lg:pt-[86px] pb-10 lg:pb-[70px] lg:min-h-[730px]">
        {/* Copy */}
        <div className="flex flex-col justify-center">
          <Reveal delay={0}>
            {/* The page's main heading carries the app name in its exact case: Google's OAuth brand review compares
               the consent screen's name with the home page. */}
            <h1 className="flex items-center gap-[9px] text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] rtl:tracking-normal text-[#a66c53]">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-orange shrink-0" aria-hidden />
              <span className="normal-case tracking-[0.02em] text-[12px] sm:text-[13px]">Solvexo</span>
              <span aria-hidden>—</span> {t.eyebrow}
            </h1>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="font-sans font-semibold text-[40px] sm:text-[54px] lg:text-[clamp(40px,4vw,60px)] leading-[1.1] tracking-[-0.05em] rtl:tracking-normal rtl:leading-[1.3] mt-6 mb-6">
              {t.headline1}<br />
              {t.headline2}<br />
              <span className="text-brand-orange">{t.headline3}</span>
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="text-[15px] leading-[1.85] text-[#777974] max-w-[400px]">
              {t.lead}
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-4 mt-7">
              <button
                type="button"
                onClick={() => navigate('/sellers')}
                className="inline-flex items-center gap-[26px] px-[22px] py-[17px] rounded-[7px] text-[13px] font-semibold text-white bg-brand-orange hover:-translate-y-0.5 transition-transform cursor-pointer border-0"
              >
                {t.exploreSelling} <ArrowUpRight size={17} strokeWidth={2.2} className="rtl:-scale-x-100" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => navigate('/products')}
                className="inline-flex items-center gap-[18px] py-[14px] text-[13px] font-semibold border-0 border-b border-[#aaa] bg-transparent hover:text-brand-orange transition-colors cursor-pointer"
              >
                {t.productTour} <ArrowRight size={15} className="rtl:-scale-x-100" aria-hidden />
              </button>
            </div>
          </Reveal>

          <Reveal delay={0.4}>
            <div className="mt-9 flex items-center gap-3 text-[11px] text-[#777974]">
              <span className="inline-flex items-center gap-2 border border-[#e5e5dd] rounded-full px-2.5 py-[7px] text-[#666]" aria-hidden>
                <ListOrdered size={11} /><Diamond size={10} /><ArrowUpRight size={11} className="rtl:-scale-x-100" />
              </span>
              {t.onePlatform}
            </div>
          </Reveal>
        </div>

        {/* Illustrative visual */}
        <Reveal delay={0.25}>
          <div className="relative min-h-[460px] sm:min-h-[550px] lg:mt-6" aria-hidden>
            <div className="absolute w-[600px] h-[600px] rounded-full -start-2.5 -top-12 bg-[radial-gradient(circle,#ecd3beaa,#f3e9dc66_60%,transparent_60%)]" />

            <div className="relative flex items-center gap-2 text-[9px] tracking-[0.15em] rtl:tracking-normal text-[#777974] mb-[18px] ms-2 sm:ms-[34px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#5c856c]" /> {t.commerceConnected}
              <ArrowUpRight size={10} className="ms-auto me-[35px] rtl:-scale-x-100" />
            </div>

            {/* Workspace */}
            <div className="relative ms-1 sm:ms-[30px] w-full sm:w-[93%] -rotate-2 border border-[#e5e0d9] rounded-xl bg-white shadow-[0_25px_70px_#30221415] overflow-hidden">
              <div className="h-[43px] border-b border-[#eee] flex items-center gap-[9px] px-3.5 text-[10px]">
                <SolvexoIcon size={23} />
                <span>{t.myWorkspace}</span>
                <small className="ms-auto text-[8px] text-[#8c8d88]">{t.interactivePreview}</small>
                <ArrowUpRight size={10} className="rtl:-scale-x-100" />
              </div>
              <div className="flex">
                <div className="bg-[#f6f6f2] flex flex-col gap-[17px] items-center px-[13px] py-[18px] text-[#8a8b86]">
                  <b className="bg-[#e6dccd] text-[10px] px-2 py-1.5 rounded-[7px]">A</b>
                  <LayoutGrid size={15} className="text-brand-orange" />
                  <ListOrdered size={15} />
                  <Diamond size={15} />
                  <Home size={15} />
                  <Sparkles size={15} />
                </div>
                <div className="flex-1 p-4 sm:p-6 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <small className="block text-[7px] tracking-[0.17em] rtl:tracking-normal text-[#96978f]">{t.atAGlance}</small>
                      <h3 className="text-[17px] sm:text-[20px] font-semibold tracking-[-0.035em] rtl:tracking-normal mt-2 mb-[18px]">{t.goodDay}</h3>
                    </div>
                    <span className="text-[8px] px-2 py-1.5 bg-[#f7f6f2] border border-[#eee] rounded-[5px]">{t.demoStore}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {[[t.sales, money.sales], [t.orders, '24'], [t.customers, '18']].map(([label, value]) => (
                      <div key={label} className="border border-[#eee] rounded-md p-2.5 sm:p-3 min-w-0">
                        <small className="block text-[9px] text-[#888]">{label}</small>
                        <strong className="block text-[13px] sm:text-[17px] font-semibold my-[7px] truncate">{value}</strong>
                        <span className="text-[7px] text-[#94978c]">{t.sampleData}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border border-[#eee] rounded-[7px] p-3.5 mt-[15px]">
                    <div className="flex justify-between text-[10px]"><b>{t.salesOverview}</b><small className="text-[8px] text-[#8c8e85]">{t.thisWeek}</small></div>
                    <div className="h-[85px] flex items-end gap-3 mt-[15px] mb-2 bg-[repeating-linear-gradient(to_top,transparent_0,transparent_26px,#f4f4ef_27px)]">
                      {BARS.map((h, i) => (
                        <i key={i} style={{ height: `${h}%` }} className={i === BARS.length - 1 ? 'flex-1 rounded-t-[3px] bg-brand-orange' : i === BARS.length - 2 ? 'flex-1 rounded-t-[3px] bg-[#dda58b]' : 'flex-1 rounded-t-[3px] bg-[#ecd6c9]'} />
                      ))}
                    </div>
                    <div className="flex justify-around text-[7px] text-[#96978f]">{t.weekdays.map((d, i) => <span key={i}>{d}</span>)}</div>
                  </div>
                  <div className="text-[9px] mt-4">
                    <b className="block mb-[11px]">{t.recentOrders}</b>
                    {[['#1042', t.onlineStore, money.order1, 'bg-[#7d9982]'], ['#1041', t.inPersonSale, money.order2, 'bg-[#e5b49a]']].map(([id, channel, amount, dot]) => (
                      <span key={id} className="flex items-center gap-[7px] my-2.5">
                        <i className={`w-1.5 h-1.5 rounded-full ${dot}`} /> {id}
                        <small className="ms-auto text-[#92968d]">{channel}</small>
                        <strong className="ms-2.5 text-[8px]">{amount}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Storefront card */}
            <div className="absolute w-[180px] sm:w-[210px] end-0 sm:-end-1 top-[265px] sm:top-[260px] rotate-[5deg] bg-white border border-[#e5ded3] rounded-lg shadow-[0_14px_50px_#34201225] overflow-hidden">
              <div className="p-[13px] text-[7px] font-bold tracking-[0.14em] flex justify-between">{t.storeName} <Menu size={9} /></div>
              <div className="h-[145px] bg-[#f1e6da] relative px-3 py-[21px] overflow-hidden">
                <small className="relative z-[1] block text-[5px]">{t.thoughtfullyChosen}</small>
                <b className="relative z-[1] block mt-2 font-serif text-[21px] leading-[1.1]">{t.storeHeadline1}<br />{t.storeHeadline2}</b>
                <span className="relative z-[1] block mt-2 text-[5px]">{t.discover}</span>
                <img src={PHOTOS.hero} alt="" className="absolute -end-[7px] top-0 h-full w-[55%] object-cover mix-blend-multiply" />
              </div>
              <div className="flex gap-[7px] p-2.5">
                {PHOTOS.thumbs.map(src => <img key={src} src={src} alt="" className="w-[calc(33.33%-5px)] h-[55px] object-cover rounded-[3px]" />)}
              </div>
              <div className="px-[11px] pt-[5px] pb-3 text-[7px] flex justify-between">{t.yourStoreYourBrand} <ArrowUpRight size={8} className="rtl:-scale-x-100" /></div>
            </div>

            {/* Sync tag */}
            <div className="absolute bottom-1 start-1 sm:start-[43px] -rotate-2 bg-[#1c1d1b] text-white rounded-lg shadow-[0_10px_25px_#0002] px-5 py-3.5 flex gap-[13px] items-center">
              <span className="text-[#a5baa3] border border-[#49624d] rounded-full p-1"><Check size={12} /></span>
              <div>
                <b className="block text-[11px]">{t.sharedInventory}</b>
                <small className="block text-[9px] text-[#bbb] mt-1">{t.sharedInventorySub}</small>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
