import { wooApiClient } from '../client/wooApiClient';
import { SimpleProductPayload, VariableProductPayload, VariantPayload, WooProduct } from '../types/product.types';

export class ProductService {
  async create(payload: SimpleProductPayload): Promise<WooProduct> {
    return wooApiClient.post<WooProduct>('/wp-json/wc/v3/products', payload);
  }

  async createVariable(payload: VariableProductPayload): Promise<WooProduct> {
    return wooApiClient.post<WooProduct>('/wp-json/wc/v3/products', payload);
  }

  async createVariant(productId: number, payload: VariantPayload): Promise<WooProduct> {
    return wooApiClient.post<WooProduct>(`/wp-json/wc/v3/products/${productId}/variations`, payload);
  }

  async retrieve(productId: number): Promise<WooProduct> {
    return wooApiClient.get<WooProduct>(`/wp-json/wc/v3/products/${productId}`);
  }

  async duplicate(productId: number): Promise<WooProduct> {
    return wooApiClient.post<WooProduct>(`/wp-json/wc/v3/products/${productId}/duplicate`, {});
  }

  async publish(productId: number): Promise<WooProduct> {
    return wooApiClient.put<WooProduct>(`/wp-json/wc/v3/products/${productId}`, { status: 'publish' });
  }

  async fetchPage(page: number, perPage = 100): Promise<{ data: WooProduct[]; totalPages: number }> {
    return wooApiClient.getPage<WooProduct>('/wp-json/wc/v3/products', { per_page: perPage, page });
  }

  async searchByName(name: string): Promise<WooProduct[]> {
    return wooApiClient.get<WooProduct[]>('/wp-json/wc/v3/products', { search: name });
  }
}

export const productService = new ProductService();
