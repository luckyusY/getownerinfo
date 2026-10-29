import { z } from "zod";
import { connectDB } from "@/lib/db";
import Category from "@/models/Category";
import PlatformSettings, { getSettings } from "@/models/PlatformSettings";
import { DEFAULT_SETTINGS } from "@/data/catalog";
import { evaluateModel } from "@/lib/eligibility";
import { computeListingFee } from "@/lib/pricing";
import { ok, fail } from "@/lib/api";

const schema = z.object({
  categorySlug: z.string(),
  transactionType: z.enum(["rent", "sale"]).default("sale"),
  quantity: z.number().int().positive().default(1),
  price: z.number().nonnegative().default(0),
  months: z.number().int().refine((n) => [1, 2, 3, 6, 12].includes(n), "Choose a supported listing duration").default(1),
  modelChoice: z.enum(["A", "B"]).optional(),
});

// POST /api/eligibility — preview Model A/B decision + Model B fee for inputs.
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid JSON body");
  }
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return fail("Validation failed", 422, { issues: parsed.error.flatten().fieldErrors });
  }

  await connectDB();
  const { categorySlug, transactionType, quantity, price, months } = parsed.data;

  const category = await Category.findOne({ slug: categorySlug });
  if (!category) return fail("Unknown category", 404);

  const settings = await getSettings(PlatformSettings, DEFAULT_SETTINGS);

  const eligibility = evaluateModel(category.modelRule, { transactionType, quantity, price });
  if (category.modelRule?.forcedModel && parsed.data.modelChoice && parsed.data.modelChoice !== category.modelRule.forcedModel) {
    return fail(`This category only supports Model ${category.modelRule.forcedModel}`, 422);
  }
  if (parsed.data.modelChoice === "A" && !eligibility.eligibleForA) {
    return fail("This listing does not qualify for Model A", 422);
  }
  const decision = parsed.data.modelChoice
    ? {
        ...eligibility,
        model: parsed.data.modelChoice,
        reason: parsed.data.modelChoice === "A"
          ? "You selected the exclusive commission model."
          : "You selected the paid listing model.",
      }
    : eligibility;

  // What a paid listing would cost at these inputs. Computed regardless of the
  // current choice, so the model-selection step can show both options side by
  // side rather than only the one already picked.
  const paidFee = computeListingFee({
    baseMonthlyFee: category.listingFeeMonthly,
    months,
    vatRate: settings.vatRate,
    durationDiscounts: settings.durationDiscounts,
  });
  const fee = decision.model === "B" ? paidFee : null;

  const forced = category.modelRule?.forcedModel || null;
  const comparison = {
    // Model A is on the table when the listing qualifies and the category has
    // not been forced to pay-to-list.
    modelA: {
      available: eligibility.eligibleForA && forced !== "B",
      unavailableReason: eligibility.eligibleForA ? null : eligibility.reason,
      commissionPercent: category.commissionPercent,
      exclusivityMonths: months,
      listingFee: 0,
    },
    modelB: {
      available: forced !== "A",
      unavailableReason: forced === "A" ? "This category is always exclusive (Model A)." : null,
      fee: paidFee,
      commissionPercent: 0,
    },
    // True when the seller actually has a decision to make.
    choiceRequired: eligibility.eligibleForA && !forced,
    forcedModel: forced,
  };

  return ok({
    category: { slug: category.slug, name: category.name },
    decision: {
      ...decision,
      eligibilityReason: eligibility.reason,
      eligibleForA: eligibility.eligibleForA,
    },
    listingFee: fee,
    comparison,
    durationDiscounts: settings.durationDiscounts,
    tokenFee: category.tokenFee,
    commissionPercent: category.commissionPercent,
  });
}
