"use client";

import { useState } from "react";
import { ArrowRight, ArrowUpRight, Check, Search, SlidersHorizontal } from "lucide-react";
import type { Account, Category } from "@/lib/types";

export function AccountAvatar({ account, small = false }: { account: Account; small?: boolean }) {
  return (
    <span
      className={`account-avatar${small ? " avatar-small" : ""}`}
      style={{ "--brand-color": account.color } as React.CSSProperties}
      aria-hidden="true"
    >
      {account.domain === "spotify.com" ? "≋" : account.letter}
    </span>
  );
}

export function AccountTable({
  accounts,
  reviewed,
  onSelect,
  compact = false,
  onViewAll,
  exposureOnly = false,
}: {
  accounts: Account[];
  reviewed: Set<string>;
  onSelect: (account: Account) => void;
  compact?: boolean;
  onViewAll?: () => void;
  exposureOnly?: boolean;
}) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [attention, setAttention] = useState(exposureOnly);
  const filtered = accounts.filter(
    (account) =>
      `${account.name} ${account.domain}`.toLowerCase().includes(search.toLowerCase()) &&
      (category === "all" || account.category === category) &&
      (!attention || account.exposure),
  );
  const displayed = compact ? filtered.slice(0, 5) : filtered;
  return (
    <section className="accounts-panel">
      <div className="panel-heading">
        <div>
          <h2>
            {exposureOnly ? "Known exposures" : "Your accounts"}
            <span className="count-badge">
              {exposureOnly
                ? accounts.filter((account) => account.exposure).length
                : accounts.length}
            </span>
          </h2>
          <p>
            {exposureOnly
              ? "A starting point for a little extra care."
              : "A few familiar faces. Maybe a few forgotten ones."}
          </p>
        </div>
        {compact && onViewAll && (
          <button className="text-button view-all" onClick={onViewAll}>
            View all
            <ArrowRight size={15} />
          </button>
        )}
      </div>
      <div className="account-toolbar">
        <label className="account-search">
          <Search size={17} />
          <input
            placeholder="Find an account…"
            aria-label="Search accounts"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
        <label className="category-filter">
          <SlidersHorizontal size={15} />
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as Category | "all")}
            aria-label="Filter account category"
          >
            <option value="all">All categories</option>
            {["Social", "Shopping", "Entertainment", "Productivity", "Other"].map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>
      {!exposureOnly && (
        <div className="account-filter-tabs">
          <button
            aria-pressed={!attention}
            className={!attention ? "active" : ""}
            onClick={() => setAttention(false)}
          >
            All accounts
          </button>
          <button
            aria-pressed={attention}
            className={attention ? "active" : ""}
            onClick={() => setAttention(true)}
          >
            Needs attention<span>{accounts.filter((account) => account.exposure).length}</span>
          </button>
        </div>
      )}
      {displayed.length ? (
        <div className="account-table-wrap">
          <table className="account-table">
            <thead>
              <tr>
                <th scope="col">Account</th>
                <th scope="col" className="category-column">
                  Category
                </th>
                <th scope="col">What we found</th>
                <th scope="col">
                  <span className="sr-only">Review account</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((account) => (
                <tr key={account.id}>
                  <td>
                    <button className="account-name-button" onClick={() => onSelect(account)}>
                      <AccountAvatar account={account} />
                      <span>
                        <strong>{account.name}</strong>
                        <small>{account.domain}</small>
                      </span>
                    </button>
                  </td>
                  <td className="category-column">
                    <span className="category-label">{account.category}</span>
                  </td>
                  <td>
                    {reviewed.has(account.id) ? (
                      <span className="status-pill status-reviewed">
                        <Check size={12} />
                        Reviewed
                      </span>
                    ) : account.exposure ? (
                      <span className="status-pill status-exposure">
                        <span />
                        Data exposure
                      </span>
                    ) : (
                      <span className="status-pill status-found">
                        <span />
                        {account.sources.includes("import") ? "Imported" : "Possible account"}
                      </span>
                    )}
                  </td>
                  <td>
                    <button
                      className="account-open"
                      aria-label={`Review ${account.name}`}
                      onClick={() => onSelect(account)}
                    >
                      <ArrowUpRight size={17} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="accounts-empty">
          <Search size={27} strokeWidth={1.3} />
          <h3>{accounts.length ? "No accounts match just yet." : "A blank canvas, for now."}</h3>
          <p>
            {accounts.length
              ? "Try another search or category."
              : "Connect an inbox, run a supported scan, or import a CSV to start your map."}
          </p>
        </div>
      )}
      <div className="table-footnote">
        <span className="small-dot" />
        {filtered.length
          ? `Showing ${displayed.length} of ${filtered.length} ${filtered.length === 1 ? "result" : "results"}`
          : "Your next discovery starts with a connection."}
        <span>Evidence, with context.</span>
      </div>
    </section>
  );
}
