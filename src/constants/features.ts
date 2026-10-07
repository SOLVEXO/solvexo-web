/** Non-Shopify features hidden from the UI (owner decision 2026-10-05): to be rebuilt as installable Apps.
 *  Flip a flag to true to re-enable its nav entries/routes/widgets. Backend routes and data are untouched. */
export const FEATURES = {
  loyalty: false,
  affiliates: false,
  bookings: false,
} as const;
