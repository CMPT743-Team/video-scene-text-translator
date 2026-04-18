/**
 * <IdlePlaceholder> — empty-state surface shown in the right column when
 * no job is in flight. Purely static; no props, no state.
 *
 * Mockup reference: `.idle-wrap` — centered icon, caps eyebrow label,
 * then a sentence of body copy. We diverge slightly from the mockup by
 * using lucide's `UploadCloud` instead of the mockup's inline SVG, for
 * consistency with the Dropzone glyph on the left column.
 */

import { UploadCloud } from "lucide-react";

export function IdlePlaceholder(): JSX.Element {
  return (
    <div className="flex flex-1 items-center justify-center p-8">
      <div className="flex flex-col items-center gap-3">
        <UploadCloud
          aria-hidden
          className="h-16 w-16 text-muted-foreground"
        />
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          WAITING FOR A JOB
        </p>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          Pick a video on the left and choose source + target languages.
          Progress will appear here.
        </p>
      </div>
    </div>
  );
}
