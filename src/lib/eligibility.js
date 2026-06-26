import { LISTING_MODELS } from "./constants.js";

// Normalize thresholds whether they come from a Mongoose Map or a plain object.
function thresholdFor(thresholds, transactionType) {
  if (!thresholds) return null;
  const get = (k) =>
    typeof thresholds.get === "function" ? thresholds.get(k) : thresholds[k];
  if (transactionType === "rent") return get("rentMonthly") ?? null;
  return get("sale") ?? null;
}

/**
 * Decide Model A vs Model B for a prospective listing.
 *
 * Rule priority (per spec Part 6):
 *   1. Category-forced model
 *   2. Category disallows Model A
 *   3. Multi-unit rule
 *   4. Price threshold
 *   5. Default safety -> Model B
 *
 * @param {object} modelRule  - category.modelRule { allowsModelA, forcedModel, maxUnitsForModelA, thresholds }
 * @param {object} input      - { transactionType: 'rent'|'sale', quantity: number, price: number }
 * @returns {{ model: 'A'|'B', eligibleForA: boolean, reason: string }}
 */
export function evaluateModel(modelRule, input) {
  const rule = modelRule || {};
  const { transactionType = "sale", quantity = 1, price = 0 } = input || {};

  if (rule.forcedModel === LISTING_MODELS.B) {
    return { model: "B", eligibleForA: false, reason: "Category is always pay-to-list (Model B)." };
  }
  if (rule.forcedModel === LISTING_MODELS.A) {
    return { model: "A", eligibleForA: true, reason: "Category is always exclusive (Model A)." };
  }
  if (!rule.allowsModelA) {
    return { model: "B", eligibleForA: false, reason: "Category not eligible for Model A." };
  }

  const maxUnits = rule.maxUnitsForModelA ?? 1;
  if (quantity > maxUnits) {
    return {
      model: "B",
      eligibleForA: false,
      reason: `Multi-unit listing (${quantity} > ${maxUnits}) defaults to Model B.`,
    };
  }

  const threshold = thresholdFor(rule.thresholds, transactionType);
  if (threshold == null) {
    return {
      model: "B",
      eligibleForA: false,
      reason: `No Model A threshold for ${transactionType}; defaults to Model B.`,
    };
  }
  if (price >= threshold) {
    return {
      model: "A",
      eligibleForA: true,
      reason: `Price ${price} meets the Model A threshold (${threshold}).`,
    };
  }
  return {
    model: "B",
    eligibleForA: false,
    reason: `Price ${price} below Model A threshold (${threshold}); defaults to Model B.`,
  };
}
