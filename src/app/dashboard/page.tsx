import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Dashboard } from "@/components/Dashboard";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Your digital footprint",
  robots: { index: false, follow: false },
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ demo?: string }>;
}) {
  const demo = (await searchParams).demo === "1";
  if (demo) return <Dashboard demo identity="alex@yourworld.com · sample" breachEnabled={false} />;
  const client = await getServerClient();
  if (!client) redirect("/?auth=required");
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user || (!user.email_confirmed_at && !user.phone_confirmed_at))
    redirect("/?auth=required");
  return (
    <Dashboard
      demo={false}
      identity={user.email || user.phone || "Your verified identity"}
      breachEnabled={Boolean(process.env.HIBP_API_KEY)}
    />
  );
}
