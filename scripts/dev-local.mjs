// Run the whole app against a throwaway in-memory MongoDB.
//
//   npm run dev:local
//
// Useful when you have no Atlas connection string (or do not want to point a
// development session at the real cluster). The database lives in memory only:
// it is seeded on every start and discarded when you stop the process.
//
// Cloudinary uploads still need real credentials — everything else works.

import { spawn } from "node:child_process";
import { MongoMemoryServer } from "mongodb-memory-server";

const PORT = Number(process.env.PORT || 3000);
const DB_PORT = Number(process.env.LOCAL_DB_PORT || 27018);

let mongod;

async function run(label, command, args, env) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: { ...process.env, ...env },
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(new Error(`${label} exited with code ${code}`))
    );
    child.on("error", reject);
  });
}

async function shutdown(code = 0) {
  if (mongod) await mongod.stop().catch(() => {});
  process.exit(code);
}

async function main() {
  console.log("Starting in-memory MongoDB...");
  mongod = await MongoMemoryServer.create({
    instance: { port: DB_PORT, dbName: "getownerinfo" },
  });
  const uri = mongod.getUri("getownerinfo");
  console.log(`  ${uri}\n`);

  const env = {
    MONGODB_URI: uri,
    // The in-memory database is throwaway, so these only need to be non-empty.
    JWT_SECRET: process.env.JWT_SECRET || "local-dev-secret-not-for-production",
    PAYMENTS_ALLOW_STUB: process.env.PAYMENTS_ALLOW_STUB || "true",
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || `http://localhost:${PORT}`,
  };

  console.log("Seeding catalog and demo data...");
  await run("seed", "node", ["scripts/seed.mjs"], env);
  await run("seed:demo", "node", ["scripts/seed-demo.mjs"], env);

  console.log(`\nStarting Next.js on http://localhost:${PORT}\n`);
  const dev = spawn("npx", ["next", "dev", "-p", String(PORT)], {
    env: { ...process.env, ...env },
    stdio: "inherit",
    shell: process.platform === "win32",
  });
  dev.on("exit", (code) => shutdown(code ?? 0));

  for (const signal of ["SIGINT", "SIGTERM"]) {
    process.on(signal, () => {
      dev.kill();
      shutdown(0);
    });
  }
}

main().catch(async (err) => {
  console.error("dev:local failed:", err.message);
  await shutdown(1);
});
