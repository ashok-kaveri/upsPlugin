import { wooApiClient } from '../client/wooApiClient';
import { OrderPayload, WooOrder } from '../types/order.types';

export class OrderService {
  async create(payload: OrderPayload): Promise<WooOrder> {
    return wooApiClient.post<WooOrder>('/wp-json/wc/v3/orders', payload);
  }
}

export const orderService = new OrderService();
