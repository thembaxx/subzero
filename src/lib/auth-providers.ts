/** Public flags from Supabase Auth settings, never an authorization check. */
export type AuthProviders = { email: boolean; phone: boolean; google: boolean };

export function parseAuthProviders(value: unknown): AuthProviders | null {
  if (!value || typeof value !== "object") return null;
  const external = (value as Record<string, unknown>).external;
  if (!external || typeof external !== "object") return null;
  const providers = external as Record<string, unknown>;
  return {
    email: providers.email === true,
    phone: providers.phone === true,
    google: providers.google === true,
  };
}
