import { buildSimpleProductPayload, buildVariableProductPayload, buildVariantPayload } from '../builders/productPayloadBuilder';
import { productService } from '../services/productService';
import { ProductInputs, WooProduct } from '../types/product.types';

export async function createSimpleProduct(inputs: ProductInputs, numOfProducts = 1): Promise<WooProduct[]> {
  const results: WooProduct[] = [];

  for (let i = 0; i < numOfProducts; i++) {
    const payload = buildSimpleProductPayload(inputs);
    const product = await productService.create(payload);
    console.log(`✅ [${i + 1}/${numOfProducts}] Simple product created — ID: ${product.id}, Name: ${product.name}`);
    results.push(product);
  }

  return results;
}

export async function createVariableProduct(inputs: ProductInputs, numOfProducts = 1): Promise<WooProduct[]> {
  const results: WooProduct[] = [];

  for (let i = 0; i < numOfProducts; i++) {
    const productPayload = buildVariableProductPayload(inputs);
    const variantPayload = buildVariantPayload(inputs);

    const product = await productService.createVariable(productPayload);
    console.log(`✅ [${i + 1}/${numOfProducts}] Variable product created — ID: ${product.id}, Name: ${product.name}`);

    const variant = await productService.createVariant(product.id, variantPayload);
    console.log(`   Variant created — ID: ${variant.id}`);

    results.push(product);
  }

  return results;
}

export async function retrieveProduct(productId: number): Promise<WooProduct> {
  const product = await productService.retrieve(productId);
  console.log(`✅ Product fetched — ID: ${product.id}, Name: ${product.name}`);
  return product;
}

export async function duplicateProduct(productId: number, numOfProducts = 1): Promise<WooProduct[]> {
  const results: WooProduct[] = [];

  for (let i = 0; i < numOfProducts; i++) {
    const product = await productService.duplicate(productId);
    await productService.publish(productId);
    console.log(`✅ [${i + 1}/${numOfProducts}] Product duplicated — ID: ${product.id}, Name: ${product.name}`);
    results.push(product);
  }

  return results;
}

export async function fetchAllProducts(): Promise<WooProduct[]> {
  let page = 1;
  let totalPages = 1;
  let allProducts: WooProduct[] = [];

  while (page <= totalPages) {
    const { data, totalPages: tp } = await productService.fetchPage(page);
    console.log(`Page ${page}/${tp} — fetched ${data.length} products`);
    totalPages = tp;
    allProducts = [...allProducts, ...data];
    page++;
  }

  console.log(`✅ Total products fetched: ${allProducts.length}`);
  return allProducts;
}
