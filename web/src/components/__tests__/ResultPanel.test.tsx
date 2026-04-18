/**
 * Test for <ResultPanel>. Confirms the download anchor and the <video>
 * element both point at the correct output URL.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { ResultPanel } from "../ResultPanel";

describe("<ResultPanel>", () => {
  it("renders a playable video and a download link at the output URL", () => {
    const { container } = render(
      <ResultPanel jobId="job-1" outputUrl="/api/jobs/job-1/output" />,
    );

    // <video> query: there's no implicit ARIA role, so fall through the DOM.
    const video = container.querySelector("video");
    expect(video).not.toBeNull();
    // <source> is the canonical way to set the MP4 type for `<video>`.
    const source = video!.querySelector("source");
    expect(source).toHaveAttribute("src", "/api/jobs/job-1/output");
    expect(source).toHaveAttribute("type", "video/mp4");

    const download = screen.getByRole("link", { name: /download/i });
    expect(download).toHaveAttribute("href", "/api/jobs/job-1/output");
    expect(download).toHaveAttribute("download");
  });
});
