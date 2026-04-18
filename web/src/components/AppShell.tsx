/**
 * <AppShell> — presentational two-column frame. Fixed inner size
 * (1080 × 760), centered on the page. Owns no domain state: the caller
 * passes `left` and `right` slot children.
 *
 * Viewport guard (D6, plan.md Step 4): when `window.innerWidth < 1080` the
 * shell is replaced (not wrapped) by <DesktopRequired>. A single `resize`
 * listener keeps the split in sync at runtime. We don't SSR this project,
 * so the `typeof window` guard is only there to keep lint + future-proofing
 * honest — default to shell-visible when window is absent.
 */

import { useEffect, useState } from "react";

import { DesktopRequired } from "@/components/DesktopRequired";

const MIN_VIEWPORT_WIDTH = 1080;

interface AppShellProps {
  left: React.ReactNode;
  right: React.ReactNode;
}

export function AppShell({ left, right }: AppShellProps): JSX.Element {
  const [wideEnough, setWideEnough] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return window.innerWidth >= MIN_VIEWPORT_WIDTH;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const onResize = () => {
      setWideEnough(window.innerWidth >= MIN_VIEWPORT_WIDTH);
    };

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  if (!wideEnough) {
    return <DesktopRequired />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div
        className="flex overflow-hidden border border-border rounded-lg"
        style={{ width: 1080, height: 760 }}
      >
        <div
          className="bg-card border-r border-border flex flex-col"
          style={{ width: 400 }}
        >
          {left}
        </div>
        <div className="flex-1 bg-background flex flex-col min-w-0">
          {right}
        </div>
      </div>
    </div>
  );
}
