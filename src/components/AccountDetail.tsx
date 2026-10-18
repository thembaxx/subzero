"use client";

import { ArrowUpRight, Check, CircleAlert, Mail, ShieldCheck, Upload } from "lucide-react";
import type { Account } from "@/lib/types";
import { Dialog } from "./Dialog";
import { AccountAvatar } from "./AccountTable";

export function AccountDetail({
  account,
  reviewed,
  onReview,
  onClose,
}: {
  account: Account;
  reviewed: boolean;
  onReview: () => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      label={`${account.name} account details`}
      onClose={onClose}
      className="account-detail-dialog"
    >
      <AccountAvatar account={account} />
      <span className="eyebrow">A closer look</span>
      <h2>{account.name}</h2>
      <p className="detail-domain">{account.domain}</p>
      <div className="detail-evidence">
        <h3>Why it’s on your map</h3>
        <p>{account.evidence}</p>
        <div className="evidence-sources">
          {account.sources.map((source) => (
            <span key={source}>
              {source === "mailbox" ? (
                <Mail size={13} />
              ) : source === "breach" ? (
                <ShieldCheck size={13} />
              ) : (
                <Upload size={13} />
              )}
              {source === "mailbox"
                ? "Connected inbox"
                : source === "breach"
                  ? "Known breach"
                  : "Local import"}
            </span>
          ))}
        </div>
      </div>
      {account.exposure && (
        <div className="detail-exposure">
          <h3>
            <CircleAlert size={17} />
            Known data exposure
          </h3>
          <p>
            {account.exposure.title} ·{" "}
            {new Date(`${account.exposure.date}T00:00:00`).toLocaleDateString("en", {
              year: "numeric",
              month: "short",
            })}
          </p>
          <span>Information reported in this breach</span>
          <div className="data-tags">
            {account.exposure.dataClasses.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <p className="detail-advice">
            If you still use this service, update any reused password and turn on two-factor
            authentication. A historic breach does not mean the account is active today.
          </p>
        </div>
      )}
      <div className="detail-actions">
        <a
          className="button button-primary"
          href={`https://${account.domain}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Visit the service
          <ArrowUpRight size={17} />
        </a>
        <button className="button button-outline" onClick={onReview}>
          <Check size={17} />
          {reviewed ? "Marked as reviewed" : "Mark as reviewed"}
        </button>
      </div>
      <p className="detail-visit-note">
        You manage your account directly with the service. Review status lasts for this visit.
      </p>
    </Dialog>
  );
}
