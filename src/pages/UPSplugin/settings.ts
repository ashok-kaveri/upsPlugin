import { type Page, expect, Locator } from '@playwright/test';

export type BoxDimensions = {
  outerLength: string;
  outerWidth: string;
  outerHeight: string;
  innerLength?: string;
  innerWidth?: string;
  innerHeight?: string;
  boxWeight?: string;
  maxWeight?: string;
  maxQuantity?: string;
};

export class SettingsPage {
  readonly page: Page;

  //Locators
  readonly parcelPackingDropdown: Locator;
  readonly dropdownOptions: Locator;
  readonly saveChangesBtn: Locator;
  readonly printTypeLabelDropdown: Locator;
  readonly packingAlgorithmDropdown: Locator;
  readonly excludeBoxWeightCheckbox: Locator;
  readonly volumetricWeightCheckbox: Locator;
  readonly boxWeightInput: Locator;
  readonly maxPackageWeightInput: Locator;
  readonly maxPackageQuantityInput: Locator;
  readonly packingProcessDropdown: Locator;
  readonly resetBoxesLink: Locator;
  readonly addBoxLink: Locator;
  readonly removeSelectedBoxesLink: Locator;

  constructor(page: Page) {
    this.page = page;

    //Locators
    this.parcelPackingDropdown = this.page.locator('#select2-woocommerce_wf_shipping_ups_packing_method-container').first();
    this.dropdownOptions = this.page.locator('.select2-container--open .select2-results__option');
    this.saveChangesBtn = this.page.getByRole('button', { name: 'save' });
    this.printTypeLabelDropdown = this.page.locator('#select2-woocommerce_wf_shipping_ups_print_label_type-container').first();
    this.packingAlgorithmDropdown = this.page.locator('#select2-woocommerce_wf_shipping_ups_packing_algorithm-container').first();
    this.excludeBoxWeightCheckbox = this.page.locator('#woocommerce_wf_shipping_ups_exclude_box_weight');
    this.volumetricWeightCheckbox = this.page.locator('#woocommerce_wf_shipping_ups_volumetric_weight');
    this.boxWeightInput = this.page.locator('#woocommerce_wf_shipping_ups_box_weight');
    this.maxPackageWeightInput = this.page.locator('#woocommerce_wf_shipping_ups_box_max_weight');
    this.maxPackageQuantityInput = this.page.locator('#woocommerce_wf_shipping_ups_box_max_quantity');
    this.packingProcessDropdown = this.page.locator('#select2-woocommerce_wf_shipping_ups_weight_packing_process-container').first();
    this.resetBoxesLink = this.page.locator('a.ph-ups-reset-boxes');
    this.addBoxLink = this.page.locator('a.button.plus.insert');
    this.removeSelectedBoxesLink = this.page.locator('a.button.minus.remove');
  }

  async selectTab(tabName: string) {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.getByText(tabName, { exact: true }).click();
  }

  private async selectSelect2Option(dropdown: Locator, optionName: string) {
    if ((await dropdown.textContent())?.trim() !== optionName) {
      await dropdown.click();
      const option = this.dropdownOptions.filter({ hasText: optionName });
      await option.first().click();
    }
  }

  async selectLabelTypeOption(optionName: string) {
    if ((await this.printTypeLabelDropdown.textContent()) !== optionName) {
      await this.selectSelect2Option(this.printTypeLabelDropdown, optionName);
      await this.saveChangesBtn.click();
    }
  }
  async selectParcelPackingOption(optionName: string) {
    if ((await this.parcelPackingDropdown.textContent()) !== optionName) {
      await this.selectSelect2Option(this.parcelPackingDropdown, optionName);
      await this.saveChangesBtn.click();
    }
  }

  async selectPackingAlgorithm(optionName: string) {
    await this.selectSelect2Option(this.packingAlgorithmDropdown, optionName);
  }

  async selectPackingProcess(optionName: string) {
    await this.selectSelect2Option(this.packingProcessDropdown, optionName);
  }

  // Several checkboxes on this tab are shown/hidden by JS depending on the selected packing
  // method/algorithm, and can be momentarily (or always, depending on timing) display:none.
  // Playwright's actionability checks refuse to act on them even with force:true, so we set
  // them directly via the DOM instead.
  private async setCheckbox(locator: Locator, checked: boolean) {
    await locator.evaluate((el: HTMLInputElement, value: boolean) => {
      el.checked = value;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }, checked);
  }

  async setExcludeBoxWeight(enabled: boolean) {
    await this.setCheckbox(this.excludeBoxWeightCheckbox, enabled);
  }

  async setVolumetricWeight(enabled: boolean) {
    await this.setCheckbox(this.volumetricWeightCheckbox, enabled);
  }

  async setBoxWeightField(value: string) {
    await this.boxWeightInput.fill(value);
  }

  async setMaxPackageWeight(value: string) {
    await this.maxPackageWeightInput.fill(value);
  }

  async setMaxPackageQuantity(value: string) {
    await this.maxPackageQuantityInput.fill(value);
  }

  async saveChanges() {
    await this.saveChangesBtn.click();
    await this.page.waitForLoadState();
  }

  // ---- Box Dimensions table (used by "Pack into boxes") ----

  // Box rows in the table can be display:none until "Add Box" reveals them, so we set
  // values via direct DOM manipulation (dispatching input/change so any listeners still fire)
  // instead of Playwright's action APIs, which refuse to act on hidden elements even with force.

  async setBoxDimensions(boxId: string, dims: BoxDimensions) {
    const fields: Record<string, string> = {
      outer_length: dims.outerLength,
      outer_width: dims.outerWidth,
      outer_height: dims.outerHeight,
      inner_length: dims.innerLength ?? dims.outerLength,
      inner_width: dims.innerWidth ?? dims.outerWidth,
      inner_height: dims.innerHeight ?? dims.outerHeight,
      box_weight: dims.boxWeight ?? '0',
      max_weight: dims.maxWeight ?? '100',
      max_quantity: dims.maxQuantity ?? '0',
    };
    for (const [field, value] of Object.entries(fields)) {
      await this.page.locator(`input[name="boxes_${field}[${boxId}]"]`).evaluate(
        (el: HTMLInputElement, v: string) => {
          el.value = v;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        },
        value,
      );
    }
  }

  async setBoxEnabled(boxId: string, enabled: boolean) {
    await this.page.locator(`input[name="boxes_enabled[${boxId}]"]`).evaluate(
      (el: HTMLInputElement, checked: boolean) => {
        el.checked = checked;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      },
      enabled,
    );
  }

  /** Disables every box row (standard + custom) so tests start from a deterministic, empty box set. */
  async disableAllBoxes() {
    await this.page.locator('input[name^="boxes_enabled"]').evaluateAll((checkboxes) => {
      for (const el of checkboxes as HTMLInputElement[]) {
        if (el.checked) {
          el.checked = false;
          el.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }
    });
  }

  async resetBoxes() {
    await this.resetBoxesLink.click();
    await this.page.waitForLoadState();
  }
}
