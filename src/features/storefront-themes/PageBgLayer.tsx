import { pageBgLayerStyle, type PageBg } from './pageBackground';

/** The blurred page picture, drawn behind the page content. Renders nothing unless the seller set a picture AND a blur;
 *  put it as the FIRST child of the theme's root element (which gets `position: relative; isolation: isolate` from `pageBackgroundCss`). */
export function PageBgLayer({ bg, p }: { bg: string; p: PageBg }) {
  if (!p.image || p.blur <= 0) return null;
  return <div aria-hidden style={pageBgLayerStyle(bg, p)} />;
}
