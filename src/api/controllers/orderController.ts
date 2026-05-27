import { buildOrderPayload } from '../builders/orderPayloadBuilder';
import { orderService } from '../services/orderService';
import { WooOrder } from '../types/order.types';

export async function createWooOrder(
  productId?: number,
  quantity?: number,
  numOfOrders?: 1,
  serviceCode?: string,
  serviceName?: string,
  shippingTotal?: string,
): Promise<WooOrder>;
export async function createWooOrder(
  productId: number,
  quantity: number,
  numOfOrders: number,
  serviceCode?: string,
  serviceName?: string,
  shippingTotal?: string,
): Promise<WooOrder[]>;
export async function createWooOrder(
  productId: number = 1946,
  quantity: number = 1,
  numOfOrders: number = 1,
  serviceCode: string = '12',
  serviceName: string = 'UPS 3 Day Select®',
  shippingTotal: string = '94.48',
): Promise<WooOrder | WooOrder[]> {
  const createdOrders: WooOrder[] = [];

  for (let i = 0; i < numOfOrders; i++) {
    const payload = buildOrderPayload(productId, quantity, serviceCode, serviceName, shippingTotal);
    const order = await orderService.create(payload);
    console.log(`✅ [${i + 1}/${numOfOrders}] Order ${order.id} created with ${serviceName}`);
    createdOrders.push(order);
  }

  return numOfOrders === 1 ? createdOrders[0] : createdOrders;
}
