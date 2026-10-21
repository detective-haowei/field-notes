#!/usr/bin/env node
/**
 * Runs npm with `--before` pinned to the cooldown cutoff, so any version
 * published in the last COOLDOWN_DAYS days is invisible to the resolver —
 * for direct dependencies and everything they pull in.
 *
 *   node scripts/npm-cooldown.mjs install some-package
 *   node scripts/npm-cooldown.mjs update
 *
 * Normally reached through `npm run deps:add` / `npm run deps:update`.
 */
import { spawnSync } from "node:child_process";
import { COOLDOWN_DAYS, cutoffISO } from "./cooldown.mjs";

const args = process.argv.slice(2);

if (!args.length) {
  console.error("usage: node scripts/npm-cooldown.mjs <npm command> [args...]");
  process.exit(1);
}

if (args.some((a) => a === "--before" || a.startsWith("--before="))) {
  console.error("refusing to run: --before is already set, which would defeat the cooldown");
  process.exit(1);
}

const before = cutoffISO();
console.log(`Dependency cooldown: resolving versions published on or before ${before} (${COOLDOWN_DAYS} days).`);

const result = spawnSync("npm", [...args, `--before=${before}`], {
  stdio: "inherit",
  shell: process.platform === "win32",
});

process.exit(result.status ?? 1);
