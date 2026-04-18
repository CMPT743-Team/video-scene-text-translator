/**
 * Tests for <LogPanel>. We assert:
 *   1. messages render in the given order, one line per entry.
 *   2. on a log append, the scroll container's `scrollTop` follows to
 *      `scrollHeight` (auto-scroll contract).
 *
 * For #2 jsdom doesn't perform real layout, so scrollHeight stays 0. We
 * sidestep that by mocking scrollHeight on the element under test and
 * observing that the component *writes* scrollTop to it.
 */

import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";

import { LogPanel } from "../LogPanel";

describe("<LogPanel>", () => {
  it("renders all messages in order", () => {
    const logs = [
      { level: "info" as const, message: "alpha", ts: 1 },
      { level: "warning" as const, message: "beta", ts: 2 },
      { level: "error" as const, message: "gamma", ts: 3 },
    ];

    const { container } = render(<LogPanel logs={logs} />);

    const lines = container.querySelectorAll("[data-testid='log-line']");
    expect(lines).toHaveLength(3);
    expect(lines[0]!.textContent).toContain("alpha");
    expect(lines[1]!.textContent).toContain("beta");
    expect(lines[2]!.textContent).toContain("gamma");
    // Ordering preserved.
    const indexOfAlpha = container.innerHTML.indexOf("alpha");
    const indexOfGamma = container.innerHTML.indexOf("gamma");
    expect(indexOfAlpha).toBeLessThan(indexOfGamma);
  });

  it("auto-scrolls to the bottom when logs grow", () => {
    const first = [{ level: "info" as const, message: "first", ts: 1 }];
    const { container, rerender } = render(<LogPanel logs={first} />);

    const panel = container.querySelector(
      "[data-testid='log-panel']",
    ) as HTMLElement;
    expect(panel).not.toBeNull();

    // Fake a filled-in scroll area since jsdom doesn't lay out. The component
    // should read scrollHeight on effect and assign it to scrollTop.
    Object.defineProperty(panel, "scrollHeight", {
      configurable: true,
      value: 1234,
    });

    rerender(
      <LogPanel
        logs={[
          ...first,
          { level: "info" as const, message: "second", ts: 2 },
        ]}
      />,
    );

    expect(panel.scrollTop).toBe(1234);
  });
});
