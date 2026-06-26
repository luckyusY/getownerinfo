// Pricing engine. All amounts are Rwf integers and VAT-INCLUSIVE (spec: "18% VAT
// inclusive"), so the listing fee the user pays already contains VAT; we only
// derive the VAT portion for accounting/invoicing.

function discountForMonths(durationDiscounts, months) {
  if (!durationDiscounts) return 0;
  const get = (k) =>
    typeof durationDiscounts.get === "function"
      ? durationDiscounts.get(String(k))
      : durationDiscounts[k] ?? durationDiscounts[String(k)];
  return get(months) ?? 0;
}

/**
 * Compute the total listing fee for a Model B paid listing.
 * @param {object} args
 *   - baseMonthlyFee: Rwf, VAT-inclusive monthly rate (from Category)
 *   - months: listing duration
 *   - vatRate: e.g. 0.18
 *   - durationDiscounts: { months -> fraction }
 * @returns {{ months, baseMonthlyFee, discountRate, grossBeforeDiscount, total, vatPortion, netExVat }}
 */
export function computeListingFee({ baseMonthlyFee, months, vatRate = 0.18, durationDiscounts }) {
  const gross = Math.round(baseMonthlyFee * months);
  const discountRate = discountForMonths(durationDiscounts, months);
  const total = Math.round(gross * (1 - discountRate)); // VAT-inclusive amount due
  const netExVat = Math.round(total / (1 + vatRate));
  const vatPortion = total - netExVat;

  return {
    months,
    baseMonthlyFee,
    discountRate,
    grossBeforeDiscount: gross,
    total,
    vatPortion,
    netExVat,
  };
}

/**
 * Compute Model A commission on a completed deal.
 * @param {object} args
 *   - amount: final sale price or (monthly rent), Rwf
 *   - commissionPercent: e.g. 0.05
 *   - vatRate
 *   - rentMonths: for rentals, multiply monthly rent by months (default 1)
 * @returns {{ base, commissionPercent, total, vatPortion, netExVat }}
 */
export function computeCommission({ amount, commissionPercent, vatRate = 0.18, rentMonths = 1 }) {
  const base = Math.round(amount * rentMonths);
  const total = Math.round(base * commissionPercent); // VAT-inclusive commission
  const netExVat = Math.round(total / (1 + vatRate));
  const vatPortion = total - netExVat;
  return { base, commissionPercent, total, vatPortion, netExVat };
}

/**
 * Penalty = configurable % of the expected commission/fee + fixed amount.
 */
export function computePenalty({ expectedAmount, commissionPercent = 0.5, fixedAmount = 100_000 }) {
  return Math.round(expectedAmount * commissionPercent) + fixedAmount;
}
