import { test, expect } from "../fixtures/fixtures";
import { createWooOrder } from "../../src/api";
import { loadStoreProducts } from "../testData/storeProducts";

test.describe.serial("Bulk Label Generation", () => {
  let orderIds: string[];

  test("Create order from api", async ({ page, pages }) => {
    const { simple } = loadStoreProducts();
    const apiOrders = await createWooOrder(simple[1].id, 1, 10);
    for (const order of apiOrders) {
      expect(order.id).toBeTruthy();
    }
    orderIds = apiOrders.map((order: any) => order.id.toString());
  });

  test("Go To WooCommerce > Orders Page > Bulk Label Generation", async ({
    page,
    pages,
  }) => {
    test.setTimeout(120000);
    await pages.ordersPage.goto();
    await pages.ordersPage.selectOrdersInWSSOrdersPage(orderIds);
    await pages.ordersPage.selectBulkAction("ups_generate_label");
    await pages.ordersPage.clickApplyBulkAction();
    await pages.ordersPage.verifyBulkShipmentSuccess(orderIds);
    await pages.ordersPage.selectOrdersInWSSOrdersPage(orderIds);
    await pages.ordersPage.selectBulkAction("xa_ups_print_label_pdf");
    await pages.ordersPage.verifyBulkPdfDownload();
  });
});
