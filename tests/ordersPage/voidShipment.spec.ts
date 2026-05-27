import { test, expect, upsServiceCodes } from "../fixtures/fixtures";
import { createWooOrder } from "../../src/api";
import { loadStoreProducts } from "../testData/storeProducts";

test.describe.serial("Void Shipment", () => {
  let orderId: string;
  let orderShipping: any;
  let serviceName = "UPS Next Day Air®";

  test("Create order from api", async ({ page, pages }) => {
    const { simple } = loadStoreProducts();
    const apiOrder = await createWooOrder(
      simple[1].id,
      1,
      1,
      upsServiceCodes[serviceName],
      serviceName,
    );
    orderId = String(apiOrder.id);
    orderShipping = apiOrder.shipping;
    expect(apiOrder.id).toBeTruthy();
  });

  test("Go To WooCommerce > Orders > Label Generation > Void Shipment", async ({
    page,
    pages,
  }) => {
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
    await pages.ordersPage.verifyShipmentConfirmLog(
      orderId,
      upsServiceCodes[serviceName],
      serviceName,
      orderShipping,
    );
    await page.goBack();
    await page.waitForLoadState("load");
    await expect(pages.ordersPage.voidShipmentInWSSOrdersPage).toBeVisible();
    await pages.ordersPage.voidShipmentInWSSOrdersPage.click();
    await page.waitForLoadState();
    await expect(pages.ordersPage.warningTextVoidShipment).toBeVisible();
    await expect(pages.ordersPage.clientSideResetBtn).toBeVisible();
    await pages.ordersPage.clientSideResetBtn.click();
    await expect(pages.ordersPage.voidShipmentSuccessMessage).toBeVisible();
  });
});
