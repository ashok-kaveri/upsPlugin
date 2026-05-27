export interface Address {
  first_name: string;
  last_name: string;
  company: string;
  address_1: string;
  address_2: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
}

export interface BillingAddress extends Address {
  email: string;
}

export interface LineItem {
  product_id: number;
  quantity: number;
}

export interface ShippingLineMeta {
  key: string;
  value: {
    id: string;
    method_title: string;
    items: Record<string, string>;
  };
}

export interface ShippingLine {
  method_id: string;
  method_title: string;
  total: string;
  meta_data: ShippingLineMeta[];
}

export interface OrderPayload {
  status: string;
  payment_method: string;
  payment_method_title: string;
  set_paid: boolean;
  billing: BillingAddress;
  shipping: Address;
  line_items: LineItem[];
  shipping_lines: ShippingLine[];
}

export interface WooOrder {
  id: number;
  shipping: Address;
  [key: string]: unknown;
}
