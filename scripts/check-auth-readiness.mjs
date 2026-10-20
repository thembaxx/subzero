import { mkdir, writeFile, appendFile } from "node:fs/promises";

const base = new URL(process.env.PRODUCTION_URL || "https://subzero-five.vercel.app/");
if (base.protocol !== "https:" || base.username || base.password || base.pathname !== "/" || base.search || base.hash) {
  throw Error("Production URL must be a credential-free HTTPS origin");
}
const url = new URL("/api/auth/providers", base);
const result = { checkedAt: new Date().toISOString(), url: url.href, status: "unavailable", httpStatus: null, providers: null, errors: [] };
try {
  const response = await fetch(url, { redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(15000) });
  result.httpStatus = response.status;
  if (response.status === 503) throw Error("Supabase provider configuration unavailable (HTTP 503)");
  if (!response.ok || !response.headers.get("content-type")?.includes("application/json")) {
    throw Error("Auth endpoint returned HTTP " + response.status + " or non-JSON");
  }
  const body = await response.json();
  const p = body?.providers;
  if (!p || ["email","phone","google"].some(k => typeof p[k] !== "boolean")) throw Error("Invalid provider readiness payload");
  result.providers = { email: p.email, phone: p.phone, google: p.google };
  if (!Object.values(result.providers).some(Boolean)) throw Error("No sign-in providers available");
  result.status = "ready";
} catch (error) {
  result.errors.push(String(error.message).slice(0,160));
}
await mkdir("reports", {recursive: true});
await writeFile("reports/auth-readiness.json",JSON.stringify(result,null,2)+"\n");
const summary = ["## Trace authentication provider readiness","",
  "- Status: " + result.status,
  "- HTTP: " + (result.httpStatus ?? "unavailable"),
  "- Email: " + (result.providers?.email ?? "unknown"),
  "- Phone: " + (result.providers?.phone ?? "unknown"),
  "- Google: " + (result.providers?.google ?? "unknown"),
  ...result.errors.map(e=>"- Error: "+e),
  "",
  "This verifies public provider readiness flags, not completed OAuth, OTP or login.",
].join("\n");
console.log(summary);
if(process.env.GITHUB_STEP_SUMMARY)await appendFile(process.env.GITHUB_STEP_SUMMARY,summary+"\n");
if(result.errors.length)process.exitCode=1;
