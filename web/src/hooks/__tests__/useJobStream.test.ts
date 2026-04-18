/**
 * Tests for <useJobStream>.
 *
 * Strategy:
 *   - Mock `@/api/client` (getJobStatus) and `@/api/sse` (openEventStream).
 *   - `openEventStream` mock captures the `StreamOptions` so each test can
 *     drive the reducer synchronously via `act(() => capturedOptions.onEvent(...))`.
 *   - `getJobStatus` mock is set per-test to shape the seed fetch result.
 *
 * We test behaviour, not implementation:
 *   1. null jobId -> idle-ish initial state
 *   2. stage_start sets the stage active and updates currentStage
 *   3. stage_complete flips to done + records duration
 *   4. done event: all stages done, outputUrl set, status succeeded
 *   5. error event: status failed + error message captured
 *   6. log events append in order + get capped at 500
 *   7. reset() returns state to initial
 *   8. onStatusSync merges current_stage from a re-sync JobStatus
 */

import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import type { JobStatus, SSEEvent } from "@/api/schemas";
import type { StreamOptions } from "@/api/sse";

// ---------------------------------------------------------------------------
// Module mocks — hoisted by Vitest. `capturedOptions` lets each test reach
// into the latest openEventStream invocation and drive its callbacks.
// ---------------------------------------------------------------------------

let capturedOptions: StreamOptions | null = null;
const mockClose = vi.fn();

vi.mock("@/api/sse", () => ({
  openEventStream: vi.fn((_jobId: string, opts: StreamOptions) => {
    capturedOptions = opts;
    return { close: mockClose, readyState: 1 };
  }),
}));

vi.mock("@/api/client", () => ({
  getJobStatus: vi.fn(),
  // ApiError pass-through so import-site consumers don't break when the hook
  // imports from "@/api/client" as well. Not used directly in these tests.
  ApiError: class ApiError extends Error {
    status: number;
    detail: unknown;
    constructor(status: number, detail: unknown) {
      super(`API error ${status}`);
      this.status = status;
      this.detail = detail;
    }
  },
}));

import { useJobStream } from "../useJobStream";
import { getJobStatus } from "@/api/client";
import { openEventStream } from "@/api/sse";

function baseStatus(overrides: Partial<JobStatus> = {}): JobStatus {
  return {
    job_id: "job-1",
    status: "running",
    source_lang: "en",
    target_lang: "es",
    created_at: 0,
    current_stage: null,
    finished_at: null,
    error: null,
    output_available: false,
    ...overrides,
  };
}

beforeEach(() => {
  capturedOptions = null;
  mockClose.mockReset();
  vi.mocked(openEventStream).mockClear();
  vi.mocked(getJobStatus).mockReset();
  vi.mocked(getJobStatus).mockResolvedValue(baseStatus());
});

describe("useJobStream", () => {
  it("starts in initial state when jobId is null", () => {
    const { result } = renderHook(() => useJobStream(null));

    expect(result.current.state.status).toBe("connecting");
    expect(result.current.state.currentStage).toBeNull();
    expect(result.current.state.outputUrl).toBeNull();
    expect(result.current.state.error).toBeNull();
    expect(result.current.state.logs).toEqual([]);
    expect(result.current.state.stages).toEqual({
      s1: "pending",
      s2: "pending",
      s3: "pending",
      s4: "pending",
      s5: "pending",
    });
    // No SSE subscription when jobId is null.
    expect(vi.mocked(openEventStream)).not.toHaveBeenCalled();
  });

  it("marks a stage active on stage_start", async () => {
    const { result } = renderHook(() => useJobStream("job-1"));

    await waitFor(() => expect(capturedOptions).not.toBeNull());

    act(() => {
      capturedOptions!.onEvent({
        type: "stage_start",
        stage: "s2",
        ts: 1,
      } satisfies SSEEvent);
    });

    expect(result.current.state.stages.s2).toBe("active");
    expect(result.current.state.stages.s1).toBe("done"); // preceding flipped
    expect(result.current.state.stages.s3).toBe("pending");
    expect(result.current.state.currentStage).toBe("s2");
  });

  it("flips a stage to done on stage_complete and records duration", async () => {
    const { result } = renderHook(() => useJobStream("job-1"));
    await waitFor(() => expect(capturedOptions).not.toBeNull());

    act(() => {
      capturedOptions!.onEvent({
        type: "stage_start",
        stage: "s1",
        ts: 1,
      });
    });
    act(() => {
      capturedOptions!.onEvent({
        type: "stage_complete",
        stage: "s1",
        duration_ms: 2345,
        ts: 2,
      });
    });

    expect(result.current.state.stages.s1).toBe("done");
    expect(result.current.state.stageDurations.s1).toBe(2345);
    expect(result.current.state.currentStage).toBeNull();
  });

  it("on done, marks all stages done, sets outputUrl and status=succeeded", async () => {
    const { result } = renderHook(() => useJobStream("job-1"));
    await waitFor(() => expect(capturedOptions).not.toBeNull());

    act(() => {
      capturedOptions!.onEvent({
        type: "done",
        output_url: "/api/jobs/job-1/output",
        ts: 99,
      });
    });

    expect(result.current.state.status).toBe("succeeded");
    expect(result.current.state.outputUrl).toBe("/api/jobs/job-1/output");
    expect(result.current.state.stages).toEqual({
      s1: "done",
      s2: "done",
      s3: "done",
      s4: "done",
      s5: "done",
    });
    // Stream closed after terminal event.
    expect(mockClose).toHaveBeenCalled();
  });

  it("on error, sets status=failed and captures the message + traceback", async () => {
    const { result } = renderHook(() => useJobStream("job-1"));
    await waitFor(() => expect(capturedOptions).not.toBeNull());

    act(() => {
      capturedOptions!.onEvent({
        type: "error",
        message: "boom",
        traceback: "Traceback (...)",
        ts: 7,
      });
    });

    expect(result.current.state.status).toBe("failed");
    expect(result.current.state.error).toEqual({
      message: "boom",
      traceback: "Traceback (...)",
    });
    expect(mockClose).toHaveBeenCalled();
  });

  it("appends log events in order and caps at 500", async () => {
    const { result } = renderHook(() => useJobStream("job-1"));
    await waitFor(() => expect(capturedOptions).not.toBeNull());

    act(() => {
      for (let i = 0; i < 505; i++) {
        capturedOptions!.onEvent({
          type: "log",
          level: "info",
          message: `m${i}`,
          ts: i,
        });
      }
    });

    // Oldest 5 should be dropped; newest preserved; order preserved.
    expect(result.current.state.logs).toHaveLength(500);
    expect(result.current.state.logs[0]!.message).toBe("m5");
    expect(result.current.state.logs[499]!.message).toBe("m504");
  });

  it("reset() returns state to initial", async () => {
    const { result } = renderHook(() => useJobStream("job-1"));
    await waitFor(() => expect(capturedOptions).not.toBeNull());

    act(() => {
      capturedOptions!.onEvent({
        type: "stage_start",
        stage: "s3",
        ts: 1,
      });
      capturedOptions!.onEvent({
        type: "log",
        level: "info",
        message: "hi",
        ts: 1,
      });
    });

    expect(result.current.state.stages.s3).toBe("active");
    expect(result.current.state.logs).toHaveLength(1);

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.status).toBe("connecting");
    expect(result.current.state.currentStage).toBeNull();
    expect(result.current.state.logs).toEqual([]);
    expect(result.current.state.stages.s3).toBe("pending");
  });

  it("onStatusSync merges current_stage from a JobStatus snapshot", async () => {
    const { result } = renderHook(() => useJobStream("job-1"));
    await waitFor(() => expect(capturedOptions).not.toBeNull());

    act(() => {
      capturedOptions!.onStatusSync?.(
        baseStatus({ status: "running", current_stage: "s4" }),
      );
    });

    expect(result.current.state.currentStage).toBe("s4");
    expect(result.current.state.stages.s4).toBe("active");
    // preceding stages marked done
    expect(result.current.state.stages.s1).toBe("done");
    expect(result.current.state.stages.s3).toBe("done");
    expect(result.current.state.stages.s5).toBe("pending");
  });
});
