/**
 * <StageProgress> — five horizontal pills for S1..S5 of the pipeline.
 *
 * Why custom instead of shadcn <Progress>
 * ---------------------------------------
 * The plan notes "uses shadcn <Progress>" for rough guidance, but shadcn's
 * Progress renders a single continuous bar. Our pipeline is five discrete
 * stages and we need per-stage affordances (active pulse, completed
 * duration, distinct labels). A single bar can't carry those. So we land on
 * D6 tier 3: custom pills built from Tailwind + shadcn design tokens
 * (bg-muted, bg-primary, border-border, text-muted-foreground). The visual
 * weight still matches the rest of the form.
 *
 * Accessibility notes
 * -------------------
 * The active pill gets `role="status"` so assistive tech announces "running"
 * without stealing focus. Done/pending pills stay plain divs. Tests locate
 * the active pill via `getByRole("status")` — nice and implementation-free.
 *
 * Duration display
 * ----------------
 * Durations arrive in milliseconds; we render them as `X.Ys`. Sub-second
 * precision is enough for the demo and keeps the pills from getting wide.
 */

import type { Stage } from "@/api/schemas";
import type { StageState } from "@/hooks/useJobStream";
import { cn } from "@/lib/utils";

const STAGE_META: Array<{ stage: Stage; label: string }> = [
  { stage: "s1", label: "Detect" },
  { stage: "s2", label: "Frontalize" },
  { stage: "s3", label: "Edit" },
  { stage: "s4", label: "Propagate" },
  { stage: "s5", label: "Revert" },
];

export interface StageProgressProps {
  stages: Record<Stage, StageState>;
  stageDurations: Partial<Record<Stage, number>>;
}

function formatDuration(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

export function StageProgress({
  stages,
  stageDurations,
}: StageProgressProps) {
  return (
    <ol
      aria-label="Pipeline progress"
      className="flex w-full items-stretch gap-2"
    >
      {STAGE_META.map(({ stage, label }) => {
        const state = stages[stage];
        const duration = stageDurations[stage];
        const isActive = state === "active";
        const isDone = state === "done";

        return (
          <li
            key={stage}
            // role="status" only on the active pill so the a11y tree stays
            // quiet once every stage has finished.
            role={isActive ? "status" : undefined}
            data-stage={stage}
            data-state={state}
            className={cn(
              "flex min-w-0 flex-1 flex-col items-center gap-1 rounded-md border px-2 py-2 text-center text-xs transition-colors",
              state === "pending" &&
                "border-border bg-muted/30 text-muted-foreground",
              isActive &&
                "border-primary bg-primary/10 text-foreground shadow-sm",
              isDone &&
                "border-primary bg-primary text-primary-foreground",
            )}
          >
            <div className="flex items-center gap-1.5 font-medium">
              {isActive && (
                <span
                  aria-hidden
                  className="inline-block h-2 w-2 animate-pulse rounded-full bg-primary"
                />
              )}
              <span>{label}</span>
            </div>
            {isDone && duration !== undefined && (
              <span className="text-[10px] opacity-80">
                {formatDuration(duration)}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
