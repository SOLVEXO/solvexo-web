import type { SupplierReturnReason } from '@/api/services/inventoryOps';

export const SUPPLIER_RETURN_REASONS: { value: SupplierReturnReason; label: string }[] = [
  { value: 'damaged', label: 'Damaged' }, { value: 'defective', label: 'Defective' }, { value: 'wrong_item', label: 'Wrong item sent' },
  { value: 'overstock', label: 'Overstock' }, { value: 'expired', label: 'Expired' }, { value: 'other', label: 'Other' },
];
