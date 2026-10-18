import { describeDomain, mergeAccounts, validDomain } from "./accounts";
import type { Account, DiscoveryResult, SourceStatus } from "./types";

type Fetcher = typeof fetch;

class ProviderError extends Error {}

async function providerGet(url: string, headers: Record<string, string>, fetcher: Fetcher) {
  return fetcher(url, { headers, cache: "no-store", signal: AbortSignal.timeout(10_000) });
}

export async function scanMailbox(
  email: string,
  token: string,
  fetcher: Fetcher = fetch,
): Promise<Account[]> {
  const headers = { Authorization: `Bearer ${token}` };
  const profile = await providerGet(
    "https://gmail.googleapis.com/gmail/v1/users/me/profile",
    headers,
    fetcher,
  );
  if (!profile.ok) throw new ProviderError("Reconnect Google and allow read-only inbox access.");
  const identity: { emailAddress?: string } = await profile.json();
  if (identity.emailAddress?.toLowerCase() !== email.toLowerCase()) {
    throw new ProviderError("The connected inbox must match your verified email address.");
  }
  const query = encodeURIComponent(
    "{subject:welcome subject:registration subject:verify subject:verification subject:signup} -in:spam -in:trash",
  );
  const response = await providerGet(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=24&q=${query}`,
    headers,
    fetcher,
  );
  if (!response.ok)
    throw new ProviderError("Your inbox could not be checked. Reconnect Google and try again.");
  const list: { messages?: { id: string }[] } = await response.json();
  const messages = list.messages?.slice(0, 24) ?? [];
  const accounts: Account[] = [];
  for (let start = 0; start < messages.length; start += 4) {
    const batch = await Promise.all(
      messages.slice(start, start + 4).map(async ({ id }) => {
        const message = await providerGet(
          `https://gmail.googleapis.com/gmail/v1/users/me/messages/${encodeURIComponent(id)}?format=metadata&metadataHeaders=From`,
          headers,
          fetcher,
        );
        if (!message.ok)
          throw new ProviderError("Some inbox messages could not be checked. Try again.");
        const data: { payload?: { headers?: { name: string; value: string }[] } } =
          await message.json();
        const sender = data.payload?.headers?.find(
          (header) => header.name.toLowerCase() === "from",
        )?.value;
        const domain = sender
          ?.match(/[a-z0-9._%+-]+@([a-z0-9.-]+\.[a-z]{2,})/i)?.[1]
          ?.toLowerCase();
        if (!domain || !validDomain(domain)) return null;
        const brand = describeDomain(domain);
        return {
          id: `mailbox-${brand.domain}`,
          ...brand,
          sources: ["mailbox"],
          evidence:
            "A welcome or verification email suggests a possible account. Confirm it with the service.",
        } satisfies Account;
      }),
    );
    for (const account of batch) if (account) accounts.push(account);
  }
  return mergeAccounts(accounts);
}

export async function scanBreaches(
  email: string,
  apiKey: string,
  fetcher: Fetcher = fetch,
): Promise<Account[]> {
  const response = await providerGet(
    `https://haveibeenpwned.com/api/v3/breachedaccount/${encodeURIComponent(email)}?truncateResponse=false`,
    {
      "hibp-api-key": apiKey,
      "user-agent": "Trace-Digital-Footprint",
    },
    fetcher,
  );
  if (response.status === 404) return [];
  if (response.status === 429)
    throw new ProviderError("The breach provider is busy. Please try again later.");
  if (!response.ok) throw new ProviderError("Breach checks are temporarily unavailable.");
  const breaches: {
    Name: string;
    Title: string;
    Domain: string;
    BreachDate: string;
    DataClasses: string[];
  }[] = await response.json();
  return breaches
    .filter((breach) => validDomain(breach.Domain))
    .map((breach) => ({
      id: `breach-${breach.Name}`,
      ...describeDomain(breach.Domain),
      sources: ["breach"],
      evidence:
        "Have I Been Pwned reports this verified email in a known breach. This does not confirm an active account.",
      exposure: { title: breach.Title, date: breach.BreachDate, dataClasses: breach.DataClasses },
    }));
}

export async function discoverFootprint({
  email,
  googleToken,
  hibpKey,
  fetcher = fetch,
}: {
  email?: string;
  googleToken?: string | null;
  hibpKey?: string;
  fetcher?: Fetcher;
}): Promise<DiscoveryResult> {
  const sources: SourceStatus[] = [];
  const accounts: Account[] = [];
  await Promise.all([
    (async () => {
      if (!email || !googleToken) {
        sources.push({
          id: "mailbox",
          name: "Connected inbox",
          status: "not-connected",
          message:
            "Connect your verified Google inbox to discover possible accounts from up to 24 recent welcome or verification emails.",
        });
        return;
      }
      try {
        accounts.push(...(await scanMailbox(email, googleToken, fetcher)));
        sources.push({
          id: "mailbox",
          name: "Connected inbox",
          status: "complete",
          message:
            "Checked up to 24 matching welcome or verification emails. Older accounts may not appear.",
        });
      } catch (error) {
        sources.push({
          id: "mailbox",
          name: "Connected inbox",
          status: "error",
          message:
            error instanceof ProviderError
              ? error.message
              : "Your inbox could not be reached. Please try again.",
        });
      }
    })(),
    (async () => {
      if (!email || !hibpKey) {
        sources.push({
          id: "breach",
          name: "Breach monitoring",
          status: "unavailable",
          message: !email
            ? "Breach discovery currently supports verified email addresses. Phone numbers are not searched."
            : "Breach checks are not configured for this deployment.",
        });
        return;
      }
      try {
        accounts.push(...(await scanBreaches(email, hibpKey, fetcher)));
        sources.push({
          id: "breach",
          name: "Breach monitoring",
          status: "complete",
          message:
            "Checked your verified email against known breaches through Have I Been Pwned. No match does not guarantee no exposure.",
        });
      } catch (error) {
        sources.push({
          id: "breach",
          name: "Breach monitoring",
          status: "error",
          message:
            error instanceof ProviderError
              ? error.message
              : "The breach provider could not be reached. Please try again.",
        });
      }
    })(),
  ]);
  return {
    accounts: mergeAccounts(accounts),
    sources: sources.sort((a, b) => a.id.localeCompare(b.id)),
    scannedAt: new Date().toISOString(),
  };
}
