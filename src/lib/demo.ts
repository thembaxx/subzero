import { describeDomain } from "./accounts";
import type { Account } from "./types";

export const demoAccounts: Account[] = [
  "google.com",
  "spotify.com",
  "instagram.com",
  "notion.so",
  "amazon.com",
  "netflix.com",
  "figma.com",
  "dropbox.com",
  "linkedin.com",
  "adobe.com",
  "pinterest.com",
  "airbnb.com",
].map((domain) => ({
  id: `demo-${domain}`,
  ...describeDomain(domain),
  sources: domain === "adobe.com" || domain === "dropbox.com" ? ["mailbox", "breach"] : ["mailbox"],
  evidence: "A welcome email in the sample inbox suggests an account with this service.",
  ...(domain === "adobe.com"
    ? {
        exposure: {
          title: "Sample Adobe exposure",
          date: "2013-10-04",
          dataClasses: ["Email addresses", "Passwords", "Usernames"],
        },
      }
    : domain === "dropbox.com"
      ? {
          exposure: {
            title: "Sample Dropbox exposure",
            date: "2012-07-01",
            dataClasses: ["Email addresses", "Passwords"],
          },
        }
      : {}),
}));
