import { test, expect } from '../fixtures/fixtures';

test.describe.serial('Label Flow with order from checkout', { tag: ['@sanity'] }, () => {
  let orderId: string;
  let serviceName = 'UPS Next Day Air®';

  test.skip('Change Packaging type to "Default: Pack items individually"', async ({ page, pages }) => {
    await pages.homePage.goto();
    await pages.basePage.selectAdminMenu('UPS Shipping', 'Settings');
    await pages.settingsPage.selectTab('Packaging');
    await pages.settingsPage.selectParcelPackingOption('Default: Pack items individually');
    await expect(pages.settingsPage.parcelPackingDropdown).toContainText('Default: Pack items individually');
  });

  test.skip('Order Product from Checkout', async ({ page, pages }) => {
    await page.goto(`/cart`);
    await pages.shopPage.clearCartIfNotEmpty();
    await pages.shopPage.goto();
    await page.waitForLoadState('domcontentloaded');
    await pages.shopPage.search.fill('Awesome Aluminum Pants');
    await page.keyboard.press('Enter');
    await pages.shopPage.addToCart.click();
    await page.goto(`/checkout`);
    await pages.shopPage.fillCheckoutDetails('United States (US)', '1100 Wyoming', 'St. Louis', 'Missouri', '63119');
    await pages.shopPage.selectShippingMethod(serviceName);
    orderId = await pages.shopPage.cickOnPlaceOrder();
  });

  test.skip('Verify Rates Log', async ({ page, pages }) => {
    await pages.statusPage.goto();
    await pages.statusPage.logs.click();
    await page.waitForLoadState();
    await pages.statusPage.expectTableHeadersToBePresent();
    await pages.statusPage.clickCell(1, 2);
    await page.waitForTimeout(10000);
  });

  test.skip('Go To WooCommerce > Orders > Label Generation', async ({ page, pages }) => {
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
    await page.goBack();
    await page.waitForLoadState('load');
    await expect(pages.ordersPage.printLabelInWSSOrdersPage).toBeVisible();
    await pages.ordersPage.clickAndCheckVerifyPrintLabel();
  });
});
