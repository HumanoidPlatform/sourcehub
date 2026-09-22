// The phone/tablet navigation drawer.
//
// Below 840px the stylesheet hides the rail off-canvas and shows it only for
// .rail[data-open]. The toggle that sets that attribute was styled and never
// rendered, so on a phone there was no way to reach any page. jsdom applies no
// media queries, so these tests pin the behaviour the CSS depends on: the
// attribute, the toggle's state, and every way the drawer closes.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { Link, MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider, View } from "@ds/primitives";
import { Shell } from "./Shell";

vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Priya Nair",
    email: "priya@acme.example",
    org_name: "Acme Retail Analytics",
    org_kind: "client",
    role: "client",
    capabilities: [],
  }),
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

// Hoisted so the bell tests can change what the API answers and see what was sent.
const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve({ unread: 0, items: [] })),
  post: vi.fn((_path: string): Promise<unknown> => Promise.resolve()),
}));
vi.mock("@api/client", () => api);

function renderShell() {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={["/"]}>
        <ToastProvider>
          <Shell>
            <p>page content</p>
          </Shell>
        </ToastProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return {
    toggle: screen.getByRole("button", { name: "Open navigation" }),
    rail: document.getElementById("primary-rail")!,
  };
}

beforeEach(() => {
  api.get.mockReset().mockImplementation(() => Promise.resolve({ unread: 0, items: [] }));
  api.post.mockReset().mockImplementation(() => Promise.resolve());
});

describe("navigation drawer", () => {
  it("starts closed with NO data-open attribute — not data-open=\"false\"", () => {
    const { toggle, rail } = renderShell();
    // .rail[data-open] matches on presence; a stringified false would pin the
    // drawer open on every phone
    expect(rail.hasAttribute("data-open")).toBe(false);
    expect(toggle.getAttribute("aria-expanded")).toBe("false");
    expect(toggle.getAttribute("aria-controls")).toBe("primary-rail");
  });

  it("opens, moves focus into the drawer, and shows the scrim", () => {
    const { toggle, rail } = renderShell();
    fireEvent.click(toggle);
    expect(rail.hasAttribute("data-open")).toBe(true);
    expect(toggle.getAttribute("aria-expanded")).toBe("true");
    expect(toggle.getAttribute("aria-label")).toBe("Close navigation");
    expect(document.activeElement?.textContent).toBe("Overview");
    expect(document.querySelector(".scrim")).not.toBeNull();
  });

  it("closes on Escape and returns focus to the toggle", () => {
    const { toggle, rail } = renderShell();
    fireEvent.click(toggle);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(rail.hasAttribute("data-open")).toBe(false);
    expect(document.activeElement).toBe(toggle);
    expect(document.querySelector(".scrim")).toBeNull();
  });

  it("closes when the scrim is tapped", () => {
    const { toggle, rail } = renderShell();
    fireEvent.click(toggle);
    fireEvent.click(document.querySelector(".scrim")!);
    expect(rail.hasAttribute("data-open")).toBe(false);
  });

  it("closes after following a link, so the page you chose is not covered", () => {
    const { toggle, rail } = renderShell();
    fireEvent.click(toggle);
    fireEvent.click(screen.getByRole("link", { name: "Requests" }));
    expect(rail.hasAttribute("data-open")).toBe(false);
  });
});

// Following a link in a single-page app reloads nothing, so nothing tells a
// screen reader the page changed and focus stays on the link just used.
describe("page change", () => {
  function renderRoutes() {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter initialEntries={["/"]}>
          <ToastProvider>
            <Shell>
              <Routes>
                <Route path="/" element={<View title="Good day"><Link to="/bare">A page with no heading</Link></View>} />
                <Route path="/requests" element={<View title="Requests"><Link to="/requests?status=open">Open only</Link></View>} />
                <Route path="/bare" element={<p>no heading here</p>} />
              </Routes>
            </Shell>
          </ToastProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );
  }

  it("leaves focus alone on first load — the browser has already announced the page", () => {
    renderRoutes();
    expect(document.activeElement).toBe(document.body);
  });

  it("moves focus to the new page's heading and returns to the top", () => {
    const scrollTo = vi.spyOn(window, "scrollTo");
    renderRoutes();
    fireEvent.click(screen.getByRole("link", { name: "Requests" }));
    expect(document.activeElement).toBe(screen.getByRole("heading", { level: 1, name: "Requests" }));
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
    scrollTo.mockRestore();
  });

  it("falls back to the main region when a page has no heading", () => {
    renderRoutes();
    fireEvent.click(screen.getByRole("link", { name: "A page with no heading" }));
    expect(document.activeElement).toBe(screen.getByRole("main"));
  });

  it("does not move focus when only the query string changes", () => {
    renderRoutes();
    fireEvent.click(screen.getByRole("link", { name: "Requests" }));
    const filter = screen.getByRole("link", { name: "Open only" });
    filter.focus();
    fireEvent.click(filter);
    expect(document.activeElement).toBe(filter);
  });
});

describe("notification bell", () => {
  const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();
  function withNotifications() {
    api.get.mockImplementation(() =>
      Promise.resolve({
        unread: 1,
        items: [
          { id: "n1", body: "A proposal arrived on REQ-7", link_page: "requestDetail", link_params: { id: "r7" }, read: false, created_at: minutesAgo(5) },
          { id: "n2", body: "Contract CT-2 signed", link_page: "contracts", read: true, created_at: minutesAgo(90) },
        ],
      }),
    );
    renderShell();
    return screen.findByRole("button", { name: "Notifications, 1 unread" });
  }

  it("is a labelled panel its button controls, not a menu that ignores arrow keys", async () => {
    const bell = await withNotifications();
    expect(bell.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(bell);
    const panel = screen.getByRole("dialog", { name: "Notifications" });
    expect(bell.getAttribute("aria-expanded")).toBe("true");
    expect(bell.getAttribute("aria-controls")).toBe(panel.id);
    expect(screen.queryByRole("menu")).toBeNull();
  });

  it("marks a notification read when it is opened", async () => {
    fireEvent.click(await withNotifications());
    fireEvent.click(screen.getByRole("link", { name: /A proposal arrived on REQ-7/ }));
    expect(api.post).toHaveBeenCalledWith("/notifications/n1/read");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not post for one that is already read", async () => {
    fireEvent.click(await withNotifications());
    fireEvent.click(screen.getByRole("link", { name: /Contract CT-2 signed/ }));
    expect(api.post).not.toHaveBeenCalled();
  });

  it("says which are unread and when each arrived", async () => {
    fireEvent.click(await withNotifications());
    expect(screen.getByRole("link", { name: /^Unread: A proposal arrived on REQ-7 5 min ago$/ })).toBeTruthy();
    expect(screen.getByRole("link", { name: /^Contract CT-2 signed 1 h ago$/ })).toBeTruthy();
  });

  it("links to the full list, and closes on Escape back to its button", async () => {
    const bell = await withNotifications();
    fireEvent.click(bell);
    expect(screen.getByRole("link", { name: "See all notifications" }).getAttribute("href")).toBe("/notifications");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.activeElement).toBe(bell);
  });
});

describe("brand", () => {
  it("names the company once, quietly, below the wordmark", () => {
    renderShell();
    expect(screen.getAllByText("A CoSarathi product")).toHaveLength(1);
  });

  it("leads home when the logo or the name is clicked", () => {
    renderShell();
    const home = screen.getByRole("link", { name: "DataMind360 home" });
    expect(home.getAttribute("href")).toBe("/");
    // both the mark and the wordmark are inside the one link
    expect(home.querySelector(".mark-logo")).not.toBeNull();
    expect(home.querySelector(".mark-by")?.textContent).toBe("A CoSarathi product");
    expect(home.textContent).toContain("DataMind360");
  });

  it("shows the logo without making a screen reader say the name twice", () => {
    renderShell();
    const logo = document.querySelector(".mark-logo") as HTMLImageElement;
    expect(logo.getAttribute("src")).toBe("/brand/mark.png");
    expect(logo.getAttribute("alt")).toBe("");
    // the name itself is live text, not part of the image
    expect(screen.getByText("DataMind360")).toBeTruthy();
  });
});
