import { TraceMark } from "@/components/Logo";

export default function Loading() {
  return (
    <div className="app-loading" role="status" aria-label="Loading Trace">
      <TraceMark className="loading-mark" />
    </div>
  );
}
