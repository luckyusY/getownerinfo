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
  months: z.number().int().positive().default(1),
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

  const decision = evaluateModel(category.modelRule, { transactionType, quantity, price });

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
    decision,
    listingFee: fee,
    tokenFee: category.tokenFee,
    commissionPercent: category.commissionPercent,
  });
}
