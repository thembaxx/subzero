"use client";

import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { TraceMark } from "@/components/Logo";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="not-found">
      <TraceMark />
      <h1>A little interruption.</h1>
      <p>Something couldn’t be loaded. Give it another try.</p>
      <button className="button button-primary" onClick={reset}>
        <RefreshCw size={16} />
        Try again
      </button>
      <Link href="/" className="button button-link">
        Back home
      </Link>
    </main>
  );
}
