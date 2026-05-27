import { OrderPayload } from '../types/order.types';

const { faker } = require('@faker-js/faker');

const FIXED_ADDRESS = {
  address: '43 River Ave',
  city: 'Island Heights',
  state: 'NJ',
  postcode: '08732',
  country: 'US',
};

export function buildOrderPayload(
  productId: number,
  quantity: number,
  serviceCode: string,
  serviceName: string,
  shippingTotal: string,
): OrderPayload {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const email = faker.internet.email();
  const { address, city, state, postcode, country } = FIXED_ADDRESS;

  return {
    status: 'processing',
    payment_method: 'woocommerce_payments',
    payment_method_title: 'Credit Card',
    set_paid: true,

    billing: {
      first_name: firstName,
      last_name: lastName,
      company: '',
      address_1: address,
      address_2: '',
      city,
      state,
      postcode,
      country,
      email,
      phone: '1234567890',
    },

    shipping: {
      first_name: firstName,
      last_name: lastName,
      company: '',
      address_1: address,
      address_2: '',
      city,
      state,
      postcode,
      country,
      phone: '1234567890',
    },

    line_items: [{ product_id: productId, quantity }],

    shipping_lines: [
      {
        method_id: 'wf_shipping_ups',
        method_title: serviceName,
        total: shippingTotal,
        meta_data: [
          {
            key: '_xa_ups_method',
            value: {
              id: `wf_shipping_ups:${serviceCode}`,
              method_title: serviceName,
              items: { [productId]: String(quantity) },
            },
          },
        ],
      },
    ],
  };
}
