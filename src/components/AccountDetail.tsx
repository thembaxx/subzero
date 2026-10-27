"use client";

import { ArrowUpRight, Check, CircleAlert, Mail, ShieldCheck, Upload } from "lucide-react";
import { useState } from "react";
import type {
  ReviewDecision,
  ReviewInput,
  ReviewNextStep,
  ReviewRecord,
} from "@/lib/review-history";
import type { Account } from "@/lib/types";
import { Dialog } from "./Dialog";
import { AccountAvatar } from "./AccountTable";

export function AccountDetail({
  account,
  review,
  onSaveReview,
  onClose,
}: {
  account: Account;
  review?: ReviewRecord;
  onSaveReview: (input: ReviewInput) => void;
  onClose: () => void;
}) {
  const [decision, setDecision] = useState<ReviewDecision>(review?.decision ?? "unsure");
  const [nextStep, setNextStep] = useState<ReviewNextStep>(review?.nextStep ?? "investigate");
  const [saveError, setSaveError] = useState("");
  const [note, setNote] = useState(review?.note ?? "");
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
      </div>
      <form
        className="auth-form detail-evidence"
        aria-label="Your account review"
        onSubmit={(event) => {
          event.preventDefault();
          try {
            onSaveReview({ domain: account.domain, decision, nextStep, note });
            setSaveError("");
          } catch (error) {
            setSaveError(
              error instanceof Error
                ? error.message
                : "This review could not be saved. Your edits remain here.",
            );
          }
        }}
      >
        <h3>Your review and next step</h3>
        <p>Your assessment does not verify account ownership or change anything at the service.</p>
        <label htmlFor="review-decision">Is this your account?</label>
        <select
          id="review-decision"
          className="phone-field"
          value={decision}
          onChange={(event) => setDecision(event.target.value as ReviewDecision)}
        >
          <option value="unsure">I still need to check</option>
          <option value="confirmed">I confirmed it with the service</option>
          <option value="not-mine">I believe this is not my account</option>
        </select>
        <label htmlFor="review-next-step">What will you do next?</label>
        <select
          id="review-next-step"
          className="phone-field"
          value={nextStep}
          onChange={(event) => setNextStep(event.target.value as ReviewNextStep)}
        >
          <option value="investigate">Investigate with the service</option>
          <option value="keep">Keep using the account</option>
          <option value="secure">Update security settings</option>
          <option value="close">Request closure with the service</option>
        </select>
        <label htmlFor="review-note">Notes for yourself (optional)</label>
        <textarea
          id="review-note"
          className="phone-field"
          rows={3}
          maxLength={1_000}
          value={note}
          onChange={(event) => setNote(event.target.value)}
          aria-describedby="review-note-help"
        />
        <p id="review-note-help">
          Keep passwords and sensitive personal details out of these notes.
        </p>
        {review && <p>Last saved: {new Date(review.reviewedAt).toLocaleString()}</p>}
        {saveError && <p role="alert">{saveError}</p>}
        <button type="submit" className="button button-outline">
          <Check size={17} />
          {review ? "Save updated review on this device" : "Save review on this device"}
        </button>
      </form>
      <p className="detail-visit-note">
        Reviews stay in this browser for this identity. They do not sync to another device. You
        manage security settings and closure directly with the service; choosing a next step does
        not complete it.
      </p>
    </Dialog>
  );
}
