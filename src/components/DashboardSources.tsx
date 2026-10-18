"use client";

import { ArrowUpRight, Check, FileUp, Inbox, LockKeyhole, ShieldCheck } from "lucide-react";
import type { SourceStatus } from "@/lib/types";

export function DashboardSources({
  sources,
  onConnect,
  onImport,
  breachEnabled,
  demo,
}: {
  sources: SourceStatus[];
  onConnect: () => void;
  onImport: () => void;
  breachEnabled: boolean;
  demo: boolean;
}) {
  const mailbox = sources.find((source) => source.id === "mailbox");
  const breach = sources.find((source) => source.id === "breach");
  return (
    <section className="sources-section">
      <div className="panel-heading">
        <div>
          <h2>Connect your own dots.</h2>
          <p>You choose where the picture comes from.</p>
        </div>
      </div>
      <div className="source-cards">
        <article className="source-card">
          <span className="source-icon">
            <Inbox size={25} strokeWidth={1.4} />
          </span>
          <span
            className={`source-status ${mailbox?.status === "complete" ? "source-connected" : ""}`}
          >
            {demo
              ? "Sample connection"
              : mailbox?.status === "complete"
                ? "Connected"
                : "Optional connection"}
          </span>
          <h3>Your Google inbox</h3>
          <p>
            {mailbox?.message ??
              "Find possible accounts from welcome and verification emails in your own inbox."}
          </p>
          <div className="source-permission">
            <LockKeyhole size={14} />
            <span>
              Google grants read-only mailbox permission. Trace requests sender metadata for
              matching messages and does not fetch message bodies.
            </span>
          </div>
          <button className="button button-dark" onClick={onConnect}>
            {mailbox?.status === "complete" ? "Reconnect Google" : "Connect Google"}
            <ArrowUpRight size={16} />
          </button>
        </article>
        <article className="source-card">
          <span className="source-icon">
            <ShieldCheck size={25} strokeWidth={1.4} />
          </span>
          <span
            className={`source-status ${breach?.status === "complete" ? "source-connected" : ""}`}
          >
            {demo
              ? "Sample records"
              : breach?.status === "complete"
                ? "Checked"
                : breachEnabled
                  ? "Ready for a scan"
                  : "Not configured"}
          </span>
          <h3>Known breach records</h3>
          <p>
            {breach?.message ??
              "Check your verified email against known data breaches through Have I Been Pwned."}
          </p>
          <div className="source-permission">
            <ShieldCheck size={14} />
            <span>
              Supports verified email addresses. A result is historic exposure evidence, not proof
              of a current account.
            </span>
          </div>
          <a
            className="text-button"
            href="https://haveibeenpwned.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            About the data source
            <ArrowUpRight size={15} />
          </a>
        </article>
        <article className="source-card">
          <span className="source-icon">
            <FileUp size={25} strokeWidth={1.4} />
          </span>
          <span className="source-status">Stays on your device</span>
          <h3>An account list you own</h3>
          <p>
            Import a CSV from your password manager or your own list. We only use website domains to
            create your map.
          </p>
          <div className="source-permission">
            <Check size={14} />
            <span>
              Passwords, usernames, and notes are discarded. The file is processed in this browser
              and never uploaded.
            </span>
          </div>
          <button className="button button-outline" onClick={onImport}>
            Import a CSV
            <FileUp size={16} />
          </button>
        </article>
      </div>
    </section>
  );
}
