/**
 * <LogPanel> — monospace scroll container for pipeline log lines.
 *
 * Auto-scroll
 * -----------
 * On every log-length change we push `scrollTop = scrollHeight` so new lines
 * are always visible. We don't detect "user scrolled up to read earlier
 * lines" yet — MVP accepts that behaviour; the user can drag the scroll
 * thumb and the next log will jank them back to the bottom. If this becomes
 * annoying we'll add an `autoFollow` ref gate.
 *
 * Level styling
 * -------------
 * - info    -> default muted foreground
 * - warning -> amber (readable in both themes via Tailwind's dark variant)
 * - error   -> destructive token
 *
 * Timestamps are seconds-since-epoch floats from the server (LogEvent.ts),
 * which we convert to a local HH:MM:SS label via `Date`. The server emits
 * `ts` as a float `time.time()` — milliseconds = ts * 1000.
 */

import { useEffect, useRef } from "react";

import type { LogLevel } from "@/api/schemas";
import { cn } from "@/lib/utils";

export interface LogPanelProps {
  logs: Array<{ level: LogLevel; message: string; ts: number }>;
}

const LEVEL_CLASS: Record<LogLevel, string> = {
  info: "text-muted-foreground",
  warning: "text-yellow-600 dark:text-yellow-400",
  error: "text-destructive",
};

function formatTs(ts: number): string {
  const d = new Date(ts * 1000);
  // Pad helpers; avoids pulling in date-fns for one formatter.
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

export function LogPanel({ logs }: LogPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = panelRef.current;
    if (!el) return;
    // Pin to bottom on any log count change.
    el.scrollTop = el.scrollHeight;
  }, [logs.length]);

  return (
    <div
      ref={panelRef}
      data-testid="log-panel"
      aria-label="Pipeline logs"
      className="h-48 overflow-y-auto rounded-md border bg-muted/30 p-3 font-mono text-xs leading-relaxed"
    >
      {logs.length === 0 ? (
        <p className="text-muted-foreground italic">Waiting for logs…</p>
      ) : (
        logs.map((log, i) => (
          <div
            key={i}
            data-testid="log-line"
            className={cn("whitespace-pre-wrap", LEVEL_CLASS[log.level])}
          >
            <span className="opacity-60">[{formatTs(log.ts)}]</span>{" "}
            <span className="uppercase">{log.level}</span>{" "}
            <span>{log.message}</span>
          </div>
        ))
      )}
    </div>
  );
}
