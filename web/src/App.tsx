/**
 * Root app shell — toggles between <UploadForm> (pre-submit) and
 * <JobView> (post-submit / running / terminal) based on whether there's
 * an active job id.
 *
 * We store `activeJobId` locally. On `onReset` from <JobView> we clear it,
 * returning the user to the upload form. `onRejoinActiveJob` on the
 * UploadForm (fired from a 409 concurrent-job detail) reuses the same
 * setter, so rejoining an existing run shares the same route.
 */

import { useCallback, useState } from "react";

import { JobView } from "@/components/JobView";
import { UploadForm } from "@/components/UploadForm";

export default function App() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);

  const handleJobCreated = useCallback(
    (id: string) => setActiveJobId(id),
    [],
  );
  const handleRejoin = useCallback((id: string) => setActiveJobId(id), []);
  const handleReset = useCallback(() => setActiveJobId(null), []);

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center p-8">
      {activeJobId ? (
        <JobView jobId={activeJobId} onReset={handleReset} />
      ) : (
        <UploadForm
          onJobCreated={handleJobCreated}
          onRejoinActiveJob={handleRejoin}
        />
      )}
    </main>
  );
}
