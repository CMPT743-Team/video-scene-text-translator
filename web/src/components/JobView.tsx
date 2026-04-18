/**
 * <JobView> — composite panel shown after a job has been submitted. Wires
 * together `useJobStream`, `<StageProgress>`, `<LogPanel>`, `<ResultPanel>`
 * and `<ErrorAlert>` into a single view.
 *
 * Responsibilities:
 *   - Derive the running/succeeded/failed branch from `state.status`.
 *   - Let the user start over (`Submit another`) on a terminal state,
 *     which both clears local state (`reset`) and notifies the parent
 *     (`onReset`).
 *   - Offer a `Delete job` button on terminal states that calls
 *     `deleteJob(jobId)` to free server-side storage. A 409 (shouldn't
 *     happen on terminal states but guard anyway) surfaces as an inline
 *     alert so the user can retry.
 *
 * We pass `jobId` through `<ResultPanel>` so the download filename includes
 * it, and show the first 8 chars in the header to keep the UI readable.
 */

import { useState } from "react";

import { ApiError, deleteJob } from "@/api/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

import { useJobStream } from "@/hooks/useJobStream";

import { ErrorAlert } from "./ErrorAlert";
import { LogPanel } from "./LogPanel";
import { ResultPanel } from "./ResultPanel";
import { StageProgress } from "./StageProgress";

export interface JobViewProps {
  jobId: string;
  onReset?: () => void;
}

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

function statusBadge(status: string): { text: string; variant: BadgeVariant } {
  switch (status) {
    case "succeeded":
      return { text: "Done", variant: "default" };
    case "failed":
      return { text: "Failed", variant: "destructive" };
    case "running":
      return { text: "Running", variant: "secondary" };
    default:
      return { text: "Connecting…", variant: "outline" };
  }
}

export function JobView({ jobId, onReset }: JobViewProps) {
  const { state, reset } = useJobStream(jobId);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const terminal =
    state.status === "succeeded" || state.status === "failed";
  const badge = statusBadge(state.status);

  function handleReset() {
    reset();
    onReset?.();
  }

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteJob(jobId);
      reset();
      onReset?.();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setDeleteError(
          "Job is still running on the server and can't be deleted yet.",
        );
      } else {
        setDeleteError(
          err instanceof Error
            ? `Delete failed: ${err.message}`
            : "Delete failed.",
        );
      }
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <Card className="w-full max-w-3xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Job {jobId.slice(0, 8)}</CardTitle>
            <CardDescription>
              {terminal
                ? state.status === "succeeded"
                  ? "Pipeline complete."
                  : "Pipeline hit an error — see details below."
                : "Live pipeline progress. Events stream over SSE."}
            </CardDescription>
          </div>
          <Badge variant={badge.variant}>{badge.text}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <StageProgress
          stages={state.stages}
          stageDurations={state.stageDurations}
        />

        <LogPanel logs={state.logs} />

        {state.status === "succeeded" && state.outputUrl && (
          <ResultPanel jobId={jobId} outputUrl={state.outputUrl} />
        )}

        {state.status === "failed" && state.error && (
          <ErrorAlert
            message={state.error.message}
            traceback={state.error.traceback ?? null}
          />
        )}

        {deleteError && (
          <Alert variant="destructive">
            <AlertTitle>Couldn't delete job</AlertTitle>
            <AlertDescription>{deleteError}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      {terminal && (
        <CardFooter className="flex flex-wrap gap-2">
          <Button type="button" onClick={handleReset}>
            Submit another
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting…" : "Delete job"}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
