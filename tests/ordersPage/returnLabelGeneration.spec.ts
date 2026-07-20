import { test, expect, upsServiceCodes } from "../fixtures/fixtures";
import { createWooOrder } from "../../src/api";
import { loadStoreProducts } from "../testData/storeProducts";

test.describe.serial("Return Label Generation", { tag: ["@regression"] }, () => {
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

  test("Go To WooCommerce > Orders > Label Generation > Return Label Generation", async ({
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
    const labelBuffers = await pages.ordersPage.verifyShipmentConfirmLog(
      orderId,
      upsServiceCodes[serviceName],
      serviceName,
      orderShipping,
    );
    await page.goBack();
    await page.waitForLoadState("load");
    await expect(pages.ordersPage.returnServiceSelect).toBeVisible();
    await pages.ordersPage.selectReturnService("UPS Next Day Air®");
    await pages.ordersPage.generateReturnLabel.click();
    await page.waitForLoadState();
    const returnLabelBuffers =
      await pages.ordersPage.verifyReturnShipmentConfirmLog(
        orderId,
        orderShipping,
      );
    await page.goBack();
    await page.waitForLoadState("load");
    await expect(
      pages.ordersPage.printReturnLabelInWSSOrdersPage,
    ).toBeVisible();
    await pages.ordersPage.clickAndCheckVerifyPrintReturnLabel(
      returnLabelBuffers,
    );
  });
});
