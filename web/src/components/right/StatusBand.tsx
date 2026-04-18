/**
 * <StatusBand> — thin header row shown at the top of the right column in
 * every phase. Two parts:
 *
 *   - Left label (constant): "PIPELINE · ONE WINDOW" in caps mono.
 *   - Right-aligned status pill whose text + color change with `kind`.
 *
 * Color tokens come from the slate palette in globals.css. The "running"
 * kind prepends a pulsing dot glyph; the `prefers-reduced-motion` media
 * query in globals.css already dampens `animate-pulse` globally so no
 * per-component bail-out is needed.
 */

import { cn } from "@/lib/utils";

export type StatusBandKind =
  | "idle"
  | "uploading"
  | "connecting"
  | "running"
  | "succeeded"
  | "failed"
  | "blocked";

interface StatusBandProps {
  kind: StatusBandKind;
}

type PillSpec = {
  label: string;
  /** When true, a pulsing "●" prefix is rendered inside the pill. */
  dot?: boolean;
  className: string;
};

// Tailwind color-token classes per pill state. Kept as a static map so the
// JIT picks up every class string at build time (no dynamic interpolation).
const NEUTRAL =
  "bg-[color:var(--bg-3)] text-muted-foreground border border-border";
const ACCENT =
  "bg-[color:var(--acc-soft)] text-[color:var(--acc)] border border-[color:var(--acc-line)]";
const OK =
  "bg-[color:var(--ok-soft)] text-[color:var(--ok)] border border-[color:var(--ok-soft)]";
const DESTRUCTIVE =
  "bg-[color:var(--err-soft)] text-[color:var(--err)] border border-[color:var(--err-line)]";
const WARN =
  "bg-[color:var(--warn-soft)] text-[color:var(--warn)] border border-[color:var(--warn-line)]";

const PILLS: Record<StatusBandKind, PillSpec> = {
  idle: { label: "IDLE", className: NEUTRAL },
  // U+2192 RIGHTWARDS ARROW — matches mockup glyph.
  uploading: { label: "CLIENT \u2192 SERVER", className: ACCENT },
  connecting: { label: "CONNECTING", className: ACCENT },
  running: { label: "LIVE", dot: true, className: ACCENT },
  succeeded: { label: "READY", className: OK },
  failed: { label: "ERR", dot: true, className: DESTRUCTIVE },
  blocked: { label: "BLOCKED", dot: true, className: WARN },
};

export function StatusBand({ kind }: StatusBandProps): JSX.Element {
  const pill = PILLS[kind];

  return (
    <div className="flex items-center justify-between border-b border-border px-5 py-3 font-mono text-[11px] uppercase tracking-wider">
      <span className="text-muted-foreground">
        PIPELINE {"\u00B7"} ONE WINDOW
      </span>
      <span
        className={cn(
          "rounded px-2 py-0.5",
          pill.className,
        )}
      >
        {pill.dot && (
          // Pulsing dot glyph. Decorative — screen readers read the label.
          <span aria-hidden="true" className="mr-1 animate-pulse">
            &#x25CF;
          </span>
        )}
        {pill.label}
      </span>
    </div>
  );
}
