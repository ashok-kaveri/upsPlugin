import path from 'path';
import { writeFileSync } from 'fs';
import { productService } from '../services/productService';
import { SimpleProductPayload, VariableProductPayload, VariantPayload, WooProduct, StoreData } from '../types/product.types';

const PRODUCTS_FILE = path.join(__dirname, '../../../playwright/products.json');

const DEFAULT_SPECS = {
  price: '10.00',
  weight: '1',
  length: '5',
  width: '5',
  height: '5',
};

const STANDARD_PRODUCTS = {
  simple: ['1. Simple Product', '2. Simple Product'],
  variable: ['1. Variable Product', '2. Variable Product'],
  digital: ['1. Digital Product', '2. Digital Product'],
};

function simplePayload(name: string): SimpleProductPayload {
  return {
    name,
    type: 'simple',
    status: 'publish',
    regular_price: DEFAULT_SPECS.price,
    description: `Standard test product: ${name}`,
    sku: `${name.replace(/\W+/g, '-').toLowerCase()}-${Date.now()}`,
    weight: DEFAULT_SPECS.weight,
    dimensions: { length: DEFAULT_SPECS.length, width: DEFAULT_SPECS.width, height: DEFAULT_SPECS.height },
    manage_stock: true,
    stock_quantity: 99999,
  };
}

function digitalPayload(name: string): SimpleProductPayload {
  return { ...simplePayload(name), virtual: true, downloadable: true };
}

// No weight/dimensions on purpose: products that already carry their own weight/dimensions
// are shipped "as-is" by the plugin (Box / Container = "Unpacked Product"), bypassing the
// "Pack into boxes" algorithm entirely. A dimensionless product is what actually exercises
// box-fitting.
const BOX_PACKING_TEST_PRODUCT_NAME = 'Box Packing Test Product (No Dimensions)';

function dimensionlessPayload(name: string): SimpleProductPayload {
  return {
    name,
    type: 'simple',
    status: 'publish',
    regular_price: DEFAULT_SPECS.price,
    description: `Standard test product: ${name}`,
    sku: `${name.replace(/\W+/g, '-').toLowerCase()}-${Date.now()}`,
    weight: '',
    dimensions: { length: '', width: '', height: '' },
    manage_stock: true,
    stock_quantity: 99999,
  };
}

function variablePayload(name: string): VariableProductPayload {
  return {
    name,
    type: 'variable',
    status: 'publish',
    description: `Standard test product: ${name}`,
    sku: `${name.replace(/\W+/g, '-').toLowerCase()}-${Date.now()}`,
    attributes: [
      { position: 0, name: 'Colour', options: ['Black', 'Green'], variation: true, visible: true },
      { position: 1, name: 'Size', options: ['S', 'M'], variation: true, visible: true },
    ],
  };
}

function variantPayload(): VariantPayload {
  return {
    status: 'publish',
    regular_price: DEFAULT_SPECS.price,
    description: 'Default variant',
    sku: `variant-${Date.now()}`,
    weight: DEFAULT_SPECS.weight,
    dimensions: { length: DEFAULT_SPECS.length, width: DEFAULT_SPECS.width, height: DEFAULT_SPECS.height },
    manage_stock: true,
    stock_quantity: 99999,
  };
}

async function findOrCreate(name: string, create: () => Promise<WooProduct>): Promise<WooProduct> {
  const results = await productService.searchByName(name);
  const existing = results.find((p) => p.name === name);
  if (existing) {
    console.log(`✔ Found: "${name}" (ID: ${existing.id})`);
    return existing;
  }
  console.log(`➕ Creating: "${name}"`);
  return create();
}

export async function ensureBoxPackingTestProduct(): Promise<WooProduct> {
  return findOrCreate(BOX_PACKING_TEST_PRODUCT_NAME, () => productService.create(dimensionlessPayload(BOX_PACKING_TEST_PRODUCT_NAME)));
}

export async function ensureStoreProducts(): Promise<StoreData> {
  console.log('\n🔍 Checking standard products...');

  const [s1, s2] = await Promise.all([
    findOrCreate(STANDARD_PRODUCTS.simple[0], () => productService.create(simplePayload(STANDARD_PRODUCTS.simple[0]))),
    findOrCreate(STANDARD_PRODUCTS.simple[1], () => productService.create(simplePayload(STANDARD_PRODUCTS.simple[1]))),
  ]);

  const [d1, d2] = await Promise.all([
    findOrCreate(STANDARD_PRODUCTS.digital[0], () => productService.create(digitalPayload(STANDARD_PRODUCTS.digital[0]))),
    findOrCreate(STANDARD_PRODUCTS.digital[1], () => productService.create(digitalPayload(STANDARD_PRODUCTS.digital[1]))),
  ]);

  // Variable products must be sequential — variant creation depends on the parent id
  const v1 = await findOrCreate(STANDARD_PRODUCTS.variable[0], async () => {
    const product = await productService.createVariable(variablePayload(STANDARD_PRODUCTS.variable[0]));
    await productService.createVariant(product.id, variantPayload());
    return product;
  });

  const v2 = await findOrCreate(STANDARD_PRODUCTS.variable[1], async () => {
    const product = await productService.createVariable(variablePayload(STANDARD_PRODUCTS.variable[1]));
    await productService.createVariant(product.id, variantPayload());
    return product;
  });

  const storeData: StoreData = {
    siteUrl: process.env.site_url!,
    simple: { 1: s1, 2: s2 },
    variable: { 1: v1, 2: v2 },
    digital: { 1: d1, 2: d2 },
  };

  writeFileSync(PRODUCTS_FILE, JSON.stringify(storeData, null, 2));
  console.log(`✅ products.json saved — simple[${s1.id}, ${s2.id}], variable[${v1.id}, ${v2.id}], digital[${d1.id}, ${d2.id}]\n`);

  return storeData;
}
