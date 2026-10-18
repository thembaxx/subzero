import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

export const metadata: Metadata = { title: "Terms of use" };

export default function Terms() {
  return (
    <main className="legal-page">
      <header className="legal-header container">
        <Logo />
        <ThemeToggle />
      </header>
      <article className="legal-content">
        <span className="eyebrow">A few shared expectations</span>
        <h1>
          A little clarity,
          <br />
          on clear terms.
        </h1>
        <p>
          Trace is a personal digital-footprint tool. By using it, you agree to use only identities,
          inboxes, and account lists that you own or are authorized to manage.
        </p>
        <h2>Your information, your access.</h2>
        <p>
          Verify ownership before performing a real lookup. Do not bypass authentication, attempt to
          search for someone else, abuse verification delivery, or misuse a connected provider. You
          are responsible for your sign-in links, one-time codes, exported reports, and the actions
          you take with third-party services.
        </p>
        <h2>Evidence has its limits.</h2>
        <p>
          Inbox messages suggest possible accounts. Imported records come from files you provide.
          Known breach records describe historical exposure. Results may be incomplete or outdated;
          they do not guarantee an active account, a current breach, or the absence of other
          exposure.
        </p>
        <h2>You stay in control.</h2>
        <p>
          Trace does not delete third-party accounts, change passwords, or send data-removal
          requests. Links take you to the service so you can decide what to do. Inbox access is
          optional and can be revoked through Google. Read the{" "}
          <Link href="/privacy">privacy policy</Link> before connecting data sources.
        </p>
        <h2>Availability depends on connections.</h2>
        <p>
          Real authentication and discovery require configured external providers. Providers may
          restrict access, return errors, or change availability. Features and data coverage can
          change. The demo contains sample data and makes no claim about your personal footprint.
        </p>
        <Link href="/" className="button button-outline">
          <ArrowLeft size={16} />
          Back to Trace
        </Link>
      </article>
    </main>
  );
}
