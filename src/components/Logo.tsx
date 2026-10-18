import Link from "next/link";

export function TraceMark({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <g stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M8 28v-7C8 12.7 14.3 6 22 6s14 6.7 14 15v7" />
        <path d="M13 32V21c0-5.6 4-10 9-10s9 4.4 9 10v11" />
        <path d="M18 36V21c0-2.8 1.8-5 4-5s4 2.2 4 5v15" />
        <path d="M22 22v17M8 33v1M36 33v1" />
      </g>
    </svg>
  );
}

export function Logo({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className={`logo${inverse ? " logo-inverse" : ""}`} aria-label="Trace home">
      <TraceMark />
      <span>
        trace<span className="logo-period">.</span>
      </span>
    </Link>
  );
}
