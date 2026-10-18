/** Translate Supabase Auth failures into helpful, non-sensitive user messages. */
export type AuthAction = "email" | "phone" | "verify" | "google";

const fallback: Record<AuthAction, string> = {
  email: "Couldn't send the sign-in link. Please try again.",
  phone: "Couldn't send the verification code. Please try again.",
  verify: "Couldn't verify that code. Please try again.",
  google: "Couldn't start Google sign-in. Please try again.",
};

export function authErrorMessage(error: unknown, action: AuthAction): string {
  const details = error && typeof error === "object" ? (error as Record<string, unknown>) : null;
  const rawCode = details?.code;
  // Preserve documented diagnostic codes, not arbitrary error messages or tokens.
  const code =
    typeof rawCode === "string" && /^[a-z][a-z0-9_]{2,63}$/.test(rawCode) ? rawCode : null;
  const status = typeof details?.status === "number" ? details.status : null;
  const message = typeof details?.message === "string" ? details.message : "";
  const withCode = (description: string) =>
    code ? description + " (Code: " + code + ")" : description;

  switch (code) {
    case "provider_disabled":
    case "oauth_provider_not_supported":
      return withCode(
        "Google sign-in isn't enabled for this app. The site owner needs to enable it in Supabase Authentication → Providers.",
      );
    case "email_provider_disabled":
    case "otp_disabled":
      return withCode(
        "Email magic-link sign-in is disabled. The site owner needs to enable it in Supabase Authentication.",
      );
    case "phone_provider_disabled":
      return withCode(
        "Phone sign-in is disabled. The site owner needs to enable it and configure an SMS provider in Supabase.",
      );
    case "email_address_not_authorized":
      return withCode(
        "This app's email service cannot send to that address. The site owner needs to configure a custom SMTP provider.",
      );
    case "email_address_invalid":
      return withCode("That email address isn't supported. Please enter a different address.");
    case "sms_send_failed":
      return withCode(
        "The SMS provider couldn't send your code. Please try again later or use email.",
      );
    case "over_email_send_rate_limit":
    case "over_sms_send_rate_limit":
    case "over_request_rate_limit":
      return withCode("Too many sign-in attempts. Please wait a few minutes before trying again.");
    case "otp_expired":
      return withCode("That verification code is invalid or has expired. Request a new code.");
    case "validation_failed":
      return withCode("Some sign-in details are invalid. Please check them and try again.");
    case "signup_disabled":
      return withCode("New account registration is currently disabled for this app.");
    case "bad_code_verifier":
    case "bad_oauth_callback":
    case "bad_oauth_state":
    case "flow_state_expired":
    case "flow_state_not_found":
      return withCode(
        "Your sign-in session could not be completed. Please restart sign-in in the same browser.",
      );
    case "request_timeout":
    case "unexpected_failure":
      return withCode(
        "The authentication service is temporarily unavailable. Please try again shortly.",
      );
  }

  if (status === 429)
    return "Too many sign-in attempts. Please wait a few minutes before trying again.";
  if (status !== null && status >= 500)
    return "The authentication service is currently unavailable. Please try again later.";
  if (
    error instanceof TypeError ||
    /^(failed to fetch|networkerror when attempting to fetch a resource\.?|load failed)$/i.test(
      message,
    )
  ) {
    return "Couldn't reach the authentication service. Check your connection and try again.";
  }
  // Unexpected Supabase codes remain visible; untrusted raw error messages do not.
  if (code) return fallback[action] + " (Supabase error: " + code + ")";
  return fallback[action];
}
