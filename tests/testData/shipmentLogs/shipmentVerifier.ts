import { expect } from '@playwright/test';

type OrderShipping = {
  first_name: string;
  last_name: string;
  address_1: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  phone: string;
};

export function verifyShipmentRequest(
  req: any,
  orderId: string,
  expectedServiceCode: string,
  serviceName: string,
  orderShipping: OrderShipping,
  isReturn: boolean = false,
  labelFormat: string = 'GIF',
) {
  const shipment = req.ShipmentRequest;

  expect(shipment.Request.TransactionReference.CustomerContext).toBe(String(orderId));
  expect(shipment.LabelSpecification.LabelImageFormat.Code).toBe(labelFormat);

  if (isReturn) {
    expect(shipment.Shipment.ReturnService.Code).toBeTruthy();
    console.log(`Return Service Code: ${shipment.Shipment.ReturnService.Code}`);

    // For return: ShipTo = merchant (truthy checks), ShipFrom = customer (verified against orderShipping)
    const shipTo = shipment.Shipment.ShipTo;
    expect(shipTo.Name).toBeTruthy();
    expect(shipTo.Address.AddressLine[0]).toBeTruthy();
    expect(shipTo.Address.City).toBeTruthy();
    expect(shipTo.Address.StateProvinceCode).toBeTruthy();
    expect(shipTo.Address.PostalCode).toBeTruthy();
    expect(shipTo.Address.CountryCode).toBeTruthy();
    console.log(`Return To (merchant): ${shipTo.Name}, ${shipTo.Address.AddressLine[0]}, ${shipTo.Address.City} ${shipTo.Address.StateProvinceCode} ${shipTo.Address.PostalCode}`);

    const shipFrom = shipment.Shipment.ShipFrom;
    expect(shipFrom.AttentionName).toBe(`${orderShipping.first_name} ${orderShipping.last_name}`);
    expect(shipFrom.Address.AddressLine[0]).toBe(orderShipping.address_1);
    expect(shipFrom.Address.City).toBe(orderShipping.city);
    expect(shipFrom.Address.StateProvinceCode).toBe(orderShipping.state);
    expect(shipFrom.Address.PostalCode).toBe(orderShipping.postcode);
    expect(shipFrom.Address.CountryCode).toBe(orderShipping.country);
    console.log(`Return From (customer): ${shipFrom.AttentionName}, ${shipFrom.Address.AddressLine[0]}, ${shipFrom.Address.City} ${shipFrom.Address.StateProvinceCode} ${shipFrom.Address.PostalCode}`);
  } else {
    expect(shipment.Shipment.Service.Code).toBe(expectedServiceCode);
    expect(shipment.Shipment.PaymentInformation.ShipmentCharge[0].BillShipper.AccountNumber).toBe(shipment.Shipment.Shipper.ShipperNumber);
    console.log(`Service: ${serviceName} (${expectedServiceCode})`);

    // For outbound: Shipper = merchant (truthy checks), ShipTo = customer (verified against orderShipping)
    const shipper = shipment.Shipment.Shipper;
    expect(shipper.Name).toBeTruthy();
    expect(shipper.ShipperNumber).toBeTruthy();
    expect(shipper.Phone.Number).toBeTruthy();
    expect(shipper.Address.AddressLine[0]).toBeTruthy();
    expect(shipper.Address.City).toBeTruthy();
    expect(shipper.Address.StateProvinceCode).toBeTruthy();
    expect(shipper.Address.PostalCode).toBeTruthy();
    expect(shipper.Address.CountryCode).toBeTruthy();
    console.log(`Ship From: ${shipper.Name}, ${shipper.Address.AddressLine[0]}, ${shipper.Address.City} ${shipper.Address.StateProvinceCode} ${shipper.Address.PostalCode}`);

    const shipTo = shipment.Shipment.ShipTo;
    expect(shipTo.AttentionName).toBe(`${orderShipping.first_name} ${orderShipping.last_name}`);
    expect(shipTo.Phone.Number).toBe(orderShipping.phone);
    expect(shipTo.Address.AddressLine[0]).toBe(orderShipping.address_1);
    expect(shipTo.Address.City).toBe(orderShipping.city);
    expect(shipTo.Address.StateProvinceCode).toBe(orderShipping.state);
    expect(shipTo.Address.PostalCode).toBe(orderShipping.postcode);
    expect(shipTo.Address.CountryCode).toBe(orderShipping.country);
    console.log(`Ship To: ${shipTo.AttentionName}, ${shipTo.Address.AddressLine[0]}, ${shipTo.Address.City} ${shipTo.Address.StateProvinceCode} ${shipTo.Address.PostalCode}`);
  }

  const pkg = shipment.Shipment.Package[0];
  const packageWeight = parseFloat(pkg.PackageWeight.Weight);
  const packageWeightUnit = pkg.PackageWeight.UnitOfMeasurement.Code;
  expect(packageWeight).toBeGreaterThan(0);
  expect(packageWeightUnit).toBeTruthy();
  console.log(`Weight: ${pkg.PackageWeight.Weight} ${packageWeightUnit}`);

  // Weight based packing legitimately sends UPS a weight-only package with no Dimensions block,
  // so this check is skipped (not required) when dims are absent, rather than assumed present.
  const dims = pkg.Dimensions;
  if (dims) {
    expect(parseFloat(dims.Length)).toBeGreaterThan(0);
    expect(parseFloat(dims.Width)).toBeGreaterThan(0);
    expect(parseFloat(dims.Height)).toBeGreaterThan(0);
    expect(dims.UnitOfMeasurement.Code).toBeTruthy();
    console.log(`DWT: ${dims.Length} x ${dims.Width} x ${dims.Height} ${dims.UnitOfMeasurement.Code}`);
  } else {
    console.log('DWT: (no Dimensions sent - weight-only package)');
  }
}

export function verifyShipmentResponse(res: any, orderId: string, req: any, labelFormat: string = 'GIF'): Buffer[] {
  const shipment = req.ShipmentRequest;
  const results = res.ShipmentResponse;

  expect(results.Response.ResponseStatus.Code).toBe('1');
  expect(results.Response.ResponseStatus.Description).toBe('Success');
  expect(results.Response.TransactionReference.CustomerContext).toBe(String(orderId));

  const shipmentId: string = results.ShipmentResults.ShipmentIdentificationNumber;
  expect(shipmentId).toMatch(/^1Z[A-Z0-9]{16}$/i);

  const packageResultsRaw = results.ShipmentResults.PackageResults;
  const packageResultsList = Array.isArray(packageResultsRaw) ? packageResultsRaw : [packageResultsRaw];

  if (packageResultsList.length === 1) {
    expect(packageResultsList[0].TrackingNumber).toBe(shipmentId);
  } else {
    for (const pkg of packageResultsList) {
      expect(pkg.TrackingNumber).toMatch(/^1Z[A-Z0-9]{16}$/i);
    }
  }

  const totalCharges = results.ShipmentResults.ShipmentCharges.TotalCharges;
  const negotiatedRate = results.ShipmentResults.NegotiatedRateCharges.TotalCharge;
  expect(totalCharges.CurrencyCode).toBe('USD');
  expect(parseFloat(totalCharges.MonetaryValue)).toBeGreaterThan(0);
  expect(parseFloat(negotiatedRate.MonetaryValue)).toBeLessThanOrEqual(parseFloat(totalCharges.MonetaryValue));

  const pkg = shipment.Shipment.Package[0];
  const packageWeightUnit = pkg.PackageWeight.UnitOfMeasurement.Code;
  const packageWeight = parseFloat(pkg.PackageWeight.Weight);
  const billingWeight = parseFloat(results.ShipmentResults.BillingWeight.Weight);
  expect(results.ShipmentResults.BillingWeight.UnitOfMeasurement.Code).toBe(packageWeightUnit);
  expect(billingWeight).toBeGreaterThanOrEqual(packageWeight);
  console.log(`Billing weight: ${results.ShipmentResults.BillingWeight.Weight} ${packageWeightUnit}`);

  const labelBuffers: Buffer[] = [];
  for (const pkgResult of packageResultsList) {
    const label = pkgResult.ShippingLabel;
    expect(label.ImageFormat.Code).toBe(labelFormat);
    expect(label.GraphicImage.length).toBeGreaterThan(0);
    const labelBuffer = Buffer.from(label.GraphicImage, 'base64');
    expect(labelBuffer.length).toBeGreaterThan(100);
    if (labelFormat === 'GIF') {
      expect(labelBuffer.subarray(0, 3).toString('ascii')).toBe('GIF');
    } else if (labelFormat === 'PNG') {
      expect(labelBuffer[0]).toBe(0x89);
      expect(labelBuffer.subarray(1, 4).toString('ascii')).toBe('PNG');
    } else if (labelFormat === 'ZPL') {
      expect(labelBuffer.toString('utf-8').trimStart()).toMatch(/^\^XA/);
    }
    labelBuffers.push(labelBuffer);
  }
  console.log(`Response label images: ${labelBuffers.length} valid ${labelFormat}(s), ${labelBuffers.map((b) => b.length + ' bytes').join(', ')}`);

  return labelBuffers;
}
