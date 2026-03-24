export const BLOCKED_SITES_KEY = "honeycomb_blocked_sites";

export const DEFAULT_BLOCKED_SITES = [
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "youtube.com",
  "reddit.com",
  "snapchat.com",
  "pinterest.com",
  "linkedin.com",
];

export function loadBlockedSites() {
  try {
    const raw = localStorage.getItem(BLOCKED_SITES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [...DEFAULT_BLOCKED_SITES];
    }
  } catch (_) {}
  return [...DEFAULT_BLOCKED_SITES];
}

export function saveBlockedSites(sites) {
  try {
    localStorage.setItem(BLOCKED_SITES_KEY, JSON.stringify(sites));
  } catch (_) {}
}

export function normalizeDomain(input) {
  const s = input.trim().toLowerCase().replace(/^https?:\/\//, "").split("/")[0];
  return s || null;
}
