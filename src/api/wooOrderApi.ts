import { request } from '@playwright/test';
const { faker } = require('@faker-js/faker');

export async function createWooOrder(
  productId: number = 80,
  quantity: number = 1,
  numOfOrders: number = 1,
  serviceCode: string = '12',
  serviceName: string = 'UPS 3 Day Select®',
  shippingTotal: string = '94.48',
) {
  const apiContext = await request.newContext({
    baseURL: process.env.site_url,
  });

  const createdOrders = [];

  for (let i = 0; i < numOfOrders; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const email = faker.internet.email();

    const address = '43 River Ave';
    const city = 'Island Heights';
    const state = 'NJ';
    const postCode = '08732';
    const country = 'US';

    const payload = {
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
        city: city,
        state: state,
        postcode: postCode,
        country: country,
        email: email,
        phone: '1234567890',
      },

      shipping: {
        first_name: firstName,
        last_name: lastName,
        company: '',
        address_1: address,
        address_2: '',
        city: city,
        state: state,
        postcode: postCode,
        country: country,
        phone: '1234567890',
      },

      line_items: [
        {
          product_id: productId,
          quantity: quantity,
        },
      ],

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

                items: {
                  [productId]: String(quantity),
                },
              },
            },
          ],
        },
      ],
    };

    const response = await apiContext.post(`/wp-json/wc/v3/orders?consumer_key=${process.env.CONSUMER_KEY}&consumer_secret=${process.env.CONSUMER_SECRET}`, {
      data: payload,
    });

    const body = await response.json();

    if (!response.ok()) {
      console.log(JSON.stringify(body, null, 2));
      throw new Error(`Order creation failed`);
    }

    console.log(`✅ [${i + 1}/${numOfOrders}] Order ${body.id} created with ${serviceName}`);

    createdOrders.push(body);
  }

  if (numOfOrders === 1) {
    return createdOrders[0];
  }

  return createdOrders;
}
