export function safeRedirectPath(value: string | null): string {
  // Keep OAuth redirects inside the authenticated app, including its optional query.
  if (value === "/dashboard" || value?.startsWith("/dashboard?")) return value;
  return "/dashboard";
}
