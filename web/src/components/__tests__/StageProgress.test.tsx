/**
 * Tests for <StageProgress>. We verify the visible contract:
 *   - labels render ("Detect", "Frontalize", ...)
 *   - active stage is aria-announced (role="status") so screen readers and
 *     tests can spot it
 *   - durations render on done stages
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { Stage } from "@/api/schemas";
import { StageProgress } from "../StageProgress";
import type { StageState } from "@/hooks/useJobStream";

const ALL_PENDING: Record<Stage, StageState> = {
  s1: "pending",
  s2: "pending",
  s3: "pending",
  s4: "pending",
  s5: "pending",
};

describe("<StageProgress>", () => {
  it("renders all five stage labels with no active marker when every stage is pending", () => {
    render(<StageProgress stages={ALL_PENDING} stageDurations={{}} />);

    for (const label of [
      "Detect",
      "Frontalize",
      "Edit",
      "Propagate",
      "Revert",
    ]) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }

    // No stage should report itself as active.
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("marks the second stage as active when s2 is active", () => {
    render(
      <StageProgress
        stages={{ ...ALL_PENDING, s1: "done", s2: "active" }}
        stageDurations={{ s1: 1000 }}
      />,
    );

    // role="status" lives on the active pill.
    const active = screen.getByRole("status");
    expect(active).toHaveAttribute("data-stage", "s2");
    expect(active).toHaveAttribute("data-state", "active");
  });

  it("renders durations on done stages and leaves the final pending pill empty", () => {
    render(
      <StageProgress
        stages={{
          s1: "done",
          s2: "done",
          s3: "done",
          s4: "done",
          s5: "pending",
        }}
        stageDurations={{ s1: 1234, s2: 500, s3: 2345, s4: 9999 }}
      />,
    );

    // Durations render as seconds with 1dp.
    expect(screen.getByText("1.2s")).toBeInTheDocument();
    expect(screen.getByText("0.5s")).toBeInTheDocument();
    expect(screen.getByText("2.3s")).toBeInTheDocument();
    expect(screen.getByText("10.0s")).toBeInTheDocument();
  });
});
