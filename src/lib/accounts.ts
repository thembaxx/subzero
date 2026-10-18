import type { Account, Category } from "./types";

const brands: Record<string, { name: string; category: Category; color: string; letter: string }> =
  {
    "google.com": { name: "Google", category: "Productivity", color: "#4285f4", letter: "G" },
    "spotify.com": { name: "Spotify", category: "Entertainment", color: "#1a8f48", letter: "S" },
    "instagram.com": { name: "Instagram", category: "Social", color: "#b73877", letter: "i" },
    "notion.so": { name: "Notion", category: "Productivity", color: "#292d2a", letter: "N" },
    "notion.com": { name: "Notion", category: "Productivity", color: "#292d2a", letter: "N" },
    "amazon.com": { name: "Amazon", category: "Shopping", color: "#a15c00", letter: "a" },
    "netflix.com": { name: "Netflix", category: "Entertainment", color: "#c52a32", letter: "N" },
    "figma.com": { name: "Figma", category: "Productivity", color: "#7952b3", letter: "F" },
    "dropbox.com": { name: "Dropbox", category: "Productivity", color: "#1767db", letter: "D" },
    "linkedin.com": { name: "LinkedIn", category: "Social", color: "#0967a2", letter: "in" },
    "adobe.com": { name: "Adobe", category: "Productivity", color: "#d63235", letter: "A" },
    "pinterest.com": { name: "Pinterest", category: "Social", color: "#bd2230", letter: "P" },
    "airbnb.com": { name: "Airbnb", category: "Shopping", color: "#d84659", letter: "A" },
    "github.com": { name: "GitHub", category: "Productivity", color: "#353b36", letter: "gh" },
  };

export function validDomain(value: string): boolean {
  return (
    value.length <= 253 && /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(value)
  );
}

export function describeDomain(domain: string) {
  const normalized = domain.toLowerCase().replace(/^www\./, "");
  const known = Object.keys(brands).find(
    (brand) => normalized === brand || normalized.endsWith(`.${brand}`),
  );
  if (known) return { domain: known, ...brands[known] };
  const clean = normalized.replace(/^(?:(?:mail|email|accounts|notifications|news)\.)+/, "");
  const word = clean.split(".")[0];
  return {
    domain: clean,
    name: word.charAt(0).toUpperCase() + word.slice(1),
    category: "Other" as Category,
    color: "#596650",
    letter: word.charAt(0).toUpperCase(),
  };
}

export function mergeAccounts(accounts: Account[]): Account[] {
  const byDomain = new Map<string, Account>();
  for (const account of accounts) {
    const previous = byDomain.get(account.domain);
    byDomain.set(
      account.domain,
      previous
        ? {
            ...previous,
            sources: [...new Set([...previous.sources, ...account.sources])],
            exposure: account.exposure ?? previous.exposure,
            evidence: previous.sources.includes("mailbox") ? previous.evidence : account.evidence,
          }
        : account,
    );
  }
  return [...byDomain.values()].sort((a, b) => a.name.localeCompare(b.name));
}
