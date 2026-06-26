// Seed the database with catalog, platform settings, and an initial admin.
// Run with:  npm run seed   (loads .env.local via --env-file)
// Idempotent: safe to run repeatedly (upserts by slug/key/email).

import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { CATEGORIES, DEFAULT_SETTINGS } from "../src/data/catalog.js";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.error("MONGODB_URI is not set. Run via `npm run seed`.");
  process.exit(1);
}

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL || "admin@getownerinfo.local";
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD || "ChangeMe123!";

async function main() {
  await mongoose.connect(uri);
  const db = mongoose.connection;
  const now = new Date();

  const categories = db.collection("categories");
  const subcategories = db.collection("subcategories");
  const settings = db.collection("platformsettings");
  const users = db.collection("users");

  let catCount = 0;
  let subCount = 0;

  for (const [i, cat] of CATEGORIES.entries()) {
    const { subcategories: subs, ...catDoc } = cat;
    await categories.updateOne(
      { slug: cat.slug },
      {
        $set: {
          ...catDoc,
          isActive: true,
          sortOrder: i,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    catCount++;

    const catRow = await categories.findOne({ slug: cat.slug });
    for (const [j, sub] of (subs || []).entries()) {
      await subcategories.updateOne(
        { category: catRow._id, slug: sub.slug },
        {
          $set: {
            category: catRow._id,
            slug: sub.slug,
            name: sub.name,
            itemTypes: sub.itemTypes || [],
            isActive: true,
            sortOrder: j,
            updatedAt: now,
          },
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );
      subCount++;
    }
  }

  // Platform settings singleton
  await settings.updateOne(
    { key: "global" },
    { $set: { ...DEFAULT_SETTINGS, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );

  // Initial admin
  const existingAdmin = await users.findOne({ email: ADMIN_EMAIL });
  if (!existingAdmin) {
    await users.insertOne({
      name: "Platform Admin",
      email: ADMIN_EMAIL,
      role: "admin",
      passwordHash: await bcrypt.hash(ADMIN_PASSWORD, 10),
      isVerified: true,
      penaltyBalance: 0,
      isActive: true,
      isBlacklisted: false,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`\n  Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log("  ^ change this password after first login.\n");
  } else {
    console.log(`\n  Admin already exists: ${ADMIN_EMAIL}\n`);
  }

  console.log(`Seeded ${catCount} categories, ${subCount} subcategories, settings singleton.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
