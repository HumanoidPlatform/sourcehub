// The notifications page: the whole history, not the bell's latest eight.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { NotificationsPage } from "./pages";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve({ unread: 0, items: [], has_more: false })),
  post: vi.fn((_path: string): Promise<unknown> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

const row = (id: string, body: string, read = false) => ({
  id, body, link_page: "requests", read, created_at: new Date().toISOString(),
});

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter>
        <ToastProvider>
          <NotificationsPage />
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  api.get.mockReset();
  api.post.mockReset().mockImplementation(() => Promise.resolve());
});

describe("notifications page", () => {
  it("reads back through the whole history, a page at a time", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(
        path.includes("before=n2")
          ? { unread: 2, items: [row("n3", "Oldest one", true)], has_more: false }
          : { unread: 2, items: [row("n1", "Newest one"), row("n2", "Middle one")], has_more: true },
      ),
    );
    renderPage();
    expect(await screen.findByText("Newest one")).toBeTruthy();
    expect(screen.queryByText("Oldest one")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Load older" }));
    expect(await screen.findByText("Oldest one")).toBeTruthy();
    // continued after the last one shown, rather than asking for page 2 of a
    // list that may have changed underneath
    expect(api.get).toHaveBeenLastCalledWith("/notifications?limit=25&before=n2");
    expect(screen.queryByRole("button", { name: "Load older" })).toBeNull();
    expect(screen.getByText("Newest one")).toBeTruthy();
  });

  it("asks the server for unread ones only, and says when there are none", async () => {
    api.get.mockImplementation((path: string) =>
      Promise.resolve(
        path.includes("unread_only=true")
          ? { unread: 0, items: [], has_more: false }
          : { unread: 0, items: [row("n1", "Read already", true)], has_more: false },
      ),
    );
    renderPage();
    expect(await screen.findByText("Read already")).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Unread" }));
    expect(await screen.findByText("You're all caught up")).toBeTruthy();
    expect(api.get).toHaveBeenLastCalledWith("/notifications?limit=25&unread_only=true");
  });

  it("marks one read, or all of them", async () => {
    api.get.mockResolvedValue({ unread: 1, items: [row("n1", "A proposal arrived")], has_more: false });
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mark read: A proposal arrived" }));
    expect(api.post).toHaveBeenCalledWith("/notifications/n1/read");

    fireEvent.click(screen.getByRole("button", { name: "Mark all read" }));
    expect(api.post).toHaveBeenCalledWith("/notifications/read");
  });

  it("offers nothing to mark when everything is read", async () => {
    api.get.mockResolvedValue({ unread: 0, items: [row("n1", "Old news", true)], has_more: false });
    renderPage();
    expect(await screen.findByText("Old news")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Mark all read" }) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: /^Mark read/ })).toBeNull();
  });

  it("says so when marking fails, instead of leaving the row silently unread", async () => {
    api.get.mockResolvedValue({ unread: 1, items: [row("n1", "A proposal arrived")], has_more: false });
    api.post.mockImplementation(() => Promise.reject(new Error("Service unavailable")));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Mark read: A proposal arrived" }));
    await waitFor(() => expect(screen.getByText("Could not mark it read")).toBeTruthy());
  });
});
