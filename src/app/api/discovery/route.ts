import { NextResponse } from "next/server";
import { discoverFootprint } from "@/lib/discovery";
import { getServerClient } from "@/lib/supabase/server";

export const maxDuration = 60;

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  const protocol =
    request.headers.get("x-forwarded-proto") ?? new URL(request.url).protocol.replace(":", "");
  const host = request.headers.get("host") ?? new URL(request.url).host;
  if (origin && origin !== `${protocol}://${host}`) {
    return NextResponse.json({ error: "This request must come from Trace." }, { status: 403 });
  }
  const client = await getServerClient();
  if (!client)
    return NextResponse.json({ error: "Sign-in is not configured yet." }, { status: 503 });
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user || (!user.email_confirmed_at && !user.phone_confirmed_at)) {
    return NextResponse.json(
      { error: "Verify your email or phone before starting a scan." },
      { status: 401 },
    );
  }
  // The identity always comes from the verified server session, never request input.
  const {
    data: { session },
  } = await client.auth.getSession();
  const result = await discoverFootprint({
    email: user.email_confirmed_at ? user.email : undefined,
    googleToken: session?.provider_token,
    hibpKey: process.env.HIBP_API_KEY,
  });
  return NextResponse.json(result, { headers: { "Cache-Control": "no-store, private" } });
}
