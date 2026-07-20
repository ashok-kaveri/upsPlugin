import { test, expect, upsServiceCodes } from "../fixtures/fixtures";
import { createWooOrder } from "../../src/api";
import { loadStoreProducts } from "../testData/storeProducts";

test.describe.serial("Pack Items Individually", { tag: ["@regression"] }, () => {
  let orderId: string;
  let orderShipping: any;
  let serviceName = "UPS Next Day Air®";
  let quantityOfProduct = 2;

  test('Change Packaging type to "Default: Pack items individually"', async ({
    page,
    pages,
  }) => {
    test.setTimeout(120000);
    await pages.homePage.goto();
    await pages.basePage.selectAdminMenu("UPS Shipping", "Settings");
    await pages.settingsPage.selectTab("Packaging");
    await pages.settingsPage.selectParcelPackingOption(
      "Default: Pack items individually",
    );
    await expect(pages.settingsPage.parcelPackingDropdown).toContainText(
      "Default: Pack items individually",
    );
  });

  test("Create order from api", async ({ page, pages }) => {
    const { simple } = loadStoreProducts();
    const apiOrder = await createWooOrder(
      simple[1].id,
      quantityOfProduct,
      1,
      upsServiceCodes[serviceName],
      serviceName,
    );
    orderId = String(apiOrder.id);
    orderShipping = apiOrder.shipping;
    expect(apiOrder.id).toBeTruthy();
  });

  test("Go To WooCommerce > Orders > Label Generation", async ({
    page,
    pages,
  }) => {
    test.setTimeout(120000);
    await pages.ordersPage.goto();
    await pages.ordersPage.selectOrderInWSSOrdersPage(orderId);
    await expect(pages.ordersPage.generatePackagesBtn).toBeVisible();
    await pages.ordersPage.generatePackagesBtn.click();
    await page.waitForLoadState();
    const numOfPackages =
      await pages.ordersPage.numberOfPackagesInOrdersPage(quantityOfProduct);
    expect(numOfPackages).toBe(quantityOfProduct);
    await expect(pages.ordersPage.calculateRatesBtn).toBeVisible();
    await pages.ordersPage.calculateRatesBtn.click();
    await expect(pages.ordersPage.verifyPackages).toBeVisible();
    await pages.ordersPage.chooseServiceInWssOrdersPage(serviceName);
    await expect(pages.ordersPage.confirmShipmentBtn).toBeVisible();
    await pages.ordersPage.confirmShipmentBtn.click();
    await page.waitForLoadState();
    const labelBuffers = await pages.ordersPage.verifyShipmentConfirmLog(
      orderId,
      upsServiceCodes[serviceName],
      serviceName,
      orderShipping,
    );
    await page.goBack();
    await page.waitForLoadState("load");
    await expect(pages.ordersPage.printLabelInWSSOrdersPage).toHaveCount(
      quantityOfProduct,
    );
    await pages.ordersPage.clickAndCheckVerifyPrintLabel(labelBuffers);
  });
});
