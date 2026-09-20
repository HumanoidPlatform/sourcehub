// The dialog that replaced window.prompt: it must refuse a reason the server
// would reject, and a failure must leave it open with the reason intact.

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ReasonDialog } from "./reason-dialog";

function open(onConfirm: (reason: string) => Promise<unknown>) {
  const onClose = vi.fn();
  render(
    <ReasonDialog title="Reject this equipment request" confirmLabel="Reject" onConfirm={onConfirm} onClose={onClose} />,
  );
  const type = (text: string) => fireEvent.change(screen.getByLabelText(/Reason/), { target: { value: text } });
  const submit = () => fireEvent.click(screen.getByRole("button", { name: "Reject" }));
  return { onClose, type, submit };
}

describe("reason dialog", () => {
  it("refuses a reason shorter than the server's minimum, without calling it", () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    const { type, submit } = open(onConfirm);
    type("ok");
    submit();
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.getByText(/Give a reason/)).toBeTruthy();
  });

  it("sends the trimmed reason and closes when the action succeeds", async () => {
    const onConfirm = vi.fn(() => Promise.resolve());
    const { onClose, type, submit } = open(onConfirm);
    type("  No units free until next month  ");
    submit();
    expect(onConfirm).toHaveBeenCalledWith("No units free until next month");
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("stays open and says why when the action fails", async () => {
    const { onClose, type, submit } = open(() => Promise.reject(new Error("This request was already decided.")));
    type("No units free until next month");
    submit();
    expect(await screen.findByText("This request was already decided.")).toBeTruthy();
    expect(onClose).not.toHaveBeenCalled();
    expect((screen.getByLabelText(/Reason/) as HTMLTextAreaElement).value).toBe("No units free until next month");
  });
});
