/**
 * Tests for <StatusBand> — the thin header row at the top of the right
 * column that shows "PIPELINE · ONE WINDOW" on the left and a status pill
 * on the right.
 *
 * The pill's label + styling varies by `kind`; the left label is constant.
 * Layout / color tokens are presentational and not covered here — we only
 * pin the user-visible text contract per kind.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { StatusBand } from "../right/StatusBand";
import type { StatusBandKind } from "../right/StatusBand";

describe("<StatusBand>", () => {
  it("always renders the 'PIPELINE · ONE WINDOW' left label", () => {
    // Sweep every kind — the left label never changes.
    const kinds: StatusBandKind[] = [
      "idle",
      "uploading",
      "connecting",
      "running",
      "succeeded",
      "failed",
      "blocked",
    ];

    for (const kind of kinds) {
      const { unmount } = render(<StatusBand kind={kind} />);
      expect(screen.getByText(/PIPELINE . ONE WINDOW/i)).toBeInTheDocument();
      unmount();
    }
  });

  it("renders 'IDLE' when kind=idle", () => {
    render(<StatusBand kind="idle" />);
    expect(screen.getByText("IDLE")).toBeInTheDocument();
  });

  it("renders 'CLIENT → SERVER' when kind=uploading", () => {
    render(<StatusBand kind="uploading" />);
    // Don't pin the arrow glyph exactly — accept either → or -> or ->.
    expect(screen.getByText(/CLIENT.+SERVER/)).toBeInTheDocument();
  });

  it("renders 'CONNECTING' when kind=connecting", () => {
    render(<StatusBand kind="connecting" />);
    expect(screen.getByText("CONNECTING")).toBeInTheDocument();
  });

  it("renders 'LIVE' when kind=running", () => {
    render(<StatusBand kind="running" />);
    // The pulsing dot is decorative; just match the LIVE text.
    expect(screen.getByText(/LIVE/)).toBeInTheDocument();
  });

  it("renders 'READY' when kind=succeeded", () => {
    render(<StatusBand kind="succeeded" />);
    expect(screen.getByText("READY")).toBeInTheDocument();
  });

  it("renders 'ERR' when kind=failed", () => {
    render(<StatusBand kind="failed" />);
    expect(screen.getByText(/ERR/)).toBeInTheDocument();
  });

  it("renders 'BLOCKED' when kind=blocked", () => {
    render(<StatusBand kind="blocked" />);
    expect(screen.getByText(/BLOCKED/)).toBeInTheDocument();
  });
});
