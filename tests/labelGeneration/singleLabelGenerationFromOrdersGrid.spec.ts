import { test, expect } from '../fixtures/fixtures';
import { createWooOrder } from '../../src/api';
import { loadStoreProducts } from '../testData/storeProducts';

test.describe.serial('Single Label Generation from Orders Grid', () => {
  let orderId: string;

  test('Create order from api', async ({ page, pages }) => {
    const { simple } = loadStoreProducts();
    const apiOrder = await createWooOrder(simple[1].id, 1, 1);
    expect(apiOrder.id).toBeTruthy();
    orderId = apiOrder.id.toString();
  });

  test('Go To WooCommerce > Orders Page > Generate and Print Label', async ({ page, pages }) => {
    test.setTimeout(120000);
    await pages.ordersPage.goto();
    await pages.ordersPage.selectOrdersInWSSOrdersPage([orderId]);
    await pages.ordersPage.selectBulkAction('ups_generate_label');
    await pages.ordersPage.clickApplyBulkAction();
    await pages.ordersPage.verifyBulkShipmentSuccess([orderId]);
    await pages.ordersPage.selectOrdersInWSSOrdersPage([orderId]);
    await pages.ordersPage.selectBulkAction('xa_ups_print_label_pdf');
    await pages.ordersPage.verifyBulkPdfDownload();
  });
});
