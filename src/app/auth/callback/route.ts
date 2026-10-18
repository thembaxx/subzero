import { NextResponse } from "next/server";
import { safeRedirectPath } from "@/lib/auth";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const client = await getServerClient();
  if (code && client) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error)
      return new NextResponse(null, {
        status: 303,
        headers: { Location: safeRedirectPath(url.searchParams.get("next")) },
      });
  }
  // Relative redirects preserve the public origin behind a reverse proxy.
  return new NextResponse(null, { status: 303, headers: { Location: "/?auth=expired" } });
}
