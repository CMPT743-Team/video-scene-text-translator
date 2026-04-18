/**
 * <ResultPanel> — shown on a `done` event. Holds the inline video preview
 * and a download anchor.
 *
 * We render the `<video>` with explicit `<source>` + `type="video/mp4"` so
 * the browser knows it's H.264 MP4 (R3 landed in Step 8, the pipeline
 * transcodes to browser-safe avc1). `preload="metadata"` keeps the initial
 * bytes-pulled tiny — the user can hit play when they're ready.
 *
 * Download: we style an `<a download>` with `buttonVariants` instead of
 * wrapping a <Button asChild>, because the download UX works better with a
 * plain anchor (right-click → Save As, no JS navigation). The visual is
 * identical to a Button.
 */

import { Download } from "lucide-react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ResultPanelProps {
  jobId: string;
  outputUrl: string;
}

export function ResultPanel({ jobId, outputUrl }: ResultPanelProps) {
  return (
    <div className="space-y-3">
      <video
        controls
        preload="metadata"
        className="w-full rounded-md border bg-black"
        aria-label={`Translated output for job ${jobId}`}
      >
        <source src={outputUrl} type="video/mp4" />
        Your browser does not support embedded video playback.
      </video>

      <a
        href={outputUrl}
        download={`job-${jobId}-output.mp4`}
        className={cn(
          buttonVariants({ variant: "default" }),
          "w-full no-underline",
        )}
      >
        <Download aria-hidden />
        Download
      </a>
    </div>
  );
}
