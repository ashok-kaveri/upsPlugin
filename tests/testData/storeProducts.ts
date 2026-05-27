import path from 'path';
import { readFileSync } from 'fs';
import { StoreData } from '../../src/api/types/product.types';

const PRODUCTS_FILE = path.join(__dirname, '../../playwright/products.json');

export function loadStoreProducts(): StoreData {
  const raw = readFileSync(PRODUCTS_FILE, 'utf-8');
  return JSON.parse(raw) as StoreData;
}
