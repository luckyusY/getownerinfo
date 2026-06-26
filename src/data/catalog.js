// Seed catalog: categories with their Model A/B eligibility rules and default
// fees. Fee amounts (Rwf, VAT-inclusive) are PLACEHOLDERS until the official
// pricing attachment (Part 2 / Part 12) is provided — all are admin-editable.
//
// modelRule fields:
//   allowsModelA       - can this category ever be Model A (exclusive)?
//   forcedModel        - if set ("A"|"B"), always this model regardless of inputs
//   maxUnitsForModelA  - quantity above this forces Model B (multi-unit rule)
//   thresholds         - min price (Rwf) per transaction type to qualify for Model A

export const CATEGORIES = [
  {
    slug: "real-estate",
    name: "Real Estate",
    transactionTypes: ["rent", "sale"],
    modelRule: {
      allowsModelA: true,
      forcedModel: null,
      maxUnitsForModelA: 1,
      thresholds: { rentMonthly: 1_500_000, sale: 50_000_000 },
    },
    listingFeeMonthly: 20_000,
    tokenFee: { buyer: 10_000, tenant: 5_000, client: 5_000 },
    commissionPercent: 0.05,
    subcategories: [
      { slug: "residential", name: "Residential", itemTypes: ["Apartment", "House", "Studio", "Villa"] },
      { slug: "commercial", name: "Commercial", itemTypes: ["Office", "Shop", "Warehouse"] },
      { slug: "land", name: "Land & Plots", itemTypes: ["Residential Plot", "Commercial Plot", "Farmland"] },
    ],
  },
  {
    slug: "vehicles",
    name: "Vehicles for Sale",
    transactionTypes: ["sale"],
    modelRule: {
      allowsModelA: true,
      forcedModel: null,
      maxUnitsForModelA: 1,
      thresholds: { sale: 10_000_000 },
    },
    listingFeeMonthly: 15_000,
    tokenFee: { buyer: 8_000, tenant: 8_000, client: 8_000 },
    commissionPercent: 0.03,
    subcategories: [
      { slug: "cars", name: "Cars", itemTypes: ["Sedan", "SUV", "Pickup", "Hatchback"] },
      { slug: "motorcycles", name: "Motorcycles", itemTypes: ["Motorbike", "Scooter"] },
      { slug: "heavy", name: "Trucks & Buses", itemTypes: ["Truck", "Bus", "Trailer"] },
    ],
  },
  {
    slug: "vehicle-resellers",
    name: "Vehicle Resellers",
    transactionTypes: ["sale"],
    modelRule: {
      allowsModelA: false,
      forcedModel: "B", // resellers / multi-unit are always pay-to-list
      maxUnitsForModelA: 0,
      thresholds: {},
    },
    listingFeeMonthly: 25_000,
    tokenFee: { buyer: 8_000, tenant: 8_000, client: 8_000 },
    commissionPercent: 0,
    subcategories: [
      { slug: "dealership", name: "Dealership Stock", itemTypes: ["Car Lot", "Mixed Fleet"] },
    ],
  },
  {
    slug: "home-office-furniture",
    name: "Home & Office Furniture",
    transactionTypes: ["sale"],
    modelRule: {
      allowsModelA: true,
      forcedModel: null,
      maxUnitsForModelA: 1,
      thresholds: { sale: 3_000_000 },
    },
    listingFeeMonthly: 10_000,
    tokenFee: { buyer: 5_000, tenant: 5_000, client: 5_000 },
    commissionPercent: 0.05,
    subcategories: [
      { slug: "home-furniture", name: "Home Furniture", itemTypes: ["Sofa Set", "Bedroom Set", "Dining Set"] },
      { slug: "office-furniture", name: "Office Furniture", itemTypes: ["Desk", "Conference Table", "Workstation"] },
    ],
  },
  {
    slug: "made-in-rwanda",
    name: "Made in Rwanda",
    transactionTypes: ["sale"],
    modelRule: {
      allowsModelA: true,
      forcedModel: null,
      maxUnitsForModelA: 1,
      thresholds: { sale: 3_000_000 },
    },
    listingFeeMonthly: 10_000,
    tokenFee: { buyer: 5_000, tenant: 5_000, client: 5_000 },
    commissionPercent: 0.05,
    subcategories: [
      { slug: "crafts", name: "Crafts & Decor", itemTypes: ["Furniture", "Decor", "Textiles"] },
    ],
  },
  {
    slug: "home-appliances",
    name: "Home Appliances",
    transactionTypes: ["sale"],
    modelRule: {
      allowsModelA: true,
      forcedModel: null,
      maxUnitsForModelA: 1,
      thresholds: { sale: 3_000_000 },
    },
    listingFeeMonthly: 10_000,
    tokenFee: { buyer: 5_000, tenant: 5_000, client: 5_000 },
    commissionPercent: 0.05,
    subcategories: [
      { slug: "kitchen", name: "Kitchen", itemTypes: ["Fridge", "Cooker", "Dishwasher"] },
      { slug: "electronics", name: "Electronics", itemTypes: ["TV", "Sound System", "Air Conditioner"] },
    ],
  },
  {
    slug: "business-industry",
    name: "Business & Industry",
    transactionTypes: ["sale"],
    modelRule: {
      allowsModelA: true,
      forcedModel: null,
      maxUnitsForModelA: 1,
      thresholds: { sale: 3_000_000 },
    },
    listingFeeMonthly: 15_000,
    tokenFee: { buyer: 8_000, tenant: 8_000, client: 8_000 },
    commissionPercent: 0.05,
    subcategories: [
      { slug: "machinery", name: "Machinery & Equipment", itemTypes: ["Generator", "Industrial Machine", "Tools"] },
      { slug: "business-sale", name: "Business for Sale", itemTypes: ["Running Business", "Franchise"] },
    ],
  },
];

// Global platform defaults — singleton document.
export const DEFAULT_SETTINGS = {
  key: "global",
  vatRate: 0.18,
  currency: "Rwf",
  durationDiscounts: { 1: 0, 2: 0.2, 3: 0.3, 6: 0.4, 12: 0.5 },
  seeker: { postFee: 20_000, viewToken: 10_000, validityDays: [7, 14, 30] },
  penalty: { commissionPercent: 0.5, fixedAmount: 100_000 },
  tokenAccess: { otpRequired: true, maxUnlocksPerUserPerDay: 20 },
};
