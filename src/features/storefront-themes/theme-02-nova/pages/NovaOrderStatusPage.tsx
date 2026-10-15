import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useTranslation } from 'react-i18next';
import { OrderStatusView, type OrderStatusLook } from '../../OrderStatusView';
import { novaTheme as t } from '../theme.config';

const look: OrderStatusLook = {
  colors: t.colors,
  fonts: t.fonts,
  borderWidth: '1.5px',
  radius: t.radius.md,
  pillRadius: '9999px',
  headingWeight: 700,
  h1Size: '26px',
  containerPadX: t.layout.containerPadX,
};

/** Theme 02's public Order status page (`/order-status/:token`, no login). */
export function NovaOrderStatusPage() {
  const { t: tr } = useTranslation('storefront');
  useStorefrontSeo({ title: tr('orders.statusAria', "Order status"), noindex: true });
  return <OrderStatusView look={look} />;
}
