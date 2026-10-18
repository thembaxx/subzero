import { test } from "node:test";
import assert from "node:assert/strict";
import { discoverFootprint, scanBreaches, scanMailbox } from "../src/lib/discovery";

function requestUrl(value: RequestInfo | URL) {
  return typeof value === "string" ? value : value instanceof URL ? value.href : value.url;
}

function json(value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status });
}

void test("mailbox discovery stops before reading messages if the identity differs", async () => {
  const calls: string[] = [];
  const fetcher: typeof fetch = async (url) => {
    calls.push(requestUrl(url));
    return json({ emailAddress: "someone-else@example.com" });
  };
  await assert.rejects(scanMailbox("owner@example.com", "test-token", fetcher), /must match/);
  assert.equal(calls.length, 1);
  assert.ok(calls[0].endsWith("/profile"));
});

void test("mailbox discovery requests sender metadata only and deduplicates domains", async () => {
  const urls: string[] = [];
  const fetcher: typeof fetch = async (url, options) => {
    const value = requestUrl(url);
    urls.push(value);
    assert.equal(options?.cache, "no-store");
    assert.equal(new Headers(options?.headers).get("Authorization"), "Bearer test-token");
    if (value.endsWith("/profile")) return json({ emailAddress: "OWNER@example.com" });
    if (value.includes("?maxResults=")) return json({ messages: [{ id: "one" }, { id: "two" }] });
    assert.ok(value.endsWith("?format=metadata&metadataHeaders=From"));
    return json({
      payload: { headers: [{ name: "From", value: "Spotify <welcome@mail.spotify.com>" }] },
      snippet: "PRIVATE_MESSAGE_BODY",
    });
  };
  const accounts = await scanMailbox("owner@example.com", "test-token", fetcher);
  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].domain, "spotify.com");
  assert.ok(!JSON.stringify(accounts).includes("PRIVATE_MESSAGE_BODY"));
  assert.ok(!JSON.stringify(accounts).includes("owner@example.com"));
  assert.equal(urls.length, 4);
});

void test("phone-only sessions do not trigger email or mailbox discovery", async () => {
  const fetcher: typeof fetch = async () => {
    throw new Error("Should never fetch");
  };
  const result = await discoverFootprint({ googleToken: "token", hibpKey: "key", fetcher });
  assert.deepEqual(result.accounts, []);
  assert.equal(result.sources.find((source) => source.id === "breach")?.status, "unavailable");
  assert.ok(
    result.sources.some((source) => source.message.includes("Phone numbers are not searched")),
  );
});

void test("missing credentials are distinct from a successful empty result", async () => {
  const result = await discoverFootprint({ email: "owner@example.com" });
  assert.ok(result.sources.every((source) => source.status !== "complete"));
  const empty = await scanBreaches(
    "owner@example.com",
    "key",
    async () => new Response(null, { status: 404 }),
  );
  assert.deepEqual(empty, []);
});

void test("breach rate limits become explicit source failures, never clean results", async () => {
  const result = await discoverFootprint({
    email: "owner@example.com",
    hibpKey: "not-a-real-key",
    fetcher: async () => json({}, 429),
  });
  const breach = result.sources.find((source) => source.id === "breach");
  assert.equal(breach?.status, "error");
  assert.match(breach?.message ?? "", /busy/);
  assert.ok(!JSON.stringify(result).includes("not-a-real-key"));
});

void test("breach responses discard descriptions and unsafe domains", async () => {
  const accounts = await scanBreaches("owner+tag@example.com", "key", async (url, options) => {
    assert.ok(requestUrl(url).includes("owner%2Btag%40example.com"));
    assert.equal(new Headers(options?.headers).get("hibp-api-key"), "key");
    return json([
      {
        Name: "Adobe",
        Title: "Adobe",
        Domain: "adobe.com",
        BreachDate: "2013-10-04",
        DataClasses: ["Email addresses"],
        Description: "<script>unsafe</script>",
      },
      {
        Name: "Invalid",
        Title: "Invalid",
        Domain: "javascript:alert(1)",
        BreachDate: "2020-01-01",
        DataClasses: [],
      },
    ]);
  });
  assert.equal(accounts.length, 1);
  assert.ok(!JSON.stringify(accounts).includes("<script>"));
});
