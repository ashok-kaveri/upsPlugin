export { createWooOrder } from './controllers/orderController';
export type { WooOrder, OrderPayload, Address } from './types/order.types';

export { createSimpleProduct, createVariableProduct, retrieveProduct, duplicateProduct, fetchAllProducts } from './controllers/productController';
export { ensureStoreProducts, ensureBoxPackingTestProduct } from './controllers/productSetupController';
export type { WooProduct, ProductInputs, StoreData } from './types/product.types';
