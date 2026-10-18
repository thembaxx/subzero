import { NextResponse } from "next/server";
import { parseAuthProviders } from "@/lib/auth-providers";

export const dynamic = "force-dynamic";

/** Expose only publicly documented auth-provider flags; never keys or secrets. */
export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const unavailable = () =>
    NextResponse.json(
      { providers: null },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  if (!url || !key) return unavailable();

  try {
    const endpoint = new URL("/auth/v1/settings", url);
    if (endpoint.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(endpoint.hostname)) {
      return unavailable();
    }
    const result = await fetch(endpoint, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!result.ok) return unavailable();
    const providers = parseAuthProviders(await result.json());
    if (!providers) return unavailable();
    // A provider can be enabled in Supabase while its Google OAuth client is invalid.
    // Keep it hidden when production explicitly marks OAuth setup as not ready.
    const available = {
      ...providers,
      google: providers.google && process.env.GOOGLE_OAUTH_READY !== "false",
    };
    return NextResponse.json({ providers: available }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return unavailable();
  }
}
