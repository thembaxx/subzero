import { test } from "node:test";
import assert from "node:assert/strict";
import { importAccounts } from "../src/lib/csv";
import { safeRedirectPath } from "../src/lib/auth";
import { mergeAccounts } from "../src/lib/accounts";

void test("CSV import extracts domains and discards credentials, notes, and passwords", () => {
  const csv =
    'name,url,username,password,notes\r\n"An app, with a comma",https://accounts.google.com/login,private@example.com,SECRET_PASSWORD,"private notes"\r\nSpotify,https://spotify.com/account,person,OTHER_SECRET,"a\nmultiline note"';
  const accounts = importAccounts(csv);
  assert.equal(accounts.length, 2);
  assert.deepEqual(
    accounts.map((account) => account.domain),
    ["google.com", "spotify.com"],
  );
  const serialized = JSON.stringify(accounts);
  for (const secret of [
    "private@example.com",
    "SECRET_PASSWORD",
    "OTHER_SECRET",
    "private notes",
    "multiline",
  ])
    assert.ok(!serialized.includes(secret));
});

void test("CSV import handles BOM, quoted fields, and duplicate websites", () => {
  const accounts = importAccounts(
    '\uFEFFname,login_uri,password\n"A \\"name\\"",https://www.notion.so/a,x\nN,https://notion.so/b,y',
  );
  assert.equal(accounts.length, 1);
  assert.equal(accounts[0].domain, "notion.so");
});

void test("CSV import rejects unsafe protocols and skips invalid or private hosts", () => {
  const accounts = importAccounts(
    "url\njavascript:alert(1)\nhttp://localhost\nhttp://192.168.0.1\nhttps://github.com/user\nhttps://user:secret@spotify.com/path",
  );
  assert.deepEqual(
    accounts.map((account) => account.domain),
    ["github.com", "spotify.com"],
  );
  assert.ok(!JSON.stringify(accounts).includes("secret"));
});

void test("CSV import reports unsupported files and bounds work", () => {
  assert.throws(() => importAccounts("username,password\nu,p"), /URL|url/);
  assert.throws(() => importAccounts('url\n"https://example.com'), /unclosed/);
  assert.throws(() => importAccounts("x".repeat(2_000_001)), /2 MB/);
  assert.throws(() => importAccounts("url\n" + "https://example.com\n".repeat(1002)), /1,000/);
  assert.throws(() => importAccounts("url\nnot a website"), /No valid/);
});

void test("OAuth redirect paths cannot leave the authenticated dashboard", () => {
  for (const input of [
    null,
    "https://evil.test",
    "//evil.test",
    "/dashboardevil",
    "/dashboard/../auth",
    "/\\evil.test",
  ])
    assert.equal(safeRedirectPath(input), "/dashboard");
  assert.equal(safeRedirectPath("/dashboard?scan=1"), "/dashboard?scan=1");
});

void test("merging an imported account preserves its exposure and source evidence", () => {
  const [account] = importAccounts("url\nhttps://adobe.com");
  const merged = mergeAccounts([
    {
      ...account,
      sources: ["breach"],
      exposure: { title: "Known exposure", date: "2013-10-04", dataClasses: ["Email addresses"] },
    },
    account,
  ]);
  assert.equal(merged.length, 1);
  assert.deepEqual(merged[0].sources, ["breach", "import"]);
  assert.equal(merged[0].exposure?.title, "Known exposure");
});
