import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "Your privacy" };

export default function Privacy() {
  return (
    <main className="legal-page">
      <header className="legal-header container">
        <Logo />
        <ThemeToggle />
      </header>
      <article className="legal-content">
        <span className="eyebrow">Private. By nature.</span>
        <h1>
          Your identity.
          <br />
          Your eyes only.
        </h1>
        <p>
          Trace helps you understand your own digital footprint. This page explains what the app
          processes, what leaves your browser, and the limits of each connection.
        </p>
        <h2>It starts with ownership.</h2>
        <p>
          Real lookups require an authenticated session with a verified email address or phone
          number. Supabase handles identity verification, sign-in delivery, and session cookies. A
          phone verification does not unlock a lookup of someone else’s email address.
        </p>
        <h2>Connections are your choice.</h2>
        <p>
          Basic Google sign-in verifies identity. Inbox discovery requires a separate Google consent
          for read-only mailbox access. Trace checks that the inbox matches your verified email,
          searches for welcome or verification emails, and requests sender metadata from up to 24
          matching messages. It does not fetch message bodies, send email, or delete messages.
        </p>
        <p>
          Google’s permission covers read access to your mailbox. The app uses that permission only
          for the discovery described above. You can remove access in{" "}
          <a
            href="https://myaccount.google.com/connections"
            target="_blank"
            rel="noopener noreferrer"
          >
            your Google Account connections
          </a>
          . Expired provider tokens require reconnection.
        </p>
        <h2>Breach records tell part of the story.</h2>
        <p>
          When the deployment has a Have I Been Pwned API key, your verified email address is sent
          to that provider to check known breach records. Results can include affected services,
          breach dates, and data categories. A historic breach does not confirm an active account,
          and no match does not guarantee your information has never been exposed. Phone breach
          discovery is not supported.
        </p>
        <h2>Your CSV stays close.</h2>
        <p>
          CSV imports are processed in this browser. Trace extracts website domains and discards
          password, username, and note fields. The file is never uploaded. Imported results and
          review marks remain in the current page session and disappear when the page is reloaded.
        </p>
        <h2>A little less to keep.</h2>
        <p>
          This app does not write scan results to an application database. Results remain in memory
          for the current visit. Signing in uses Supabase session cookies; your theme preference is
          stored locally. The service worker caches only the public offline page and icons, never
          dashboard, authentication, or API responses.
        </p>
        <p>
          External data providers and the hosting service process requests under their own privacy
          policies. The app includes no advertising, analytics, or tracking scripts. Downloading a
          report creates a file on your device, which you control.
        </p>
        <h2>The demo is a demo.</h2>
        <p>
          The demo uses clearly labeled sample accounts and exposures. It performs no personal
          lookup. Local CSV imports in the demo still stay in your browser.
        </p>
        <Link href="/" className="button button-outline">
          <ArrowLeft size={16} />
          Back to Trace
        </Link>
        <Link href="/dashboard?demo=1" className="button button-link">
          Have a look around
          <ArrowUpRight size={16} />
        </Link>
      </article>
    </main>
  );
}
