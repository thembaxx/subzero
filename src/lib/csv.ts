import { describeDomain, mergeAccounts, validDomain } from "./accounts";
import type { Account } from "./types";

// Parse quoted CSV fields without retaining password or note columns in the result.
export function importAccounts(csv: string): Account[] {
  if (csv.length > 2_000_000) throw new Error("Choose a CSV smaller than 2 MB.");
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false;
  const input = csv.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i++) {
    const character = input[i];
    if (character === '"') {
      if (quoted && input[i + 1] === '"') {
        field += '"';
        i++;
      } else quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && input[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += character;
    if (rows.length > 1001) throw new Error("Import up to 1,000 accounts at a time.");
  }
  if (quoted) throw new Error("This CSV has an unclosed quoted field. Please export it again.");
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  const headers = rows.shift()?.map((header) => header.trim().toLowerCase()) ?? [];
  const urlIndex = headers.findIndex((header) =>
    ["url", "website", "login_uri", "login uri", "login_url"].includes(header),
  );
  if (urlIndex < 0) throw new Error("Your CSV needs a url, website, or login_uri column.");
  const accounts: Account[] = [];
  for (const fields of rows) {
    const raw = fields[urlIndex]?.trim();
    if (!raw) continue;
    try {
      const url = new URL(raw.includes("://") ? raw : `https://${raw}`);
      if (!["https:", "http:"].includes(url.protocol) || !validDomain(url.hostname)) continue;
      const brand = describeDomain(url.hostname);
      accounts.push({
        id: `import-${brand.domain}`,
        ...brand,
        sources: ["import"],
        evidence: "This website was included in a CSV you imported on this device.",
      });
    } catch {
      /* Rows without a valid website are ignored. */
    }
  }
  if (!accounts.length)
    throw new Error("No valid websites found. Check the URL column and try again.");
  return mergeAccounts(accounts);
}
