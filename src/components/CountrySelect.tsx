"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { getCountries, getCountryCallingCode, type CountryCode } from "libphonenumber-js";

export function CountrySelect({
  value,
  onChange,
}: {
  value: CountryCode;
  onChange: (country: CountryCode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const button = useRef<HTMLButtonElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    function outside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  const countries = useMemo(() => {
    const names = new Intl.DisplayNames(["en"], { type: "region" });
    return getCountries()
      .map((code) => ({ code, name: names.of(code) ?? code, calling: getCountryCallingCode(code) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, []);
  const matches = countries.filter(({ code, name, calling }) =>
    `${code} ${name} +${calling}`.toLowerCase().includes(query.toLowerCase()),
  );
  function select(country: CountryCode) {
    onChange(country);
    setOpen(false);
    button.current?.focus();
  }
  return (
    <div className="country-select" ref={root}>
      <button
        ref={button}
        type="button"
        className="country-trigger"
        aria-label="Choose country calling code"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setQuery("");
          setActive(0);
        }}
      >
        <span className="country-iso">{value}</span>
        <span>+{getCountryCallingCode(value)}</span>
        <ChevronDown size={13} />
      </button>
      {open && (
        <div className="country-popover">
          <div className="country-search">
            <Search size={16} />
            <input
              autoFocus
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setActive(0);
              }}
              placeholder="Search country or code"
              role="combobox"
              aria-label="Search country or calling code"
              aria-expanded="true"
              aria-controls="country-options"
              aria-activedescendant={
                matches[active] ? `country-${matches[active].code}` : undefined
              }
              onKeyDown={(event) => {
                if (event.key === "ArrowDown") {
                  event.preventDefault();
                  const next = Math.min(active + 1, matches.length - 1);
                  setActive(next);
                  document
                    .getElementById(`country-${matches[next]?.code}`)
                    ?.scrollIntoView({ block: "nearest" });
                }
                if (event.key === "ArrowUp") {
                  event.preventDefault();
                  const next = Math.max(0, active - 1);
                  setActive(next);
                  document
                    .getElementById(`country-${matches[next]?.code}`)
                    ?.scrollIntoView({ block: "nearest" });
                }
                if (event.key === "Enter") {
                  event.preventDefault();
                  if (matches[active]) select(matches[active].code);
                }
                if (event.key === "Escape") {
                  event.preventDefault();
                  event.stopPropagation();
                  setOpen(false);
                  button.current?.focus();
                }
              }}
            />
          </div>
          <ul id="country-options" role="listbox" aria-label="Countries">
            {matches.map((country, index) => (
              <li
                key={country.code}
                id={`country-${country.code}`}
                role="option"
                aria-selected={value === country.code}
                className={active === index ? "country-active" : ""}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => select(country.code)}
                >
                  <span>{country.name}</span>
                  <span className="country-calling">+{country.calling}</span>
                  {value === country.code && <Check size={14} />}
                </button>
              </li>
            ))}
            {!matches.length && (
              <li className="country-empty" role="presentation">
                No countries found.
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
