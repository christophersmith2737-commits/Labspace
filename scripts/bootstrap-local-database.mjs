import { existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const databaseDir = path.join(
  projectRoot,
  ".wrangler",
  "state",
  "v3",
  "d1",
  "miniflare-D1DatabaseObject",
);
const snapshotPath = path.join(projectRoot, "data", "local-database-snapshot.sql");
const wranglerConfig = path.join(projectRoot, "dist", "server", "wrangler.json");
const schemaPath = path.join(projectRoot, "drizzle", "0000_amazing_micromax.sql");

function hasLocalDatabase() {
  try {
    return readdirSync(databaseDir).some(
      (name) => name.endsWith(".sqlite") && name !== "metadata.sqlite",
    );
  } catch {
    return false;
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    shell: false,
  });
  if (result.status !== 0)
    throw new Error(`${command} failed with exit code ${result.status ?? "unknown"}.`);
}

if (hasLocalDatabase()) {
  console.log("Existing local database found; keeping it unchanged.");
  process.exit(0);
}

if (!existsSync(snapshotPath)) {
  console.log("No tracked data snapshot found; starting with an empty local database.");
  process.exit(0);
}

if (!existsSync(wranglerConfig)) {
  console.log("Preparing the local build before restoring the database...");
  run(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "build"]);
}

const wrangler = [
  "--import",
  "./scripts/sites-env.mjs",
  "./node_modules/wrangler/bin/wrangler.js",
  "d1",
  "execute",
  "site-creator-d1",
  "--local",
  "--persist-to",
  ".wrangler/state",
  "--config",
  "dist/server/wrangler.json",
];

console.log("Creating the local database schema...");
run(process.execPath, [...wrangler, "--file", path.relative(projectRoot, schemaPath)]);

console.log("Restoring the tracked LabSpace data snapshot...");
run(process.execPath, [...wrangler, "--file", path.relative(projectRoot, snapshotPath)]);

console.log("Local database restored successfully.");
