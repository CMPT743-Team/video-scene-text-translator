/**
 * Test for <ErrorAlert>. Verifies the message always renders, and that the
 * traceback expands/collapses behind a toggle when present.
 */

import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { ErrorAlert } from "../ErrorAlert";

describe("<ErrorAlert>", () => {
  it("renders the message and toggles traceback visibility", async () => {
    const user = userEvent.setup();
    render(<ErrorAlert message="boom" traceback="Traceback: nope" />);

    expect(screen.getByText("boom")).toBeInTheDocument();

    // Traceback hidden initially.
    expect(screen.queryByText(/Traceback: nope/)).toBeNull();

    await user.click(screen.getByRole("button", { name: /show details/i }));
    expect(screen.getByText(/Traceback: nope/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /hide details/i }));
    expect(screen.queryByText(/Traceback: nope/)).toBeNull();
  });
});
