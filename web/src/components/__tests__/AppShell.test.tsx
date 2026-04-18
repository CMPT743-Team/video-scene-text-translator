/**
 * Tests for <AppShell>. The shell is a presentational two-column frame:
 *   - renders the `left` and `right` slot children
 *   - falls back to <DesktopRequired> when window.innerWidth < 1080
 *   - swaps back to the shell when the viewport grows past 1080
 *
 * jsdom's default viewport is 1024 × 768, which is below the 1080 cutoff,
 * so every test that expects the shell visible must widen innerWidth first.
 * `afterEach` restores a wide viewport so no test inherits a narrow one.
 */

import { afterEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";

import { AppShell } from "../AppShell";

function setViewportWidth(w: number): void {
  // innerWidth is a read-only getter on window by default; redefine it
  // so we can simulate resize without a real browser. `configurable: true`
  // so successive tests can re-set it.
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    writable: true,
    value: w,
  });
}

afterEach(() => {
  // Reset to a safely-wide viewport so later (non-AppShell) tests aren't
  // left with an accidental narrow-window state.
  setViewportWidth(1440);
});

describe("<AppShell>", () => {
  it("renders both left and right slot children when the viewport is wide enough", () => {
    setViewportWidth(1440);

    render(
      <AppShell
        left={<div data-testid="L">left slot</div>}
        right={<div data-testid="R">right slot</div>}
      />,
    );

    expect(screen.getByTestId("L")).toBeInTheDocument();
    expect(screen.getByTestId("R")).toBeInTheDocument();
  });

  it("shows <DesktopRequired> instead of the shell when innerWidth < 1080", () => {
    setViewportWidth(800);

    render(
      <AppShell
        left={<div data-testid="L">left slot</div>}
        right={<div data-testid="R">right slot</div>}
      />,
    );

    // Slots should not be in the document at all — the fallback replaces
    // the shell, not wraps it.
    expect(screen.queryByTestId("L")).toBeNull();
    expect(screen.queryByTestId("R")).toBeNull();
    expect(
      screen.getByRole("heading", { name: /desktop required/i }),
    ).toBeInTheDocument();
  });

  it("swaps back to the shell when the viewport grows past 1080 at runtime", () => {
    setViewportWidth(800);

    render(
      <AppShell
        left={<div data-testid="L">left slot</div>}
        right={<div data-testid="R">right slot</div>}
      />,
    );

    // Sanity check: starts on the fallback card.
    expect(
      screen.getByRole("heading", { name: /desktop required/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("L")).toBeNull();

    // Resize up. Wrap in `act` so React flushes the state update from the
    // component's resize listener before we assert.
    act(() => {
      setViewportWidth(1200);
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByTestId("L")).toBeInTheDocument();
    expect(screen.getByTestId("R")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /desktop required/i }),
    ).toBeNull();
  });
});
