// The shared rating pieces (db/380): the star formatter, the comment minimum,
// and the one dialog that posts each kind to its subject's own URL.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
  post: vi.fn((_path: string, _body?: unknown): Promise<unknown> => Promise.resolve({})),
}));
vi.mock("@api/client", () => api);

import { ToastProvider } from "@ds/primitives";
import { RATING_COMMENT_MIN, RateDialog, stars, type RateTarget } from "./rating";

function show(target: RateTarget) {
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RateDialog target={target} onClose={onClose} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return onClose;
}

beforeEach(() => vi.clearAllMocks());

describe("stars", () => {
  it("prints the average to one decimal with how many gave it", () => {
    expect(stars(4.333, 7)).toBe("★ 4.3 (7)");
    expect(stars("4.0", 1)).toBe("★ 4.0 (1)");
  });
  it("never shows a zero for nobody having rated", () => {
    expect(stars(null, 0)).toBe("No ratings yet");
    expect(stars(undefined, undefined)).toBe("No ratings yet");
    expect(stars(4.5, 0)).toBe("No ratings yet");
  });
});

describe("RateDialog", () => {
  it("holds the button until the comment is long enough", async () => {
    show({ kind: "client", contractId: "c1", name: "Acme" });
    const save = screen.getByRole("button", { name: "Save rating" }) as HTMLButtonElement;
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Comment/), { target: { value: "ab" } });
    expect(save.disabled).toBe(true);
    fireEvent.change(screen.getByLabelText(/Comment/), { target: { value: "a".repeat(RATING_COMMENT_MIN) } });
    expect(save.disabled).toBe(false);
  });

  it.each([
    [{ kind: "client", contractId: "c1", name: "Acme" } as RateTarget, "/contracts/c1/rating"],
    [{ kind: "supplier", taskId: "t1", taskRef: "TSK-01", name: "Crowd" } as RateTarget, "/tasks/t1/rating"],
    [{ kind: "worker", assignmentId: "a1", name: "Priya" } as RateTarget, "/assignments/a1/rating"],
  ])("posts %o to its subject's own URL", async (target, url) => {
    const onClose = show(target);
    fireEvent.change(screen.getByLabelText(/How/), { target: { value: "4" } });
    fireEvent.change(screen.getByLabelText(/Comment/), { target: { value: "  Solid work.  " } });
    fireEvent.click(screen.getByRole("button", { name: "Save rating" }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith(url, { score: 4, comment: "Solid work." }));
    await waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it("shows the database's refusal in its own words and stays open", async () => {
    api.post.mockRejectedValueOnce(new Error("rating: TSK-02 has not passed QA; its supplier is rated once it has"));
    const onClose = show({ kind: "supplier", taskId: "t2", taskRef: "TSK-02", name: "Crowd" });
    fireEvent.change(screen.getByLabelText(/Comment/), { target: { value: "Good." } });
    fireEvent.click(screen.getByRole("button", { name: "Save rating" }));
    await screen.findByText(/has not passed QA/);
    expect(onClose).not.toHaveBeenCalled();
  });

  it("tells a supplier who will and will not see a worker rating", () => {
    show({ kind: "worker", assignmentId: "a1", name: "Priya" });
    expect(screen.getByText(/never by Priya, never by your delivery partner/)).toBeTruthy();
    expect(screen.getByText(/cannot be changed once saved/)).toBeTruthy();
  });
});
