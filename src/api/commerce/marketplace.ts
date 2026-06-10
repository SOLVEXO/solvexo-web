import client from '../client';
import { ENDPOINTS } from '../endpoints';

export interface ProductVariant {
  _id:            string;
  productId:      string;
  sku:            string;
  price:          number;
  compareAtPrice: number | null;
  size:           string | null;
  color:          string | null;
  stock:          number;
  shippingWeight: string | null;
  images:         string[];
  isDefault?:     boolean;
  status:         string;
  isDelete:       boolean;
  createdAt:      string;
  updatedAt:      string;
}

export interface DigitalProduct {
  files:                 { url: string; name: string; size: number; mimeType: string }[];
  downloadLimit:         string;
  linkExpiryDays:        number;
  pdfStampingEnabled:    boolean;
  licenseType:           string;
  buyerDeliveryMessage:  string;
}

export interface MarketplaceProduct {
  _id:               string;
  name:              string;
  sellerId:          string;
  storeId?:          string;
  slug:              string;
  description:       string;
  productType?:      'physical' | 'digital';
  type?:             'physical' | 'digital';
  categoryId:        string;
  subCategoryId?:    string | null;
  images:            string[];
  tags?:             string[];
  digital?:          DigitalProduct | null;
  viewCount:         number;
  wishlistCount:     number;
  purchaseCount:     number;
  averageRating:     number;
  ratingSum?:        number;
  totalRatings?:     number;
  lastWishlistedAt:  string | null;
  status:            string;
  isListedOnSolvexo?: boolean;
  isDelete:          boolean;
  createdAt:         string;
  updatedAt:         string;
  variants:          ProductVariant[];
  sellerName?:       string;
}

interface ProductsByCategoryResponse {
  message: string;
  success: boolean;
  data: {
    total:    number;
    page:     number | string;
    limit:    number | string;
    products: MarketplaceProduct[];
  };
}

interface ProductByIdResponse {
  message: string;
  success: boolean;
  data: {
    product:        MarketplaceProduct & { sellerName: string };
    variants:       ProductVariant[];
    defaultVariant: ProductVariant;
  };
}

export function apiGetAllProducts(page = 1, limit = 10) {
  return client.get<never, ProductsByCategoryResponse>(
    `${ENDPOINTS.MARKETPLACE.PRODUCTS_BY_CATEGORY}?page=${page}&limit=${limit}`,
  );
}

export function apiGetProductById(id: string) {
  return client.get<never, ProductByIdResponse>(
    ENDPOINTS.MARKETPLACE.PRODUCT_BY_ID(id),
  );
}
