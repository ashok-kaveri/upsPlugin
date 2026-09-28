import { type Page, expect, Locator } from '@playwright/test';
import { readFileSync } from 'fs';
import pdfParse = require('pdf-parse');
import { verifyShipmentRequest, verifyShipmentResponse } from '../../../tests/testData/shipmentLogs/shipmentVerifier';

export class OrdersPage {
  readonly page: Page;

  //Locators
  readonly allOrders: Locator;
  readonly orderNumber: Locator;
  readonly generatePackagesBtn: Locator;
  readonly calculateRatesBtn: Locator;
  readonly selectServiceeInWSSOrdersPage: Locator;
  readonly editOrderHeading: Locator;
  readonly verifyPackages: Locator;
  readonly confirmShipmentBtn: Locator;
  readonly printLabelInWSSOrdersPage: Locator;
  readonly printReturnLabelInWSSOrdersPage: Locator;
  readonly numofPackages: Locator;
  readonly warningTextVoidShipment: Locator;
  readonly voidShipmentInWSSOrdersPage: Locator;
  readonly returnServiceSelect: Locator;
  readonly generateReturnLabel: Locator;
  readonly clientSideResetBtn: Locator;
  readonly voidShipmentSuccessMessage: Locator;
  readonly bulkActionDropdown: Locator;
  readonly applyBulkActionBtn: Locator;
  readonly bulkActionSuccessMessage: Locator;
  readonly shipmentConfirmRequestPre: Locator;
  readonly shipmentConfirmResponsePre: Locator;

  constructor(page: Page) {
    this.page = page;

    this.allOrders = this.page.locator('#the-list');
    this.orderNumber = this.page.locator('a.order-view');
    this.generatePackagesBtn = this.page.locator('.button.ups_generate_packages');
    this.calculateRatesBtn = this.page.locator('.button.wf_ups_generate_packages_rates');
    this.selectServiceeInWSSOrdersPage = this.page.locator('#wf_ups_service_select');
    this.editOrderHeading = this.page.getByText('Edit order');
    this.verifyPackages = this.page.locator('#wf_ups_service_select');
    this.numofPackages = this.page.locator('#wf_ups_package_list .ph-ups-pkg-card');
    this.confirmShipmentBtn = this.page.locator('.button.ups_create_shipment');
    this.printLabelInWSSOrdersPage = this.page.getByRole('link', { name: 'Print Label' });
    this.printReturnLabelInWSSOrdersPage = this.page.getByRole('link', { name: 'Print Return Label' });
    this.voidShipmentInWSSOrdersPage = this.page.getByRole('link', { name: 'Void Shipment' });
    this.clientSideResetBtn = this.page.getByRole('link', { name: 'Client Side Reset' });
    this.warningTextVoidShipment = this.page.getByText(`Please note that void is not possible in 'Test' mode, as there is no real shipment is created with UPS.`);
    this.returnServiceSelect = this.page.locator('#return_label_service');
    this.generateReturnLabel = this.page.getByRole('link', { name: 'Generate Return Label' });
    this.voidShipmentSuccessMessage = this.page.getByText('UPS: Client side reset of labels and shipment completed. You can re-initiate shipment now.');
    this.bulkActionDropdown = this.page.locator('#bulk-action-selector-top');
    this.applyBulkActionBtn = this.page.locator('#doaction');
    this.bulkActionSuccessMessage = this.page.locator('.notice.notice-success');
    this.shipmentConfirmRequestPre = this.page.locator('pre').nth(0);
    this.shipmentConfirmResponsePre = this.page.locator('pre').nth(1);
  }

  async selectReturnService(serviceName: string) {
    await this.returnServiceSelect.selectOption({ label: serviceName });
  }

  async numberOfPackagesInOrdersPage(quantityOfProduct: number) {
    const numOfPackages = await this.numofPackages.count();
    if (quantityOfProduct === numOfPackages) {
      console.log(`Number of packages ${numOfPackages} and is matching to the quantity of product.`);
    } else {
      console.log(`Number of packages is ${numOfPackages} ❌`);
    }
    return numOfPackages;
  }

  async verifyBulkShipmentSuccess(orderIds: string[]) {
    await expect(this.bulkActionSuccessMessage).toBeVisible();
    for (const orderId of orderIds) {
      await expect(this.bulkActionSuccessMessage).toContainText(`Order #${orderId}: Shipment accepted successfully. Labels are ready for printing.`);
    }
  }

  async verifyBulkPdfDownload() {
    const [download] = await Promise.all([this.page.waitForEvent('download'), this.clickApplyBulkAction()]);
    const fileName = download.suggestedFilename();
    console.log(`Downloaded File: ${fileName}`);
    expect(fileName).toMatch(/^UPS-Shipping-Labels-\d{4}-\d{2}-\d{2}\.pdf$/);

    const filePath = await download.path();
    expect(filePath).toBeTruthy();
    const fileBuffer = readFileSync(filePath!);
    expect(fileBuffer.subarray(0, 4).toString('ascii')).toBe('%PDF');
    expect(fileBuffer.length).toBeGreaterThan(1000);
    console.log(`PDF verified: valid PDF, ${fileBuffer.length} bytes`);

    const pdfData = await pdfParse(fileBuffer);
    console.log(`PDF pages: ${pdfData.numpages}`);
    if (pdfData.info) {
      console.log(`PDF info: ${JSON.stringify(pdfData.info)}`);
    }
    const text = pdfData.text.trim();
    if (text) {
      console.log(`PDF text:\n${text}`);
      const trackingNumbers = [...text.matchAll(/1Z[A-Z0-9]{16}/gi)].map((m) => m[0]);
      if (trackingNumbers.length > 0) {
        console.log(`Tracking numbers found in PDF: ${trackingNumbers.join(', ')}`);
      }
    } else {
      console.log('PDF is image-based — labels are embedded as raster images, no extractable text');
    }
  }

  async clickAndCheckVerifyPrintLabel(expectedLabelBuffers: Buffer[] = [], labelFormat: string = 'GIF') {
    const labels = this.printLabelInWSSOrdersPage;
    const count = await labels.count();
    for (let i = 0; i < count; i++) {
      const [download] = await Promise.all([this.page.waitForEvent('download'), labels.nth(i).click()]);
      const fileName = download.suggestedFilename();
      console.log(`Label ${i + 1} Downloaded: ${fileName}`);
      expect(fileName).toMatch(new RegExp(`^UPS-ShippingLabel-Label.*\\.${labelFormat.toLowerCase()}$`, 'i'));

      const filePath = await download.path();
      expect(filePath).toBeTruthy();
      const fileBuffer = readFileSync(filePath!);
      expect(fileBuffer.length).toBeGreaterThan(100);

      if (labelFormat === 'GIF') {
        expect(fileBuffer.subarray(0, 3).toString('ascii')).toBe('GIF');
        if (expectedLabelBuffers[i]) {
          expect(fileBuffer.equals(expectedLabelBuffers[i])).toBeTruthy();
          console.log(`Label ${i + 1} cross-verified: downloaded file matches UPS response GraphicImage ✅`);
        }
      } else if (labelFormat === 'PNG') {
        expect(fileBuffer[0]).toBe(0x89);
        expect(fileBuffer.subarray(1, 4).toString('ascii')).toBe('PNG');
      } else if (labelFormat === 'ZPL' || labelFormat === 'EPL') {
        if (labelFormat === 'ZPL') {
          expect(fileBuffer.toString('utf-8').trimStart()).toMatch(/^\^XA/);
        }
        const fileText = fileBuffer.toString('utf-8');
        console.log(`Label ${i + 1} ${labelFormat} content:\n${fileText}`);
        const trackingInFile = /1Z[A-Z0-9]{16}/i.exec(fileText)?.[0];
        if (trackingInFile) {
          console.log(`Label ${i + 1} tracking number: ${trackingInFile}`);
        }
        if (expectedLabelBuffers[i]) {
          const trackingInExpected = /1Z[A-Z0-9]{16}/i.exec(expectedLabelBuffers[i].toString('utf-8'))?.[0];
          if (trackingInFile && trackingInExpected) {
            expect(trackingInFile).toBe(trackingInExpected);
            console.log(`Label ${i + 1} tracking number matches UPS response ✅`);
          }
        }
      }

      console.log(`Label ${i + 1} file verified: valid ${labelFormat}, ${fileBuffer.length} bytes`);
    }
  }

  async clickAndCheckVerifyPrintReturnLabel(expectedLabelBuffers: Buffer[] = [], labelFormat: string = 'GIF') {
    const labels = this.printReturnLabelInWSSOrdersPage;
    const count = await labels.count();
    for (let i = 0; i < count; i++) {
      const [download] = await Promise.all([this.page.waitForEvent('download'), labels.nth(i).click()]);
      const fileName = download.suggestedFilename();
      console.log(`Return Label ${i + 1} Downloaded: ${fileName}`);
      expect(fileName).toMatch(new RegExp(`^UPS-ShippingLabel-Label.*\\.${labelFormat.toLowerCase()}$`, 'i'));

      const filePath = await download.path();
      expect(filePath).toBeTruthy();
      const fileBuffer = readFileSync(filePath!);
      expect(fileBuffer.length).toBeGreaterThan(100);

      if (labelFormat === 'GIF') {
        expect(fileBuffer.subarray(0, 3).toString('ascii')).toBe('GIF');
        if (expectedLabelBuffers[i]) {
          expect(fileBuffer.equals(expectedLabelBuffers[i])).toBeTruthy();
          console.log(`Return Label ${i + 1} cross-verified: downloaded file matches UPS response GraphicImage ✅`);
        }
      } else if (labelFormat === 'PNG') {
        expect(fileBuffer[0]).toBe(0x89);
        expect(fileBuffer.subarray(1, 4).toString('ascii')).toBe('PNG');
      } else if (labelFormat === 'ZPL' || labelFormat === 'EPL') {
        if (labelFormat === 'ZPL') {
          expect(fileBuffer.toString('utf-8').trimStart()).toMatch(/^\^XA/);
        }
        const fileText = fileBuffer.toString('utf-8');
        console.log(`Return Label ${i + 1} ${labelFormat} content:\n${fileText}`);
        const trackingInFile = /1Z[A-Z0-9]{16}/i.exec(fileText)?.[0];
        if (trackingInFile) {
          console.log(`Return Label ${i + 1} tracking number: ${trackingInFile}`);
        }
        if (expectedLabelBuffers[i]) {
          const trackingInExpected = /1Z[A-Z0-9]{16}/i.exec(expectedLabelBuffers[i].toString('utf-8'))?.[0];
          if (trackingInFile && trackingInExpected) {
            expect(trackingInFile).toBe(trackingInExpected);
            console.log(`Return Label ${i + 1} tracking number matches UPS response ✅`);
          }
        }
      }

      console.log(`Return Label ${i + 1} file verified: valid ${labelFormat}, ${fileBuffer.length} bytes`);
    }
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
    await expect(this.page.getByRole('heading', { name: 'Edit order' })).toBeVisible({ timeout: 15000 });
  }

  async selectOrdersInWSSOrdersPage(orderIds: string[]) {
    await this.page.waitForLoadState();
    await expect(this.allOrders).toBeVisible();
    for (const orderId of orderIds) {
      const checkbox = this.page.locator(`#cb-select-${orderId}`);
      await expect(checkbox).toBeVisible({ timeout: 15000 });
      await checkbox.check();
    }
  }

  async selectBulkAction(action: string) {
    await expect(this.bulkActionDropdown).toBeVisible();
    await this.bulkActionDropdown.selectOption(action);
    console.log(`Bulk action selected: ${action}`);
  }

  async clickApplyBulkAction() {
    await expect(this.applyBulkActionBtn).toBeVisible();
    await this.applyBulkActionBtn.click();
    console.log('Bulk action applied ✅');
  }

  async verifyShipmentConfirmLog(
    orderId: string,
    expectedServiceCode: string,
    serviceName: string,
    orderShipping: { first_name: string; last_name: string; address_1: string; city: string; state: string; postcode: string; country: string; phone: string },
    labelFormat: string = 'GIF',
  ): Promise<Buffer[]> {
    await expect(this.shipmentConfirmRequestPre).toBeVisible();
    await expect(this.shipmentConfirmResponsePre).toBeVisible();

    const req = JSON.parse(await this.shipmentConfirmRequestPre.innerText());
    const res = JSON.parse(await this.shipmentConfirmResponsePre.innerText());

    verifyShipmentRequest(req, orderId, expectedServiceCode, serviceName, orderShipping, false, labelFormat);
    return verifyShipmentResponse(res, orderId, req, labelFormat);
  }

  async verifyReturnShipmentConfirmLog(
    orderId: string,
    orderShipping: { first_name: string; last_name: string; address_1: string; city: string; state: string; postcode: string; country: string; phone: string },
  ): Promise<Buffer[]> {
    await expect(this.shipmentConfirmRequestPre).toBeVisible();
    await expect(this.shipmentConfirmResponsePre).toBeVisible();

    const req = JSON.parse(await this.shipmentConfirmRequestPre.innerText());
    const res = JSON.parse(await this.shipmentConfirmResponsePre.innerText());

    verifyShipmentRequest(req, orderId, '', '', orderShipping, true);
    return verifyShipmentResponse(res, orderId, req);
  }

  async goto() {
    await this.page.goto(`/wp-admin/admin.php?page=wc-orders`);
    await this.page.waitForLoadState('load');
  }
}
