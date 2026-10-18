import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TraceMark } from "@/components/Logo";

export default function NotFound() {
  return (
    <main className="not-found">
      <TraceMark />
      <h1>A little off the map.</h1>
      <p>This page seems to have wandered. Let’s bring you back.</p>
      <Link className="button button-primary" href="/">
        <ArrowLeft size={16} />
        Back to Trace
      </Link>
    </main>
  );
}
