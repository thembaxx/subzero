import assert from "node:assert/strict";
import test from "node:test";
import { parseAuthProviders } from "../src/lib/auth-providers";

void test("reads only public provider flags", () => {
  assert.deepEqual(
    parseAuthProviders({
      external: { email: true, phone: false, google: false, github: true },
      secret: "not-exposed",
    }),
    { email: true, phone: false, google: false },
  );
  assert.deepEqual(
    parseAuthProviders({ external: { email: true, phone: true, google: true } }),
    { email: true, phone: true, google: true },
  );
});

void test("malformed settings never imply that providers are enabled", () => {
  assert.equal(parseAuthProviders(null), null);
  assert.equal(parseAuthProviders({}), null);
  assert.equal(parseAuthProviders({ external: null }), null);
  assert.deepEqual(
    parseAuthProviders({ external: { email: "true", phone: 1 } }),
    { email: false, phone: false, google: false },
  );
});
