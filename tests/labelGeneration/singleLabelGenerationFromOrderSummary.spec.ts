import { test, expect, upsServiceCodes } from '../fixtures/fixtures';
import { createWooOrder } from '../../src/api/wooOrderApi';

test.describe.serial('Label Flow with Api Order', () => {
  let orderId: string;
  let orderShipping: any;
  let serviceName = 'UPS Next Day Air®';

  test('Create order from api', async ({ page, pages }) => {
    const apiOrder = await createWooOrder(80, 1, 1, upsServiceCodes[serviceName], serviceName);
    orderId = apiOrder.id;
    orderShipping = apiOrder.shipping;
    expect(apiOrder.id).toBeTruthy();
  });

  test('Go To WooCommerce > Orders > Label Generation', async ({ page, pages }) => {
    test.setTimeout(120000);
    await pages.ordersPage.goto();
    await pages.ordersPage.selectOrderInWSSOrdersPage(orderId);
    await expect(pages.ordersPage.generatePackagesBtn).toBeVisible();
    await pages.ordersPage.generatePackagesBtn.click();
    await expect(pages.ordersPage.calculateRatesBtn).toBeVisible();
    await pages.ordersPage.calculateRatesBtn.click();
    await expect(pages.ordersPage.verifyPackages).toBeVisible();
    await pages.ordersPage.chooseServiceInWssOrdersPage(serviceName);
    await expect(pages.ordersPage.confirmShipmentBtn).toBeVisible();
    await pages.ordersPage.confirmShipmentBtn.click();
    await page.waitForLoadState();
    const labelBuffers = await pages.ordersPage.verifyShipmentConfirmLog(orderId, upsServiceCodes[serviceName], serviceName, orderShipping);
    await page.goBack();
    await page.waitForLoadState('load');
    await expect(pages.ordersPage.printLabelInWSSOrdersPage).toBeVisible();
    await pages.ordersPage.clickAndCheckVerifyPrintLabel(labelBuffers);
  });
});
