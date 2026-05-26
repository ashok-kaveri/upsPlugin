import { test, expect, upsServiceCodes } from '../fixtures/fixtures';
import { createWooOrder } from '../../src/api/wooOrderApi';
import { SettingsPage } from '../../src/pages/UPSplugin/settings';
import { HomePage } from '../../src/pages/wooCommerceAdmin/homePage';
import { BasePage } from '../../src/pages/basePage';

const labelTypes = ['GIF', 'PNG', 'ZPL', 'EPL'];

for (const labelType of labelTypes) {
  test.describe.serial(`Label Type - ${labelType}`, () => {
    let orderId: string;
    let orderShipping: any;
    const serviceName = 'UPS Next Day Air®';

    test(`Set label type to ${labelType}`, async ({ page, pages }) => {
      test.setTimeout(120000);
      await pages.homePage.goto();
      await pages.basePage.selectAdminMenu('UPS Shipping', 'Settings');
      await pages.settingsPage.selectTab('Shipping Labels');
      await pages.settingsPage.selectLabelTypeOption(labelType);
    });

    test('Create order from api', async ({ page, pages }) => {
      const apiOrder = await createWooOrder(80, 1, 1, upsServiceCodes[serviceName], serviceName);
      orderId = apiOrder.id;
      orderShipping = apiOrder.shipping;
      expect(apiOrder.id).toBeTruthy();
    });

    test(`Generate label and verify ${labelType} format`, async ({ page, pages }) => {
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
      const labelBuffers = await pages.ordersPage.verifyShipmentConfirmLog(orderId, upsServiceCodes[serviceName], serviceName, orderShipping, labelType);
      await page.goBack();
      await page.waitForLoadState('load');
      await expect(pages.ordersPage.printLabelInWSSOrdersPage).toBeVisible();
      await pages.ordersPage.clickAndCheckVerifyPrintLabel(labelBuffers, labelType);
    });
  });
}

test.afterAll(async ({ browser }) => {
  test.setTimeout(120000);
  const context = await browser.newContext({ storageState: 'playwright/.auth/user.json' });
  const page = await context.newPage();
  const homePage = new HomePage(page);
  const basePage = new BasePage(page);
  const settingsPage = new SettingsPage(page);
  await homePage.goto();
  await basePage.selectAdminMenu('UPS Shipping', 'Settings');
  await settingsPage.selectTab('Shipping Labels');
  await settingsPage.selectLabelTypeOption('GIF');
  await context.close();
});
