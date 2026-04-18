/**
 * <UploadProgress> — big live upload readout shown in the right column
 * while the XHR upload is in flight. Driven entirely by the
 * `UploadProgress` snapshot emitted by `createJob`'s `onProgress` callback
 * (see api/client.ts).
 *
 * Degradation rules (plan R2):
 *   - `bytesPerSec` / `etaSeconds` are null until the throughput estimator
 *     has at least ~1s of samples. When null, render "\u2014" (em dash)
 *     instead of synthesising a speed — never show NaN / Infinity.
 *   - `total === 0` (server hasn't sent Content-Length yet) keeps the
 *     percent at 0; no division by zero — upstream already clamps this.
 *
 * A11y: the numeric blob is exposed via `role="progressbar"` with
 * `aria-valuenow` / `min` / `max`. The thin visual bar is decorative.
 */

import type { UploadProgress as UploadProgressSnapshot } from "@/api/schemas";

interface UploadProgressProps {
  progress: UploadProgressSnapshot;
  filename: string;
}

// Tiered bytes formatter — base-1024 (MiB-style) to match user intuition
// for download speeds. Rule of three hasn't fired: `Dropzone` and
// `VideoCard` both have their own MB-only helpers; this one is the first
// tiered version, so we keep it inline until the third instance appears.
function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  return `${(b / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function UploadProgress({
  progress,
  filename,
}: UploadProgressProps): JSX.Element {
  const { loaded, total, percent, bytesPerSec, etaSeconds } = progress;

  const percentText = `${percent}%`;

  const throughputSegment =
    bytesPerSec !== null ? ` \u00B7 ${formatBytes(bytesPerSec)}/s` : "";
  const bytesLine = `${formatBytes(loaded)} / ${formatBytes(total)}${throughputSegment}`;

  const etaLine =
    etaSeconds !== null ? `~${etaSeconds}s remaining` : "\u2014";

  // Clamp the bar width so a bogus percent can't spill. `total === 0`
  // already folds to percent === 0 upstream; we belt-and-braces here too.
  const barPct = Math.max(0, Math.min(100, percent));

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8">
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Uploading ${filename}`}
        className="text-6xl font-semibold tracking-tight text-foreground"
      >
        {percentText}
      </div>

      <p className="font-mono text-sm text-muted-foreground">{bytesLine}</p>

      <div
        aria-hidden="true"
        className="h-1.5 w-full max-w-md overflow-hidden rounded-full bg-[color:var(--bg-3)]"
      >
        <div
          className="h-full bg-[color:var(--acc)]"
          style={{ width: `${barPct}%` }}
        />
      </div>

      <p className="font-mono text-[11px] text-muted-foreground">{etaLine}</p>

      <p className="max-w-full truncate text-xs text-muted-foreground">
        {filename}
      </p>
    </div>
  );
}
