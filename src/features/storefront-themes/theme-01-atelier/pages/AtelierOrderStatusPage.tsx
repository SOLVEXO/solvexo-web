import { useStorefrontSeo } from '../hooks/useStorefrontSeo';
import { useTranslation } from 'react-i18next';
import { OrderStatusView, type OrderStatusLook } from '../../OrderStatusView';
import { atelierTheme as t } from '../theme.config';

const look: OrderStatusLook = {
  colors: t.colors,
  fonts: t.fonts,
  borderWidth: '1px',
  radius: '0',
  headingWeight: 600,
  h1Size: '24px',
  containerPadX: t.layout.containerPadX,
};

/** Theme 01's public Order status page (`/order-status/:token`, no login). */
export function AtelierOrderStatusPage() {
  const { t: tr } = useTranslation('storefront');
  useStorefrontSeo({ title: tr('orders.statusAria', "Order status"), noindex: true });
  return <OrderStatusView look={look} />;
}
