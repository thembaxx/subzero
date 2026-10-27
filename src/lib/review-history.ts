import { validDomain } from "./accounts";

export const REVIEW_DECISIONS = ["confirmed", "not-mine", "unsure"] as const;
export const REVIEW_NEXT_STEPS = ["keep", "secure", "close", "investigate"] as const;
export type ReviewDecision = (typeof REVIEW_DECISIONS)[number];
export type ReviewNextStep = (typeof REVIEW_NEXT_STEPS)[number];

export type ReviewInput = {
  domain: string;
  decision: ReviewDecision;
  nextStep: ReviewNextStep;
  note: string;
};

export type ReviewRecord = ReviewInput & { reviewedAt: string };

const MAX_RECORDS = 200;
const MAX_NOTE = 1_000;
const MAX_HISTORY_LENGTH = 300_000;

function hasInvalidControl(note: string): boolean {
  for (let index = 0; index < note.length; index += 1) {
    const code = note.charCodeAt(index);
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127) return true;
  }
  return false;
}

function validateRecord(value: unknown): ReviewRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The saved review history is invalid. Export or clear it before saving again.");
  }
  const record = value as Partial<ReviewRecord>;
  if (
    typeof record.domain !== "string" ||
    record.domain !== record.domain.toLowerCase() ||
    !validDomain(record.domain) ||
    !REVIEW_DECISIONS.includes(record.decision as ReviewDecision) ||
    !REVIEW_NEXT_STEPS.includes(record.nextStep as ReviewNextStep) ||
    typeof record.note !== "string" ||
    record.note.length > MAX_NOTE ||
    hasInvalidControl(record.note) ||
    typeof record.reviewedAt !== "string" ||
    !Number.isFinite(Date.parse(record.reviewedAt)) ||
    new Date(record.reviewedAt).toISOString() !== record.reviewedAt
  ) {
    throw new Error("The saved review history is invalid. Export or clear it before saving again.");
  }
  return {
    domain: record.domain,
    decision: record.decision as ReviewDecision,
    nextStep: record.nextStep as ReviewNextStep,
    note: record.note,
    reviewedAt: record.reviewedAt,
  };
}

/** Invalid history must remain untouched until the user chooses to clear it. */
export function readReviewHistory(raw: string | null): ReviewRecord[] {
  if (raw === null) return [];
  if (raw.length > MAX_HISTORY_LENGTH) throw new Error("The saved review history is too large.");
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(
      "The saved review history cannot be read. Export or clear it before saving again.",
    );
  }
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("The saved review history format is invalid.");
  }
  const history = value as { version?: unknown; records?: unknown };
  if (
    history.version !== 1 ||
    !Array.isArray(history.records) ||
    history.records.length > MAX_RECORDS
  ) {
    throw new Error("The saved review history format or version is unsupported.");
  }
  const records = history.records.map(validateRecord);
  if (new Set(records.map((record) => record.domain)).size !== records.length) {
    throw new Error("The saved review history contains duplicate domains.");
  }
  return records;
}

export function createReviewRecord(input: ReviewInput, now = new Date()): ReviewRecord {
  return validateRecord({
    ...input,
    domain: input.domain.trim().toLowerCase(),
    note: input.note.trim(),
    reviewedAt: now.toISOString(),
  });
}

export function upsertReview(records: ReviewRecord[], record: ReviewRecord): ReviewRecord[] {
  const clean = validateRecord(record);
  const existing = readReviewHistory(JSON.stringify({ version: 1, records }));
  const next = [clean, ...existing.filter((item) => item.domain !== clean.domain)];
  if (next.length > MAX_RECORDS) {
    throw new Error(
      "This device has 200 account reviews. Export and clear history before adding more.",
    );
  }
  return next;
}

export function serializeReviewHistory(records: ReviewRecord[]): string {
  const raw = JSON.stringify({ version: 1, records });
  return JSON.stringify({ version: 1, records: readReviewHistory(raw) });
}

/** Scope records to the verified identity; demo data can never become personal history. */
export async function reviewStorageKey(identity: string, demo: boolean): Promise<string> {
  const scope = `${demo ? "demo" : "verified"}:${identity.trim().toLowerCase()}`;
  if (!identity.trim() || identity.length > 320) throw new Error("Review identity is invalid.");
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(scope));
  const hash = Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  return `trace-review-history:v1:${hash}`;
}
