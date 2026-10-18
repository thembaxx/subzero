import assert from "node:assert/strict";
import test from "node:test";
import { parseAuthProviders } from "../src/lib/auth-providers";

void test("reads only public provider flags", () => {
  const settings = {
    external: { email: true, phone: false, google: false, github: true },
    secret: "not-exposed",
  };
  const providers = parseAuthProviders(settings);
  assert.deepEqual(providers, { email: true, phone: false, google: false });

  const allEnabled = parseAuthProviders({
    external: { email: true, phone: true, google: true },
  });
  assert.deepEqual(allEnabled, { email: true, phone: true, google: true });
});

void test("malformed settings never imply that providers are enabled", () => {
  assert.equal(parseAuthProviders(null), null);
  assert.equal(parseAuthProviders({}), null);
  assert.equal(parseAuthProviders({ external: null }), null);
  const malformed = parseAuthProviders({ external: { email: "true", phone: 1 } });
  assert.deepEqual(malformed, { email: false, phone: false, google: false });
});
