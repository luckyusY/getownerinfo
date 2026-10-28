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

  // If it lands on Model B, show what the paid listing would cost.
  const fee =
    decision.model === "B"
      ? computeListingFee({
          baseMonthlyFee: category.listingFeeMonthly,
          months,
          vatRate: settings.vatRate,
          durationDiscounts: settings.durationDiscounts,
        })
      : null;

  return ok({
    category: { slug: category.slug, name: category.name },
    decision: {
      ...decision,
      eligibilityReason: eligibility.reason,
      eligibleForA: eligibility.eligibleForA,
    },
    listingFee: fee,
    tokenFee: category.tokenFee,
    commissionPercent: category.commissionPercent,
  });
}
