import assert from "node:assert/strict";
import test from "node:test";
import { authErrorMessage } from "../src/lib/auth-errors";

test("explains disabled Google OAuth with its actual Supabase error code", () => {
  const message = authErrorMessage(
    {
      code: "oauth_provider_not_supported",
      status: 400,
      message: "Unsupported provider: provider is not enabled",
    },
    "google",
  );
  assert.match(message, /Google sign-in isn't enabled/);
  assert.match(message, /Supabase Authentication/);
  assert.match(message, /oauth_provider_not_supported/);
});

test("explains other provider-disabled errors", () => {
  assert.match(authErrorMessage({ code: "provider_disabled" }, "google"), /enable it/);
  assert.match(authErrorMessage({ code: "email_provider_disabled" }, "email"), /Email magic-link/);
  assert.match(authErrorMessage({ code: "phone_provider_disabled" }, "phone"), /SMS provider/);
  assert.match(authErrorMessage({ code: "otp_disabled" }, "email"), /disabled/);
});

test("explains email and SMS delivery problems", () => {
  assert.match(authErrorMessage({ code: "email_address_not_authorized" }, "email"), /custom SMTP/);
  assert.match(authErrorMessage({ code: "sms_send_failed" }, "phone"), /SMS provider/);
  assert.match(authErrorMessage({ code: "email_address_invalid" }, "email"), /different address/);
});

test("explains rate limits by code and HTTP status", () => {
  for (const code of [
    "over_email_send_rate_limit",
    "over_sms_send_rate_limit",
    "over_request_rate_limit",
  ]) {
    assert.match(authErrorMessage({ code }, "email"), /wait a few minutes/);
  }
  assert.match(authErrorMessage({ status: 429 }, "phone"), /wait a few minutes/);
});

test("explains expired OTP and OAuth state errors", () => {
  assert.match(authErrorMessage({ code: "otp_expired" }, "verify"), /Request a new code/);
  assert.match(authErrorMessage({ code: "flow_state_expired" }, "google"), /restart sign-in/);
});

test("handles network and server failures", () => {
  assert.match(
    authErrorMessage(new TypeError("Failed to fetch"), "email"),
    /Check your connection/,
  );
  assert.match(authErrorMessage({ status: 503 }, "google"), /service is currently unavailable/);
  assert.match(authErrorMessage({ code: "request_timeout" }, "phone"), /temporarily unavailable/);
});

test("preserves unknown safe error codes without leaking raw provider messages", () => {
  const secret = "https://example.com/?token=SECRET&email=private@example.com";
  const message = authErrorMessage({ code: "future_auth_error", message: secret }, "email");
  assert.match(message, /future_auth_error/);
  assert.doesNotMatch(message, /SECRET|private@example|example\.com/);
  assert.doesNotMatch(
    authErrorMessage({ code: "unsafe:code", message: secret }, "email"),
    /SECRET|unsafe:code/,
  );
});

test("handles unexpected thrown values without exposing them", () => {
  assert.match(authErrorMessage("some secret value", "google"), /Couldn't start Google sign-in/);
  assert.match(authErrorMessage(null, "verify"), /Couldn't verify that code/);
});
