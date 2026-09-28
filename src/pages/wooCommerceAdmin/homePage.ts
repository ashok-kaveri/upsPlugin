import { type Page, expect, Locator } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  //Locators
  readonly allOrders: Locator;
  readonly orderNumber: Locator;
  readonly mainAdminMenu: Locator;
  readonly generatePackagesBtn: Locator;
  readonly calculateRatesBtn: Locator;
  readonly selectServiceeInWSSOrdersPage: Locator;
  readonly editOrderHeading: Locator;
  readonly verifyPackages: Locator;
  readonly confirmShipmentBtn: Locator;
  readonly printLabelInWSSOrdersPage: Locator;

  constructor(page: Page) {
    this.page = page;

    //Locators
    this.allOrders = this.page.locator('#the-list');
    this.orderNumber = this.page.locator('a.order-view');
    this.mainAdminMenu = this.page.locator('#adminmenu').locator('li');
    this.generatePackagesBtn = this.page.locator('.button.ups_generate_packages');
    this.calculateRatesBtn = this.page.locator('.button.wf_ups_generate_packages_rates');
    this.selectServiceeInWSSOrdersPage = this.page.locator('#wf_ups_service_select');
    this.editOrderHeading = this.page.getByText('Edit order');
    this.verifyPackages = this.page.locator('#wf_ups_service_select');
    this.confirmShipmentBtn = this.page.locator('.button.ups_create_shipment');
    this.printLabelInWSSOrdersPage = this.page.getByRole('link', { name: 'Print Label' });
  }

  async clickAndCheckVerifyPrintLabel() {
    const [download] = await Promise.all([this.page.waitForEvent('download'), this.printLabelInWSSOrdersPage.click()]);
    const fileName = download.suggestedFilename();
    console.log('Label Downloaded: ', fileName);
    expect(fileName).toMatch(/^UPS-ShippingLabel-Label.*\.gif$/);
  }

  async chooseServiceInWssOrdersPage(serviceName: string) {
    const serviceRow = this.page.locator('#wf_ups_service_select tr').filter({ hasText: serviceName });
    await serviceRow.locator('input[type="radio"]').first().check();
  }

  async selectOrderInWSSOrdersPage(orderId: string) {
    await this.page.waitForLoadState();
    await expect(this.allOrders).toBeVisible();
    const orderRow = this.page.locator(`tr#order-${orderId}`);
    await expect(orderRow).toBeVisible({ timeout: 15000 });
    const orderLink = orderRow.locator('a.order-view');
    await orderLink.click();
    await expect(this.page.getByRole('heading', { name: 'Edit order' })).toBeVisible();
  }

  async selectAdminMenu(mainMenu: string, subMenu?: string) {
    const mainMenuItem = this.mainAdminMenu.filter({ has: this.page.getByRole('link', { name: mainMenu, exact: true }) });
    const mainLink = mainMenuItem.getByRole('link', { name: mainMenu, exact: true });
    await mainLink.click();
    if (subMenu) {
      const subLink = mainMenuItem.getByRole('link', { name: new RegExp(`^${subMenu}`) });
      await subLink.click();
    }
  }

  async goto() {
    await this.page.goto(`/wp-admin/`);
    await this.page.waitForLoadState('load');
  }
}
