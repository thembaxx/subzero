"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  CircleAlert,
  CircleHelp,
  Download,
  Fingerprint,
  Grid2X2,
  Inbox,
  Layers,
  LoaderCircle,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { Logo, TraceMark } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { AccountTable } from "./AccountTable";
import { AccountDetail } from "./AccountDetail";
import {
  createReviewRecord,
  readReviewHistory,
  reviewStorageKey,
  serializeReviewHistory,
  upsertReview,
  type ReviewRecord,
} from "@/lib/review-history";
import { DashboardSources } from "./DashboardSources";
import { Dialog } from "./Dialog";
import { AuthDialog } from "./AuthDialog";
import { demoAccounts } from "@/lib/demo";
import { importAccounts } from "@/lib/csv";
import { mergeAccounts } from "@/lib/accounts";
import { getBrowserClient } from "@/lib/supabase/client";
import type { Account, DiscoveryResult, SourceStatus } from "@/lib/types";

type View = "overview" | "accounts" | "exposures" | "sources";
const navigation = [
  { id: "overview", label: "Overview", icon: Grid2X2 },
  { id: "accounts", label: "Your accounts", icon: Layers },
  { id: "exposures", label: "Data exposures", icon: ShieldCheck },
  { id: "sources", label: "Connections", icon: Inbox },
] as const;
const guides = {
  passwords: {
    title: "Give your passwords a fresh start.",
    text: "Start with any service linked to a known exposure. Visit the service directly, choose a unique password, and save it in a trusted password manager. If you reused that password elsewhere, update those accounts too.",
  },
  unused: {
    title: "Make a little space.",
    text: "See a service you no longer use? Visit it directly, check whether you still have an account, download anything you want to keep, then follow its account-deletion process. Trace does not close accounts for you.",
  },
  security: {
    title: "Add one more layer of you.",
    text: "Open the security settings of the accounts you keep. Turn on two-factor authentication using a passkey, security key, or authenticator app where possible. Store recovery codes somewhere safe.",
  },
  help: {
    title: "A little context goes a long way.",
    text: "Inbox results are clues from welcome or verification emails, not confirmation of an active account. Breach results come from historic public breach records. Imported accounts come from a CSV you own. Trace cannot see every account on the internet, and an empty result does not mean no data exists.",
  },
};

export function Dashboard({
  demo,
  identity,
  breachEnabled,
}: {
  demo: boolean;
  identity: string;
  breachEnabled: boolean;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [view, setView] = useState<View>("overview");
  const [accounts, setAccounts] = useState<Account[]>(demo ? demoAccounts : []);
  const [sources, setSources] = useState<SourceStatus[]>(
    demo
      ? [
          {
            id: "mailbox",
            name: "Connected inbox",
            status: "complete",
            message: "Sample inbox evidence, for a look around the demo.",
          },
          {
            id: "breach",
            name: "Known breaches",
            status: "complete",
            message: "Sample historic exposures. No personal lookup has been performed.",
          },
        ]
      : [],
  );
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [historyKey, setHistoryKey] = useState("");
  const [historyError, setHistoryError] = useState("");
  const [historyRaw, setHistoryRaw] = useState<string | null>(null);
  const reviewed = new Set(
    accounts
      .filter((account) => reviews.some((review) => review.domain === account.domain.toLowerCase()))
      .map((account) => account.id),
  );
  useEffect(() => {
    let active = true;
    setHistoryKey("");
    setReviews([]);
    setHistoryError("");
    setHistoryRaw(null);
    void reviewStorageKey(identity, demo)
      .then((key) => {
        if (!active) return;
        let raw: string | null = null;
        try {
          raw = localStorage.getItem(key);
          const records = readReviewHistory(raw);
          setReviews(records);
          setHistoryKey(key);
        } catch {
          setHistoryRaw(raw);
          setHistoryError(
            "Saved reviews could not be loaded. The original is preserved. Export it before clearing this device’s history.",
          );
          setHistoryKey(key);
        }
      })
      .catch(() => {
        if (active)
          setHistoryError(
            "Review storage is unavailable. Export your report to retain your records.",
          );
      });
    return () => {
      active = false;
    };
  }, [identity, demo]);
  const [selected, setSelected] = useState<Account | null>(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [auth, setAuth] = useState(false);
  const [guide, setGuide] = useState<keyof typeof guides | null>(null);
  const [connectDialog, setConnectDialog] = useState(false);
  const exposures = accounts.filter((account) => account.exposure);
  const reviewedCount = accounts.filter((account) => reviewed.has(account.id)).length;
  const activeLabel = navigation.find((item) => item.id === view)?.label;

  async function scan() {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      if (demo) {
        setAccounts((previous) =>
          mergeAccounts([
            ...demoAccounts,
            ...previous.filter((account) => account.sources.includes("import")),
          ]),
        );
        setNotice("Sample data refreshed. No personal lookup was performed.");
      } else {
        const response = await fetch("/api/discovery", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
        });
        const result = (await response.json()) as DiscoveryResult & { error?: string };
        if (!response.ok)
          throw new Error(result.error ?? "The scan could not be completed. Please try again.");
        setAccounts((previous) =>
          mergeAccounts([
            ...result.accounts,
            ...previous.filter((account) => account.sources.includes("import")),
          ]),
        );
        setSources(result.sources);
        const complete = result.sources.filter((source) => source.status === "complete").length;
        setNotice(
          complete
            ? `Checked ${complete} connected ${complete === 1 ? "source" : "sources"}. Review each source for coverage and any limits.`
            : "No sources could be checked. Open Connections to see what’s needed.",
        );
      }
    } catch (scanError) {
      setError(
        scanError instanceof Error
          ? scanError.message
          : "We couldn’t reach your sources. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function importFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    setNotice("");
    try {
      if (file.size > 2_000_000) throw new Error("Choose a CSV smaller than 2 MB.");
      const imported = importAccounts(await file.text());
      setAccounts((previous) => mergeAccounts([...previous, ...imported]));
      setNotice(
        `Imported ${imported.length} website ${imported.length === 1 ? "domain" : "domains"}. Your file stayed in this browser; passwords and other fields were discarded.`,
      );
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : "That CSV could not be read.");
    } finally {
      event.target.value = "";
    }
  }

  async function connectGoogle() {
    if (demo) {
      setConnectDialog(false);
      setAuth(true);
      return;
    }
    const client = getBrowserClient();
    if (!client) {
      setError("Google sign-in is not configured for this deployment.");
      setConnectDialog(false);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const { error: oauthError } = await client.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: "https://www.googleapis.com/auth/gmail.readonly",
          queryParams: { access_type: "offline", prompt: "consent" },
        },
      });
      if (oauthError) throw oauthError;
    } catch {
      setError("Google could not be connected. Please try again.");
      setBusy(false);
      setConnectDialog(false);
    }
  }

  function download() {
    const report = {
      name: "Trace footprint report",
      demo,
      exportedAt: new Date().toISOString(),
      accounts: accounts.map((account) => ({ ...account, reviewed: reviewed.has(account.id) })),
      sources,
      reviews,
      unreadableReviewHistory: historyRaw,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "trace-footprint.json";
    link.click();
    URL.revokeObjectURL(url);
    setNotice("Your report was downloaded to this device.");
  }

  async function signOut() {
    if (!demo) {
      const result = await getBrowserClient()?.auth.signOut();
      if (result?.error) {
        setError("Sign-out couldn’t be completed. Please try again.");
        return;
      }
    }
    setAccounts([]);
    setReviews([]);
    router.push("/");
    router.refresh();
  }

  function navItems() {
    return navigation.map((item) => (
      <button
        key={item.id}
        className={`app-nav-item${view === item.id ? " active" : ""}`}
        aria-current={view === item.id ? "page" : undefined}
        onClick={() => setView(item.id)}
      >
        <item.icon size={18} strokeWidth={1.65} />
        <span>{item.label}</span>
        {item.id === "exposures" && exposures.length > 0 && (
          <span className="nav-count">{exposures.length}</span>
        )}
      </button>
    ));
  }

  return (
    <div className="dashboard-shell">
      <a className="skip-link" href="#dashboard-content">
        Skip to dashboard
      </a>
      <aside className="app-sidebar">
        <Logo />
        <span className="sidebar-caption">Your little corner of clarity</span>
        <nav aria-label="Dashboard">{navItems()}</nav>
        <div className="sidebar-note">
          <TraceMark />
          <strong>A little less scattered.</strong>
          <p>A little more in your hands.</p>
          <Link href="/privacy">
            Private by nature
            <ArrowUpRight size={13} />
          </Link>
        </div>
        <button className="sidebar-exit" onClick={() => void signOut()}>
          <LogOut size={17} />
          {demo ? "Leave the demo" : "Sign out"}
        </button>
        <div className="sidebar-bottom">
          <span className="small-dot" />
          Only you can trace you.
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <div className="mobile-app-logo">
            <Logo />
          </div>
          <div className="app-breadcrumb">
            Your space
            <ChevronRight size={13} />
            <span>{activeLabel}</span>
          </div>
          <div className="app-topbar-actions">
            <button
              className="icon-button"
              aria-label="Help with your footprint"
              onClick={() => setGuide("help")}
            >
              <CircleHelp size={18} />
            </button>
            <ThemeToggle />
            <div className="profile-chip">
              <span>{demo ? "a" : identity.charAt(0).toUpperCase()}</span>
              <div>
                <strong>{demo ? "A look around" : "Your personal space"}</strong>
                <small>{identity}</small>
              </div>
            </div>
            <button
              className="icon-button mobile-signout"
              aria-label={demo ? "Leave demo" : "Sign out"}
              onClick={() => void signOut()}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <nav className="mobile-app-nav" aria-label="Mobile dashboard">
          {navItems()}
        </nav>
        <main className="app-content" id="dashboard-content">
          {demo && (
            <div className="demo-banner">
              <span>
                <Sparkles size={16} />
                <strong>A little preview.</strong> You’re exploring sample accounts and exposures.
              </span>
              <button onClick={() => setAuth(true)}>
                Make it yours
                <ArrowUpRight size={14} />
              </button>
            </div>
          )}
          <div className="dashboard-heading">
            <div>
              <span className="eyebrow">Your digital footprint</span>
              <h1>
                {view === "overview"
                  ? "A clearer picture of you."
                  : view === "accounts"
                    ? "All your little corners."
                    : view === "exposures"
                      ? "A little knowledge helps."
                      : "Your sources. Your choice."}
              </h1>
              <p>
                {view === "overview"
                  ? "Your digital life, a little less scattered."
                  : view === "accounts"
                    ? "Discover, review, and make room for what matters."
                    : view === "exposures"
                      ? "Understand the evidence, then take your next step."
                      : "Bring the pieces together, on your terms."}
              </p>
            </div>
            <div className="dashboard-heading-actions">
              {accounts.length > 0 && (
                <button className="button button-outline export-button" onClick={download}>
                  <Download size={16} />
                  Export report
                </button>
              )}
              <button className="button button-dark" onClick={() => void scan()} disabled={busy}>
                {busy ? <LoaderCircle className="spin" size={16} /> : <RefreshCw size={15} />}
                {busy ? "Checking sources…" : demo ? "Refresh demo" : "Run a scan"}
              </button>
            </div>
          </div>
          {historyError && (
            <p role="alert" className="app-notice notice-error">
              {historyError}
            </p>
          )}
          {historyKey && (
            <p className="app-notice">
              Reviews are saved only on this browser for this {demo ? "demo" : "account"}. Export
              the footprint report to keep a copy.{" "}
              <button
                className="button button-outline"
                onClick={() => {
                  if (
                    !confirm(
                      "Clear review history for this account on this browser? Export your report first to keep a copy.",
                    )
                  )
                    return;
                  try {
                    localStorage.removeItem(historyKey);
                    setReviews([]);
                    setHistoryRaw(null);
                    setHistoryError("");
                    setNotice("This account’s review history was cleared from this browser.");
                  } catch {
                    setHistoryError(
                      "Review history could not be cleared. Try your browser’s site-data settings.",
                    );
                  }
                }}
              >
                Clear device reviews
              </button>
            </p>
          )}
          {(notice || error) && (
            <div
              className={`app-notice ${error ? "notice-error" : ""}`}
              role={error ? "alert" : "status"}
            >
              {error ? <CircleAlert size={17} /> : <Check size={17} />}
              <span>{error || notice}</span>
              <button
                className="icon-button"
                aria-label="Dismiss notification"
                onClick={() => {
                  setNotice("");
                  setError("");
                }}
              >
                <X size={15} />
              </button>
            </div>
          )}
          {view === "overview" && (
            <>
              <div className="stats-grid">
                <div className="stat-card stat-primary">
                  <div className="stat-top">
                    <span>Your digital footprint</span>
                    <Fingerprint size={22} strokeWidth={1.4} />
                  </div>
                  <div className="stat-value">
                    {String(accounts.length).padStart(2, "0")}
                    <span>possible accounts</span>
                  </div>
                  <div className="stat-bottom">
                    <span className="small-dot" />
                    {demo ? "A sample of the bigger picture" : "From the sources you choose"}
                    <ArrowUpRight size={16} />
                  </div>
                </div>
                <button className="stat-card" onClick={() => setView("exposures")}>
                  <div className="stat-top">
                    <span>A little extra attention</span>
                    <ShieldCheck size={22} strokeWidth={1.4} />
                  </div>
                  <div className="stat-value">
                    {String(exposures.length).padStart(2, "0")}
                    <span>known exposures</span>
                  </div>
                  <div className="stat-bottom">
                    <span className="attention-dot" />
                    {exposures.length
                      ? "A good place to start"
                      : "Results depend on source coverage"}
                    <ArrowUpRight size={16} />
                  </div>
                </button>
                <div className="stat-card">
                  <div className="stat-top">
                    <span>One step at a time</span>
                    <Check size={22} strokeWidth={1.4} />
                  </div>
                  <div className="stat-value">
                    {String(reviewedCount).padStart(2, "0")}
                    <span>accounts reviewed</span>
                  </div>
                  <div className="stat-bottom">
                    <div className="review-progress">
                      <span
                        style={{
                          width: `${accounts.length ? (reviewedCount / accounts.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <span>
                      {accounts.length ? Math.round((reviewedCount / accounts.length) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="overview-grid">
                <AccountTable
                  accounts={accounts}
                  reviewed={reviewed}
                  onSelect={setSelected}
                  compact
                  onViewAll={() => setView("accounts")}
                />
                <aside className="dashboard-aside">
                  <div className="housekeeping-card">
                    <span className="housekeeping-icon">
                      <Sparkles size={20} strokeWidth={1.5} />
                    </span>
                    <h2>A little housekeeping.</h2>
                    <p>
                      Small steps make a real difference.
                      <br />
                      Here are a few places to start.
                    </p>
                    {(
                      [
                        [
                          "passwords",
                          "Freshen up your passwords",
                          "Make every one a little more unique.",
                        ],
                        [
                          "unused",
                          "Let go of what you don’t use",
                          "A little less clutter feels good.",
                        ],
                        ["security", "Add an extra layer", "Two-factor is twice as reassuring."],
                      ] as const
                    ).map(([key, title, subtitle]) => (
                      <button key={key} className="housekeeping-step" onClick={() => setGuide(key)}>
                        <span>
                          <Check size={12} />
                        </span>
                        <div>
                          <strong>{title}</strong>
                          <small>{subtitle}</small>
                        </div>
                        <ChevronRight size={15} />
                      </button>
                    ))}
                  </div>
                  <div className="connection-card">
                    <span className="connection-dot" />
                    <strong>More dots, more clarity.</strong>
                    <p>Connect an inbox or import your own account list.</p>
                    <button className="text-button" onClick={() => setView("sources")}>
                      Manage connections
                      <ArrowRight size={15} />
                    </button>
                  </div>
                </aside>
              </div>
            </>
          )}
          {(view === "accounts" || view === "exposures") && (
            <AccountTable
              key={view}
              accounts={accounts}
              reviewed={reviewed}
              onSelect={setSelected}
              exposureOnly={view === "exposures"}
            />
          )}
          {view === "sources" && (
            <DashboardSources
              sources={sources}
              onConnect={() => setConnectDialog(true)}
              onImport={() => fileInput.current?.click()}
              breachEnabled={breachEnabled}
              demo={demo}
            />
          )}
          {view !== "sources" && (
            <div className="dashboard-bottom-note">
              <span>
                <ShieldCheck size={15} />
                Scan results stay in this visit. Saved reviews remain on this browser until you
                clear them.
              </span>
              <button className="text-button" onClick={() => fileInput.current?.click()}>
                <Plus size={14} />
                Import your account list
              </button>
            </div>
          )}
        </main>
        <footer className="app-footer">
          <span>Leave less to wonder.</span>
          <Link href="/privacy">
            Your privacy
            <ArrowUpRight size={12} />
          </Link>
        </footer>
      </div>
      <input
        ref={fileInput}
        type="file"
        accept=".csv,text/csv"
        className="sr-only"
        aria-label="Import account CSV"
        onChange={(event) => void importFile(event)}
      />
      {selected && (
        <AccountDetail
          account={selected}
          key={selected.domain}
          review={reviews.find((review) => review.domain === selected.domain.toLowerCase())}
          onSaveReview={(input) => {
            if (!historyKey || historyError)
              throw new Error(
                "Review storage is unavailable. Export the report and resolve the storage warning before saving.",
              );
            try {
              const next = upsertReview(
                readReviewHistory(localStorage.getItem(historyKey)),
                createReviewRecord(input),
              );
              localStorage.setItem(historyKey, serializeReviewHistory(next));
              setReviews(next);
              setNotice(`${selected.name} review and next step saved on this browser.`);
              setSelected(null);
            } catch (cause) {
              throw new Error(
                cause instanceof Error
                  ? cause.message
                  : "Review could not be saved. Try exporting your report.",
              );
            }
          }}
          onClose={() => setSelected(null)}
        />
      )}
      {guide && (
        <Dialog label={guides[guide].title} onClose={() => setGuide(null)} className="guide-dialog">
          <span className="guide-icon">
            <Sparkles size={28} />
          </span>
          <h2>{guides[guide].title}</h2>
          <p>{guides[guide].text}</p>
          <button className="button button-primary" onClick={() => setGuide(null)}>
            A little clearer
            <Check size={16} />
          </button>
        </Dialog>
      )}
      {connectDialog && (
        <Dialog
          label="Connect your Google inbox"
          onClose={() => setConnectDialog(false)}
          className="guide-dialog"
        >
          <span className="guide-icon">
            <Inbox size={28} />
          </span>
          <h2>A connection you choose.</h2>
          <p>
            Google will ask for read-only mailbox permission. Trace uses it to read sender metadata
            from up to 24 matching welcome or verification emails. It does not fetch message bodies,
            send emails, or delete anything.
          </p>
          <p>
            The inbox must match your verified email. You can revoke access any time in your Google
            Account permissions. Reconnect when the access token expires.
          </p>
          <button
            className="button button-primary"
            disabled={busy}
            onClick={() => void connectGoogle()}
          >
            {busy ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <>
                {demo ? "Start with verified sign-in" : "Continue to Google"}
                <ArrowUpRight size={16} />
              </>
            )}
          </button>
        </Dialog>
      )}
      {auth && <AuthDialog onClose={() => setAuth(false)} />}
    </div>
  );
}
