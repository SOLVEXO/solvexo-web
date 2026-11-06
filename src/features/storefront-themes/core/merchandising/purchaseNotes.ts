import { preorderLabel, variantPreorderText } from '../../sellingRules';

type PreorderProduct = Parameters<typeof preorderLabel>[0];
type VariantPreorder = NonNullable<Parameters<typeof variantPreorderText>[0]>['preorder'];

interface NoteLine { preorder?: VariantPreorder; isBundle?: boolean }

/** Pre-order text for the product page buy box: the product-level label wins, else the variant's own. Null = not a pre-order. */
export function productPreorderNote(product: PreorderProduct, variant: { preorder?: VariantPreorder } | null | undefined): string | null {
  return preorderLabel(product) ?? variantPreorderText(variant);
}

/** Notices for ONE cart line (cart page, mini cart). Both are empty when nothing applies. */
export function cartLineNotes(line: NoteLine): { preorder: string | null; bundle: boolean } {
  return { preorder: line.preorder ? variantPreorderText({ preorder: line.preorder }) : null, bundle: !!line.isBundle };
}

/** variantId -> pre-order note for the checkout summary (checkout lines carry no pre-order data; the cart lines do). */
export function checkoutPreorderNotes(items: Array<NoteLine & { productVariantId: string }>): Map<string, string | null> {
  return new Map(items.map(i => [i.productVariantId, cartLineNotes(i).preorder]));
}
