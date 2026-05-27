export interface ProductInputs {
  price: string;
  weight: string;
  length: string;
  width: string;
  height: string;
}

export interface ProductDimensions {
  length: string;
  width: string;
  height: string;
}

export interface ProductAttribute {
  position: number;
  name: string;
  options: string[];
  variation: boolean;
  visible: boolean;
}

export interface SimpleProductPayload {
  name: string;
  type: 'simple';
  status: 'publish';
  regular_price: string;
  description: string;
  sku: string;
  weight: string;
  dimensions: ProductDimensions;
  manage_stock: boolean;
  stock_quantity: number;
  virtual?: boolean;
  downloadable?: boolean;
}

export type ProductPair = Record<1 | 2, WooProduct>;

export interface StoreData {
  siteUrl: string;
  simple: ProductPair;
  variable: ProductPair;
  digital: ProductPair;
}

export interface VariableProductPayload {
  name: string;
  type: 'variable';
  status: 'publish';
  description: string;
  sku: string;
  attributes: ProductAttribute[];
}

export interface VariantPayload {
  status: 'publish';
  regular_price: string;
  description: string;
  sku: string;
  weight: string;
  dimensions: ProductDimensions;
  manage_stock: boolean;
  stock_quantity: number;
}

export interface WooProduct {
  id: number;
  name: string;
  status: string;
  type: string;
  [key: string]: unknown;
}
