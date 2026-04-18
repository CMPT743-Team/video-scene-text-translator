/**
 * <ErrorAlert> — destructive shadcn <Alert> used for the terminal "failed"
 * state. Optional traceback collapses behind a toggle so the panel stays
 * small when it's a one-line error.
 *
 * Kept deliberately dumb: no retry button, no "email support" CTA. For a
 * demo app, showing the error + traceback is enough.
 */

import { useState } from "react";
import { AlertCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export interface ErrorAlertProps {
  message: string;
  traceback?: string | null;
}

export function ErrorAlert({ message, traceback }: ErrorAlertProps) {
  const [open, setOpen] = useState(false);
  const hasTraceback = Boolean(traceback && traceback.trim().length > 0);

  return (
    <Alert variant="destructive">
      <AlertCircle aria-hidden />
      <AlertTitle>Pipeline failed</AlertTitle>
      <AlertDescription className="space-y-2">
        <p>{message}</p>
        {hasTraceback && (
          <div className="space-y-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen((x) => !x)}
            >
              {open ? "Hide details" : "Show details"}
            </Button>
            {open && (
              <pre className="max-h-64 overflow-auto rounded-md border bg-background p-2 text-xs text-foreground">
                {traceback}
              </pre>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}
