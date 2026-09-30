// The directory as a client meets it: every vendor as a card with what it
// does and how its work was received, filters that narrow as they are chosen
// and live in the address bar, and a table for comparing many.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import type { Vendor } from "@api/types";
import { ALL, HELIX, MERIDIAN, NORTHSTAR } from "./fixtures";

const api = vi.hoisted(() => ({
  get: vi.fn((_path: string): Promise<unknown> => Promise.resolve(null)),
}));
vi.mock("@api/client", () => api);

vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Priya Shah", org_id: "o-acme", org_name: "Acme Retail Analytics",
    org_kind: "client", role: "client", capabilities: ["vendor.read"],
  }),
}));

import { VendorDetailPage, VendorsPage } from "./pages";

let vendors: Vendor[] = [...ALL];
let failing = false;

function show(entry = "/vendors") {
  const router = createMemoryRouter(
    [
      { path: "/vendors", element: <VendorsPage /> },
      { path: "/vendors/:id", element: <VendorDetailPage /> },
    ],
    { initialEntries: [entry] },
  );
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
  return router;
}

const cards = () => screen.getAllByRole("article");
const shownNames = () => cards().map((c) => c.getAttribute("aria-label"));
const count = () => screen.getByRole("status").textContent;
const choose = (label: RegExp, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

beforeEach(() => {
  vendors = [...ALL];
  failing = false;
  localStorage.clear();
  api.get.mockReset().mockImplementation((path: string) => {
    if (path === "/vendors") {
      return failing ? Promise.reject(new Error("Request failed (403)")) : Promise.resolve({ items: vendors });
    }
    if (path.endsWith("/logo-url")) return Promise.resolve({ url: "https://blob.example/l.png", expires_in: 900 });
    return Promise.resolve(null);
  });
});

describe("the cards", () => {
  it("shows every vendor, best rated first, with a count", async () => {
    show();
    await waitFor(() => expect(cards()).toHaveLength(3));
    expect(shownNames()).toEqual(["NorthStar Delivery Partners", "Meridian Field Ops", "Helix Data Collective"]);
    expect(count()).toBe("3 vendors");
    expect(api.get).toHaveBeenCalledWith("/vendors");
  });

  it("says what a vendor does and how its work was received", async () => {
    show();
    const c = within(await screen.findByRole("article", { name: NORTHSTAR.name }));
    expect(c.getByText("Pune, India")).toBeTruthy();
    expect(c.getByText(/Field data collection across South Asia/)).toBeTruthy();
    for (const tag of ["Video", "Image", "Retail", "Automotive", "ISO 27001", "SOC 2"]) {
      expect(c.getByText(tag)).toBeTruthy();
    }
    // regions as codes, with the country's name for anyone who cannot see them
    expect(c.getByText("IN")).toBeTruthy();
    expect(c.getByText("(India)")).toBeTruthy();
    expect(c.getByRole("img", { name: "4.6 out of 5, 12 ratings" })).toBeTruthy();
    expect(c.getByText("94%")).toBeTruthy();
    expect(c.getByText("92%")).toBeTruthy();
    expect(c.getByText("Accepted first time")).toBeTruthy();
    expect(c.getByText(/10 yrs in business/)).toBeTruthy();
    expect(c.getByText(/14 projects here/)).toBeTruthy();
  });

  it("makes no fair work claim, though the flag is set", async () => {
    // Only the seed files write the flag, so a badge would pass seeded data
    // off as an attestation.
    expect(NORTHSTAR.fair_work_attested).toBe(true);
    show();
    await waitFor(() => expect(cards()).toHaveLength(3));
    for (const c of cards()) expect(c.textContent).not.toMatch(/fair\s*work/i);
  });

  it("is one link to the vendor's page, and the website is a link of its own", async () => {
    show();
    const c = within(await screen.findByRole("article", { name: NORTHSTAR.name }));
    const links = c.getAllByRole("link");
    expect(links.map((l) => l.getAttribute("href"))).toEqual(["/vendors/v-ns", "https://northstar.example"]);
    expect(links[0]!.textContent).toBe(NORTHSTAR.name);
    const site = links[1]!;
    expect(site.getAttribute("target")).toBe("_blank");
    expect(site.getAttribute("rel")).toBe("noopener noreferrer");
  });

  it("calls a vendor with no record new, instead of showing it empty figures", async () => {
    show();
    const c = within(await screen.findByRole("article", { name: HELIX.name }));
    expect(c.getByText("New on DataMind360")).toBeTruthy();
    expect(c.queryByText("On time")).toBeNull();
    expect(c.queryByRole("img")).toBeNull();
    expect(c.queryByText(/0 projects/)).toBeNull();
    expect(c.queryByText("0%")).toBeNull();
  });

  it("shows a dash, not 0%, for a figure that could not be measured", async () => {
    vendors = [{ ...MERIDIAN, performance: { ...MERIDIAN.performance, on_time_pct: null } }];
    show();
    const c = within(await screen.findByRole("article", { name: MERIDIAN.name }));
    expect(c.getByText("—")).toBeTruthy();
    expect(c.getByText("65%")).toBeTruthy();
    expect(c.queryByText("0%")).toBeNull();
  });

  it("never shows a commercial field, whatever the API sends", async () => {
    vendors = [{ ...NORTHSTAR, plan: "Partner Pro", billing_status: "overdue", legal_name: "NS Holdings" } as Vendor];
    show();
    const c = await screen.findByRole("article", { name: NORTHSTAR.name });
    expect(c.textContent).not.toMatch(/Partner Pro|overdue|NS Holdings/);
  });
});

describe("what a figure means", () => {
  async function tip(about: string, vendor = NORTHSTAR.name) {
    const c = within(await screen.findByRole("article", { name: vendor }));
    const button = c.getByRole("button", { name: `About ${about}` });
    const text = document.getElementById(button.getAttribute("aria-describedby")!)!;
    return { button, text, wrapper: button.parentElement! };
  }

  it("has an i beside each figure, closed until it is asked", async () => {
    show();
    const onTime = await tip("On time");
    const first = await tip("Accepted first time");
    expect(onTime.text.hidden).toBe(true);
    expect(first.text.hidden).toBe(true);
    expect(onTime.text.getAttribute("role")).toBe("tooltip");
    expect(onTime.text.textContent).toMatch(/delivered on or before the date the client asked for/);
    expect(first.text.textContent).toMatch(/without sending the delivery back/);
    // the one in the right-hand column opens towards the middle of the card
    expect(onTime.wrapper.getAttribute("data-align")).toBe("start");
    expect(first.wrapper.getAttribute("data-align")).toBe("end");
  });

  it("opens on hover, and only the one hovered", async () => {
    show();
    const onTime = await tip("On time");
    const first = await tip("Accepted first time");
    fireEvent.mouseEnter(onTime.wrapper);
    expect(onTime.text.hidden).toBe(false);
    expect(first.text.hidden).toBe(true);
    // the explanation is inside what is hovered, so moving onto it keeps it open
    expect(onTime.wrapper.contains(onTime.text)).toBe(true);
    fireEvent.mouseLeave(onTime.wrapper);
    expect(onTime.text.hidden).toBe(true);
  });

  it("opens on keyboard focus, and closes on Escape or on moving away", async () => {
    show();
    const { button, text } = await tip("Accepted first time");
    fireEvent.focus(button);
    expect(text.hidden).toBe(false);
    fireEvent.keyDown(button, { key: "Escape" });
    expect(text.hidden).toBe(true);
    fireEvent.focus(button);
    expect(text.hidden).toBe(false);
    fireEvent.blur(button);
    expect(text.hidden).toBe(true);
  });

  it("opens on a tap, which focuses and then clicks, and does not open the vendor", async () => {
    const router = show();
    const { button, text } = await tip("On time");
    fireEvent.focus(button);
    fireEvent.click(button);
    expect(text.hidden).toBe(false);
    expect(button.getAttribute("type")).toBe("button");
    expect(router.state.location.pathname).toBe("/vendors");
  });

  it("is read to a screen reader whether or not it is showing", async () => {
    show();
    const { button, text } = await tip("On time");
    expect(text.hidden).toBe(true);
    expect(button.getAttribute("aria-describedby")).toBe(text.id);
    expect(text.textContent!.length).toBeGreaterThan(40);
    // the icon's letter is not its name
    expect(button.getAttribute("aria-label")).toBe("About On time");
  });

  it("has nothing to explain on a card with no figures", async () => {
    show();
    const c = within(await screen.findByRole("article", { name: HELIX.name }));
    expect(c.queryByRole("button")).toBeNull();
  });
});

describe("filtering", () => {
  it("narrows as a filter is chosen and says how many match", async () => {
    const router = show();
    await waitFor(() => expect(cards()).toHaveLength(3));
    choose(/Filter by data type/, "video");
    expect(shownNames()).toEqual([NORTHSTAR.name]);
    expect(count()).toBe("1 of 3 vendors");
    expect(router.state.location.search).toBe("?type=video");
  });

  it("offers each value once: a chosen one leaves the list", async () => {
    show();
    await waitFor(() => expect(cards()).toHaveLength(3));
    const select = screen.getByLabelText(/Filter by data type/) as HTMLSelectElement;
    const offered = () => [...select.options].map((o) => o.value).filter(Boolean);
    expect(offered()).toContain("video");
    choose(/Filter by data type/, "video");
    expect(offered()).not.toContain("video");
    expect(select.value).toBe("");
    expect(select.options[0]!.textContent).toBe("Data type (1)");
  });

  it("removes one filter from its chip and all of them at once", async () => {
    const router = show("/vendors?type=image&region=KE");
    await waitFor(() => expect(shownNames()).toEqual([HELIX.name]));
    fireEvent.click(screen.getByRole("button", { name: "Remove filter Kenya" }));
    expect(shownNames()).toEqual([NORTHSTAR.name, HELIX.name]);
    expect(router.state.location.search).toBe("?type=image");
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(cards()).toHaveLength(3);
    expect(router.state.location.search).toBe("");
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("opens already filtered from a link", async () => {
    show("/vendors?lang=eng&rating=4&sort=name");
    await waitFor(() => expect(shownNames()).toEqual([NORTHSTAR.name]));
    expect((screen.getByLabelText("Minimum rating") as HTMLSelectElement).value).toBe("4");
    expect((screen.getByLabelText("Sort") as HTMLSelectElement).value).toBe("name");
    expect(screen.getByRole("button", { name: "Remove filter English" })).toBeTruthy();
  });

  it("searches as it is typed, and lets a second word be typed", async () => {
    const router = show();
    await waitFor(() => expect(cards()).toHaveLength(3));
    const box = screen.getByLabelText("Search vendors") as HTMLInputElement;
    fireEvent.change(box, { target: { value: "field " } });
    // the space stays in the box though the address bar holds it trimmed
    expect(box.value).toBe("field ");
    expect(router.state.location.search).toBe("?q=field");
    fireEvent.change(box, { target: { value: "field india" } });
    expect(shownNames()).toEqual([NORTHSTAR.name]);
  });

  it("empties the search box when its chip is removed", async () => {
    show("/vendors?q=speech");
    await waitFor(() => expect(shownNames()).toEqual([MERIDIAN.name]));
    fireEvent.click(screen.getByRole("button", { name: 'Remove filter "speech"' }));
    expect((screen.getByLabelText("Search vendors") as HTMLInputElement).value).toBe("");
    expect(cards()).toHaveLength(3);
  });

  it("changes the order without counting it as a filter", async () => {
    show();
    await waitFor(() => expect(cards()).toHaveLength(3));
    choose(/^Sort$/, "projects");
    expect(shownNames()).toEqual([MERIDIAN.name, NORTHSTAR.name, HELIX.name]);
    expect(count()).toBe("3 vendors");
    expect(screen.queryByRole("button", { name: "Clear all" })).toBeNull();
  });

  it("says nothing matches, and offers the way out", async () => {
    show("/vendors?type=audio,video");
    expect(await screen.findByText("No vendor matches all of that")).toBeTruthy();
    expect(count()).toBe("0 of 3 vendors");
    fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    expect(cards()).toHaveLength(3);
  });

  it("replaces the address rather than adding to the history", async () => {
    const router = show();
    await waitFor(() => expect(cards()).toHaveLength(3));
    const before = router.state.historyAction;
    choose(/Filter by region/, "IN");
    expect(router.state.historyAction).toBe("REPLACE");
    expect(before).not.toBe("REPLACE");
  });
});

describe("the table", () => {
  it("shows the same vendors as rows, and is remembered", async () => {
    show();
    await waitFor(() => expect(cards()).toHaveLength(3));
    const table = screen.getByRole("button", { name: "Table" });
    expect(table.getAttribute("aria-pressed")).toBe("false");
    fireEvent.click(table);
    expect(table.getAttribute("aria-pressed")).toBe("true");
    expect(screen.queryAllByRole("article")).toHaveLength(0);
    const rows = screen.getAllByRole("row").slice(1);
    expect(rows).toHaveLength(3);
    expect(within(rows[0]!).getByRole("link", { name: NORTHSTAR.name }).getAttribute("href")).toBe("/vendors/v-ns");
    expect(within(rows[0]!).getByText("94%")).toBeTruthy();
    expect(within(rows[2]!).getByText("New")).toBeTruthy();
    expect(localStorage.getItem("sourcehub.vendors.layout")).toBe("table");
  });

  it("opens in the layout last chosen", async () => {
    localStorage.setItem("sourcehub.vendors.layout", "table");
    show();
    await waitFor(() => expect(screen.getAllByRole("row").length).toBe(4));
    expect(screen.getByRole("button", { name: "Table" }).getAttribute("aria-pressed")).toBe("true");
  });

  it("keeps the filters when the layout changes", async () => {
    show("/vendors?type=video");
    await waitFor(() => expect(shownNames()).toEqual([NORTHSTAR.name]));
    fireEvent.click(screen.getByRole("button", { name: "Table" }));
    expect(screen.getAllByRole("row").slice(1)).toHaveLength(1);
    expect(count()).toBe("1 of 3 vendors");
  });
});

describe("loading, failing and empty are three different things", () => {
  it("shows the shape of what is coming while it loads", () => {
    api.get.mockImplementation(() => new Promise(() => {}));
    show();
    expect(screen.getByRole("status", { name: "Loading vendors" })).toBeTruthy();
    expect(screen.queryByText("No vendors yet")).toBeNull();
  });

  it("says the request failed instead of saying there are none", async () => {
    failing = true;
    show();
    expect(await screen.findByText("Could not load the vendors")).toBeTruthy();
    expect(screen.getByText("Request failed (403)")).toBeTruthy();
    expect(screen.queryByText("No vendors yet")).toBeNull();
  });

  it("says so when the directory is empty", async () => {
    vendors = [];
    show();
    expect(await screen.findByText("No vendors yet")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Clear filters" })).toBeNull();
  });
});

describe("the way to a vendor and back", () => {
  it("opens the vendor's page and leads back to the directory as it was filtered", async () => {
    const router = show("/vendors?type=video&sort=name");
    const c = await screen.findByRole("article", { name: NORTHSTAR.name });
    api.get.mockImplementation((path: string) =>
      path === "/vendors/v-ns" ? Promise.resolve(NORTHSTAR) : Promise.resolve(null));
    fireEvent.click(within(c).getByRole("link", { name: NORTHSTAR.name }));
    expect(router.state.location.pathname).toBe("/vendors/v-ns");
    const back = await screen.findByRole("link", { name: "Back to vendors" });
    expect(back.getAttribute("href")).toBe("/vendors?type=video&sort=name");
  });
});
