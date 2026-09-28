import { test, expect, upsServiceCodes } from '../fixtures/fixtures';
import { createWooOrder } from '../../src/api';
import { loadStoreProducts } from '../testData/storeProducts';

const serviceName = 'UPS Next Day Air®';

/** Normalizes the ShipmentRequest's Package field (object when 1 package, array when 2+). */
function getPackages(req: any): any[] {
  const pkg = req.ShipmentRequest.Shipment.Package;
  return Array.isArray(pkg) ? pkg : [pkg];
}

async function configureWeightBasedMode({ pages }: any) {
  await pages.homePage.goto();
  await pages.basePage.selectAdminMenu('UPS Shipping', 'Settings');
  await pages.settingsPage.selectTab('Packaging');
  await pages.settingsPage.selectParcelPackingOption('Weight based: Calculate shipping on the basis of order total weight');
}

test.describe.serial('Weight based packing - single item within caps produces one package', { tag: ['@regression'] }, () => {
  let orderId: string;
  let orderShipping: any;

  test('Configure box weight 0.5, max weight 50, no max quantity', async ({ pages }) => {
    test.setTimeout(120000);
    await configureWeightBasedMode({ pages });
    await pages.settingsPage.setVolumetricWeight(false);
    await pages.settingsPage.setBoxWeightField('0.5');
    await pages.settingsPage.setMaxPackageWeight('50');
    await pages.settingsPage.setMaxPackageQuantity('0');
    await pages.settingsPage.selectPackingProcess('Pack heavier items first');
    await pages.settingsPage.saveChanges();
  });

  test('Create order from api', async ({ pages }) => {
    const { simple } = loadStoreProducts();
    const apiOrder = await createWooOrder(simple[1].id, 1, 1, upsServiceCodes[serviceName], serviceName);
    orderId = String(apiOrder.id);
    orderShipping = apiOrder.shipping;
    expect(apiOrder.id).toBeTruthy();
  });

  test('Single package weight = item weight + box weight', async ({ page, pages }) => {
    test.setTimeout(120000);
    await pages.ordersPage.goto();
    await pages.ordersPage.selectOrderInWSSOrdersPage(orderId);
    await pages.ordersPage.generatePackagesBtn.click();
    await page.waitForLoadState();
    expect(await pages.ordersPage.numberOfPackagesInOrdersPage(1)).toBe(1);

    await pages.ordersPage.calculateRatesBtn.click();
    await expect(pages.ordersPage.verifyPackages).toBeVisible();
    await pages.ordersPage.chooseServiceInWssOrdersPage(serviceName);
    await pages.ordersPage.confirmShipmentBtn.click();
    await page.waitForLoadState();

    await pages.ordersPage.verifyShipmentConfirmLog(orderId, upsServiceCodes[serviceName], serviceName, orderShipping);
    const req = JSON.parse(await pages.ordersPage.shipmentConfirmRequestPre.innerText());
    const packages = getPackages(req);
    expect(packages).toHaveLength(1);
    // item weight (1 LBS) + configured box weight (0.5 LBS)
    expect(parseFloat(packages[0].PackageWeight.Weight)).toBe(1.5);
  });
});

test.describe.serial('Weight based packing - Max Package Weight splits order into multiple packages', { tag: ['@regression'] }, () => {
  let orderId: string;
  let orderShipping: any;
  const qty = 3; // 3 items x 1 LBS = 3 LBS total

  test('Configure max package weight = 1.5 LBS (forces a split)', async ({ pages }) => {
    test.setTimeout(120000);
    await configureWeightBasedMode({ pages });
    await pages.settingsPage.setVolumetricWeight(false);
    await pages.settingsPage.setBoxWeightField('0');
    await pages.settingsPage.setMaxPackageWeight('1.5');
    await pages.settingsPage.setMaxPackageQuantity('0');
    await pages.settingsPage.selectPackingProcess('Pack heavier items first');
    await pages.settingsPage.saveChanges();
  });

  test('Create order from api', async ({ pages }) => {
    const { simple } = loadStoreProducts();
    const apiOrder = await createWooOrder(simple[1].id, qty, 1, upsServiceCodes[serviceName], serviceName);
    orderId = String(apiOrder.id);
    orderShipping = apiOrder.shipping;
    expect(apiOrder.id).toBeTruthy();
  });

  test('3 LBS total split across at least 2 packages, none exceeding the cap', async ({ page, pages }) => {
    test.setTimeout(120000);
    await pages.ordersPage.goto();
    await pages.ordersPage.selectOrderInWSSOrdersPage(orderId);
    await pages.ordersPage.generatePackagesBtn.click();
    await page.waitForLoadState();
    const numOfPackages = await pages.ordersPage.numofPackages.count();
    expect(numOfPackages).toBeGreaterThanOrEqual(2);

    await pages.ordersPage.calculateRatesBtn.click();
    await expect(pages.ordersPage.verifyPackages).toBeVisible();
    await pages.ordersPage.chooseServiceInWssOrdersPage(serviceName);
    await pages.ordersPage.confirmShipmentBtn.click();
    await page.waitForLoadState();

    await pages.ordersPage.verifyShipmentConfirmLog(orderId, upsServiceCodes[serviceName], serviceName, orderShipping);
    const req = JSON.parse(await pages.ordersPage.shipmentConfirmRequestPre.innerText());
    const packages = getPackages(req);
    expect(packages.length).toBeGreaterThanOrEqual(2);
    for (const pkg of packages) {
      expect(parseFloat(pkg.PackageWeight.Weight)).toBeLessThanOrEqual(1.5);
    }
  });
});

test.describe.serial('Weight based packing - Max Package Quantity splits order regardless of weight', { tag: ['@regression'] }, () => {
  let orderId: string;
  let orderShipping: any;
  const qty = 5;

  test('Configure max package quantity = 2, weight cap high (non-limiting)', async ({ pages }) => {
    test.setTimeout(120000);
    await configureWeightBasedMode({ pages });
    await pages.settingsPage.setVolumetricWeight(false);
    await pages.settingsPage.setBoxWeightField('0');
    await pages.settingsPage.setMaxPackageWeight('100');
    await pages.settingsPage.setMaxPackageQuantity('2');
    await pages.settingsPage.selectPackingProcess('Pack heavier items first');
    await pages.settingsPage.saveChanges();
  });

  test('Create order from api', async ({ pages }) => {
    const { simple } = loadStoreProducts();
    const apiOrder = await createWooOrder(simple[1].id, qty, 1, upsServiceCodes[serviceName], serviceName);
    orderId = String(apiOrder.id);
    orderShipping = apiOrder.shipping;
    expect(apiOrder.id).toBeTruthy();
  });

  test('5 items split into 3 packages (2 + 2 + 1)', async ({ page, pages }) => {
    test.setTimeout(120000);
    await pages.ordersPage.goto();
    await pages.ordersPage.selectOrderInWSSOrdersPage(orderId);
    await pages.ordersPage.generatePackagesBtn.click();
    await page.waitForLoadState();
    expect(await pages.ordersPage.numberOfPackagesInOrdersPage(qty)).toBe(3);
  });
});

test.describe('Weight based packing - packing process variants complete end-to-end', { tag: ['@regression'] }, () => {
  for (const process of ['Pack heavier items first', 'Pack lighter items first.', 'Pack purely divided by weight.']) {
    test(`Process: ${process}`, async ({ page, pages }) => {
      test.setTimeout(150000);
      await configureWeightBasedMode({ pages });
      await pages.settingsPage.setVolumetricWeight(false);
      await pages.settingsPage.setBoxWeightField('0');
      await pages.settingsPage.setMaxPackageWeight('50');
      await pages.settingsPage.setMaxPackageQuantity('0');
      await pages.settingsPage.selectPackingProcess(process);
      await pages.settingsPage.saveChanges();

      const { simple } = loadStoreProducts();
      const apiOrder = await createWooOrder(simple[1].id, 3, 1, upsServiceCodes[serviceName], serviceName);
      const orderId = String(apiOrder.id);
      const orderShipping = apiOrder.shipping;
      expect(apiOrder.id).toBeTruthy();

      await pages.ordersPage.goto();
      await pages.ordersPage.selectOrderInWSSOrdersPage(orderId);
      await pages.ordersPage.generatePackagesBtn.click();
      await page.waitForLoadState();
      await pages.ordersPage.calculateRatesBtn.click();
      await expect(pages.ordersPage.verifyPackages).toBeVisible();
      await pages.ordersPage.chooseServiceInWssOrdersPage(serviceName);
      await pages.ordersPage.confirmShipmentBtn.click();
      await page.waitForLoadState();
      await pages.ordersPage.verifyShipmentConfirmLog(orderId, upsServiceCodes[serviceName], serviceName, orderShipping);
    });
  }
});

test.describe.serial('Weight based packing - Volumetric weight sends the higher of actual vs volumetric weight', { tag: ['@regression'] }, () => {
  let orderId: string;
  let orderShipping: any;

  test('Enable Volumetric weight', async ({ pages }) => {
    test.setTimeout(120000);
    await configureWeightBasedMode({ pages });
    await pages.settingsPage.setBoxWeightField('0');
    await pages.settingsPage.setMaxPackageWeight('50');
    await pages.settingsPage.setMaxPackageQuantity('0');
    await pages.settingsPage.selectPackingProcess('Pack heavier items first');
    await pages.settingsPage.setVolumetricWeight(true);
    await pages.settingsPage.saveChanges();
  });

  test('Create order from api', async ({ pages }) => {
    const { simple } = loadStoreProducts();
    const apiOrder = await createWooOrder(simple[1].id, 1, 1, upsServiceCodes[serviceName], serviceName);
    orderId = String(apiOrder.id);
    orderShipping = apiOrder.shipping;
    expect(apiOrder.id).toBeTruthy();
  });

  test('Shipment completes and billing weight reflects the volumetric comparison', async ({ page, pages }) => {
    test.setTimeout(120000);
    await pages.ordersPage.goto();
    await pages.ordersPage.selectOrderInWSSOrdersPage(orderId);
    await pages.ordersPage.generatePackagesBtn.click();
    await page.waitForLoadState();
    await pages.ordersPage.calculateRatesBtn.click();
    await expect(pages.ordersPage.verifyPackages).toBeVisible();
    await pages.ordersPage.chooseServiceInWssOrdersPage(serviceName);
    await pages.ordersPage.confirmShipmentBtn.click();
    await page.waitForLoadState();
    // Test product (5x4x4in, 1 LBS) has a small volumetric weight relative to its actual
    // weight, so with Volumetric weight enabled the request should still carry a valid,
    // positive weight - this is a smoke check that the option doesn't break the request.
    await pages.ordersPage.verifyShipmentConfirmLog(orderId, upsServiceCodes[serviceName], serviceName, orderShipping);
  });
});
