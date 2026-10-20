#!/usr/bin/env node
/**
 * Fails if anything in package-lock.json was published inside the cooldown
 * window. `npm run deps:add` already prevents that, so this is the backstop for
 * a lockfile written some other way — a plain `npm install`, a merge, or a bot.
 *
 * By default it only looks at entries that changed against git HEAD, because
 * the registry has no cheap per-version date API: the publish time only comes
 * in the full packument, which is tens of megabytes for a busy package. In
 * normal runs nothing has changed and this costs no requests at all.
 *
 *   node scripts/check-dependency-age.mjs          # changed entries only
 *   node scripts/check-dependency-age.mjs --all    # every entry (slow)
 */
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { COOLDOWN_DAYS, ageInDays } from "./cooldown.mjs";

const REGISTRY = "https://registry.npmjs.org";
const CONCURRENCY = 4;
const checkAll = process.argv.includes("--all");

/** name -> version for every registry package a lockfile installs. */
function installedVersions(lockText) {
  const lock = JSON.parse(lockText);
  const out = new Map();
  for (const [path, entry] of Object.entries(lock.packages || {})) {
    if (!path.startsWith("node_modules/")) continue;
    // Skip links and anything not coming from a registry tarball.
    if (entry.link || !entry.resolved || !entry.version) continue;
    if (!/^https?:/.test(entry.resolved)) continue;
    out.set(path.slice(path.lastIndexOf("node_modules/") + "node_modules/".length), entry.version);
  }
  return out;
}

function committedLock() {
  try {
    return execFileSync("git", ["show", "HEAD:package-lock.json"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
  } catch {
    return null; // no lockfile committed yet
  }
}

async function publishedAt(name, version) {
  const url = `${REGISTRY}/${name.replace("/", "%2F")}`;
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`${name}: registry returned ${res.status}`);
  const time = (await res.json()).time;
  const published = time?.[version];
  if (!published) throw new Error(`${name}@${version}: no publish date in the registry`);
  return published;
}

/** Runs `worker` over `items`, a few at a time. */
async function mapLimit(items, limit, worker) {
  const results = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        results[i] = await worker(items[i]);
      }
    }),
  );
  return results;
}

const current = installedVersions(readFileSync("package-lock.json", "utf8"));

let toCheck;
if (checkAll) {
  toCheck = [...current];
} else {
  const previousText = committedLock();
  if (previousText === null) {
    toCheck = [...current];
  } else {
    const previous = installedVersions(previousText);
    toCheck = [...current].filter(([name, version]) => previous.get(name) !== version);
  }
}

if (!toCheck.length) {
  console.log("Dependency cooldown: no new or changed packages to check.");
  process.exit(0);
}

console.log(
  `Dependency cooldown: checking ${toCheck.length} package${toCheck.length === 1 ? "" : "s"} ` +
    `against a ${COOLDOWN_DAYS}-day minimum age…`,
);

const now = Date.now();
const checked = await mapLimit(toCheck, CONCURRENCY, async ([name, version]) => {
  try {
    const published = await publishedAt(name, version);
    return { name, version, age: ageInDays(published, now), published };
  } catch (e) {
    return { name, version, error: e.message };
  }
});

const errors = checked.filter((r) => r.error);
const tooNew = checked.filter((r) => !r.error && r.age < COOLDOWN_DAYS);

for (const r of checked.filter((r) => !r.error).sort((a, b) => a.age - b.age)) {
  const flag = r.age < COOLDOWN_DAYS ? "TOO NEW" : "ok";
  console.log(`  ${flag.padEnd(8)} ${r.name}@${r.version}  ${r.age.toFixed(1)} days old`);
}

for (const r of errors) console.error(`  ERROR    ${r.name}@${r.version}: ${r.error}`);

if (tooNew.length) {
  console.error(
    `\n${tooNew.length} package${tooNew.length === 1 ? " is" : "s are"} younger than ` +
      `${COOLDOWN_DAYS} days. Install through \`npm run deps:add\` so the cooldown applies, ` +
      `or wait until they age out.`,
  );
  process.exit(1);
}

// A registry we could not reach is not a pass.
if (errors.length) {
  console.error(`\nCould not verify ${errors.length} package${errors.length === 1 ? "" : "s"}.`);
  process.exit(1);
}

console.log("\nAll checked packages are outside the cooldown window.");
