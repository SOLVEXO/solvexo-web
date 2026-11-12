/** ISO-3166 country -> its official currency (ISO-4217). Same reference data as the API (common/country-currency.const.ts). */
export const COUNTRY_TO_CURRENCY: Record<string, string> = {
  PK: 'PKR', US: 'USD', GB: 'GBP', AE: 'AED', IN: 'INR', CA: 'CAD', AU: 'AUD',
  DE: 'EUR', FR: 'EUR', IT: 'EUR', ES: 'EUR', NL: 'EUR', BE: 'EUR', AT: 'EUR',
  IE: 'EUR', PT: 'EUR', FI: 'EUR', GR: 'EUR', LU: 'EUR', SI: 'EUR', SK: 'EUR',
  EE: 'EUR', LV: 'EUR', LT: 'EUR', CY: 'EUR', MT: 'EUR', HR: 'EUR',
  SA: 'SAR', QA: 'QAR', KW: 'KWD', BH: 'BHD', OM: 'OMR', JO: 'JOD',
  EG: 'EGP', BD: 'BDT', LK: 'LKR', NP: 'NPR', BT: 'BTN', MV: 'MVR',
  CN: 'CNY', JP: 'JPY', KR: 'KRW', HK: 'HKD', TW: 'TWD', SG: 'SGD',
  MY: 'MYR', ID: 'IDR', TH: 'THB', VN: 'VND', PH: 'PHP', KH: 'KHR', LA: 'LAK',
  MM: 'MMK', BN: 'BND', NZ: 'NZD', ZA: 'ZAR', NG: 'NGN', KE: 'KES', GH: 'GHS',
  TZ: 'TZS', UG: 'UGX', ET: 'ETB', MA: 'MAD', DZ: 'DZD', TN: 'TND', LY: 'LYD',
  CH: 'CHF', NO: 'NOK', SE: 'SEK', DK: 'DKK', IS: 'ISK', PL: 'PLN', CZ: 'CZK',
  HU: 'HUF', RO: 'RON', BG: 'BGN', RS: 'RSD', UA: 'UAH', TR: 'TRY', RU: 'RUB',
  IL: 'ILS', LB: 'LBP', IQ: 'IQD', IR: 'IRR', AF: 'AFN', KZ: 'KZT', UZ: 'UZS',
  MX: 'MXN', BR: 'BRL', AR: 'ARS', CL: 'CLP', CO: 'COP', PE: 'PEN', VE: 'VES',
  EC: 'USD', PA: 'PAB', UY: 'UYU', PY: 'PYG', BO: 'BOB', CR: 'CRC',
  JM: 'JMD', TT: 'TTD', BB: 'BBD', BS: 'BSD',
};

export function currencyForCountry(countryCode: string): string | null {
  return COUNTRY_TO_CURRENCY[countryCode.toUpperCase()] ?? null;
}
