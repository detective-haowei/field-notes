/**
 * Dependency cooldown.
 *
 * Packages published in the last couple of days are the ones most likely to be
 * a compromised release: when a maintainer account is taken over, the malicious
 * version is usually caught and unpublished within hours. Waiting before we
 * pick anything up means those never reach a lockfile here.
 */
export const COOLDOWN_DAYS = 2;

export const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

/** The newest publish date we will accept, as an ISO timestamp. */
export function cutoffISO(now = Date.now()) {
  return new Date(now - COOLDOWN_MS).toISOString();
}

/** How old a package is, in days, given its publish time. */
export function ageInDays(publishedISO, now = Date.now()) {
  return (now - Date.parse(publishedISO)) / (24 * 60 * 60 * 1000);
}
