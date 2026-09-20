// Behaviour of the shared primitives that a build cannot see: what a screen
// reader is told about a field, what the browser tab says, and what a list
// shows before its data arrives.

import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ALERT_MS, DataTable, Field, Loadable, Metric, RowMenu, sortRows, TOAST_MS, ToastProvider, useToast, View,
  type Column,
} from "./primitives";
import type { Tone } from "@shared/status";

describe("Field", () => {
  const field = (error?: string) => (
    <Field label="Email" required hint="Used to sign in" error={error ?? null}>
      {(id) => <input id={id} />}
    </Field>
  );

  it("tells assistive technology the field is required and points at its hint", () => {
    render(field());
    const input = screen.getByLabelText(/Email/);
    expect(input.getAttribute("aria-required")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByText("Used to sign in").id);
    expect(input.hasAttribute("aria-invalid")).toBe(false);
  });

  it("marks the field invalid and points at the error while there is one, then clears it", () => {
    const { rerender } = render(field("Not an email address"));
    const input = screen.getByLabelText(/Email/);
    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByText("Not an email address").id);

    rerender(field());
    expect(input.hasAttribute("aria-invalid")).toBe(false);
    expect(input.getAttribute("aria-describedby")).toBe(screen.getByText("Used to sign in").id);
  });
});

describe("View", () => {
  it("names the browser tab after the page", () => {
    render(<View title="Accounts"><p /></View>);
    expect(document.title).toBe("Accounts · DataMind360");
  });

  it("uses pageTitle when the heading is not a good tab name", () => {
    render(<View title="Good day, Acme Retail Analytics" pageTitle="Overview"><p /></View>);
    expect(document.title).toBe("Overview · DataMind360");
  });
});

describe("Loadable", () => {
  const q = (s: Partial<{ isLoading: boolean; isError: boolean; error: unknown }>) => ({
    isLoading: false, isError: false, error: null, ...s,
  });

  it("shows a skeleton, not the list's empty state, while loading", () => {
    render(<Loadable q={q({ isLoading: true })} what="the roster"><p>No workers yet</p></Loadable>);
    expect(screen.getByRole("status", { name: "Loading the roster" })).toBeTruthy();
    expect(screen.queryByText("No workers yet")).toBeNull();
  });

  it("says the request failed rather than that there is nothing there", () => {
    render(<Loadable q={q({ isError: true, error: new Error("502 Bad Gateway") })} what="the roster"><p>No workers yet</p></Loadable>);
    expect(screen.getByText("Could not load the roster")).toBeTruthy();
    expect(screen.getByText("502 Bad Gateway")).toBeTruthy();
    expect(screen.queryByText("No workers yet")).toBeNull();
  });

  it("renders its content once loaded", () => {
    render(<Loadable q={q({})} what="the roster"><p>No workers yet</p></Loadable>);
    expect(screen.getByText("No workers yet")).toBeTruthy();
  });
});

describe("Metric", () => {
  it("shows … rather than a computed 0 while its number is unknown", () => {
    render(<Metric label="Roster" value={0} loading />);
    expect(screen.getByText("…")).toBeTruthy();
    expect(screen.queryByText("0")).toBeNull();
  });
});

describe("RowMenu", () => {
  function open() {
    const onView = vi.fn();
    const onWithdraw = vi.fn();
    render(
      <RowMenu
        label="Actions for REQ-7"
        items={[
          { label: "View details", onSelect: onView },
          { label: "Duplicate", onSelect: () => {} },
          { label: "Withdraw", tone: "danger", onSelect: onWithdraw },
        ]}
      />,
    );
    const trigger = screen.getByRole("button", { name: "Actions for REQ-7" });
    fireEvent.click(trigger);
    return { trigger, onView, onWithdraw };
  }
  const focused = () => document.activeElement?.textContent;
  const key = (k: string) => fireEvent.keyDown(document.activeElement!, { key: k });

  it("moves focus into the menu and through it with the arrow keys", () => {
    open();
    expect(focused()).toBe("View details");
    key("ArrowDown");
    expect(focused()).toBe("Duplicate");
    key("End");
    expect(focused()).toBe("Withdraw");
    key("ArrowDown");
    expect(focused()).toBe("View details");
    key("ArrowUp");
    expect(focused()).toBe("Withdraw");
  });

  it("returns focus to its button after an item is chosen, instead of dropping it", () => {
    const { trigger, onWithdraw } = open();
    key("End");
    fireEvent.click(document.activeElement!);
    expect(onWithdraw).toHaveBeenCalled();
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it("closes on Escape and returns focus to its button", () => {
    const { trigger } = open();
    key("Escape");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });
});

describe("toasts", () => {
  afterEach(() => vi.useRealTimers());

  function Raise({ tone, title }: { tone?: Tone; title: string }) {
    const toast = useToast();
    return <button type="button" onClick={() => toast(title, undefined, tone)}>raise {title}</button>;
  }
  function raise(tone: Tone | undefined, title: string) {
    render(<ToastProvider><Raise tone={tone} title={title} /></ToastProvider>);
    fireEvent.click(screen.getByRole("button", { name: `raise ${title}` }));
    return screen.getByText(title).closest("[aria-live]")!;
  }

  it("announces a failure assertively and everything else politely", () => {
    expect(raise("critical", "Could not approve").getAttribute("aria-live")).toBe("assertive");
    expect(raise("success", "Approved").getAttribute("aria-live")).toBe("polite");
  });

  it("keeps a failure up long enough to read", () => {
    vi.useFakeTimers();
    raise("critical", "Could not approve");
    act(() => vi.advanceTimersByTime(TOAST_MS + 100));
    expect(screen.queryByText("Could not approve")).not.toBeNull();
    act(() => vi.advanceTimersByTime(ALERT_MS - TOAST_MS));
    expect(screen.queryByText("Could not approve")).toBeNull();
  });

  it("can be dismissed", () => {
    raise("critical", "Could not approve");
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText("Could not approve")).toBeNull();
  });
});

describe("sortRows", () => {
  const rows = [{ v: "REQ-10" }, { v: null }, { v: "REQ-9" }, { v: "req-2" }];
  const by = (r: { v: string | null }) => r.v;

  it("orders numbers inside text as numbers, ignoring case", () => {
    expect(sortRows(rows, by, "asc").map((r) => r.v)).toEqual(["req-2", "REQ-9", "REQ-10", null]);
  });

  it("keeps blanks last in both directions", () => {
    expect(sortRows(rows, by, "desc").map((r) => r.v)).toEqual(["REQ-10", "REQ-9", "req-2", null]);
  });

  it("is stable for equal values", () => {
    const tied = [{ v: "a", n: 1 }, { v: "a", n: 2 }, { v: "a", n: 3 }];
    expect(sortRows(tied, (r) => r.v, "desc").map((r) => r.n)).toEqual([1, 2, 3]);
  });
});

describe("DataTable", () => {
  type Acct = { id: string; name: string; rating: number | null; plan: string };
  const ROWS: Acct[] = [
    { id: "1", name: "Northstar", rating: 4.2, plan: "Growth" },
    { id: "2", name: "Acme", rating: null, plan: "Scale" },
    { id: "3", name: "Bluefin", rating: 4.8, plan: "Growth" },
  ];
  const COLUMNS: Column<Acct>[] = [
    { header: "Name", cell: (r) => r.name, sortBy: (r) => r.name },
    { header: "Rating", cell: (r) => r.rating ?? "—", sortBy: (r) => r.rating },
    { header: "Plan", cell: (r) => r.plan },
    { header: "Actions", cell: () => <button type="button">Open</button>, hideHeader: true },
  ];
  const names = () =>
    screen.getAllByRole("row").slice(1).map((tr) => tr.querySelector("td")!.textContent);
  const header = (name: string) => screen.getByRole("columnheader", { name: new RegExp(`^${name}`) });

  it("sorts by a column, then reverses it, saying which way on the header", () => {
    render(<DataTable rows={ROWS} rowKey={(r) => r.id} columns={COLUMNS} />);
    expect(names()).toEqual(["Northstar", "Acme", "Bluefin"]); // as given

    fireEvent.click(screen.getByRole("button", { name: /^Rating/ }));
    expect(names()).toEqual(["Northstar", "Bluefin", "Acme"]); // unrated last
    expect(header("Rating").getAttribute("aria-sort")).toBe("ascending");

    fireEvent.click(screen.getByRole("button", { name: /^Rating/ }));
    expect(names()).toEqual(["Bluefin", "Northstar", "Acme"]); // still last
    expect(header("Rating").getAttribute("aria-sort")).toBe("descending");

    fireEvent.click(screen.getByRole("button", { name: /^Name/ }));
    expect(names()).toEqual(["Acme", "Bluefin", "Northstar"]);
    // only the sorted column claims a direction
    expect(header("Rating").hasAttribute("aria-sort")).toBe(false);
  });

  it("offers sorting only where the column says how", () => {
    render(<DataTable rows={ROWS} rowKey={(r) => r.id} columns={COLUMNS} />);
    expect(screen.queryByRole("button", { name: /^Plan/ })).toBeNull();
    // the actions header is there for assistive technology, not drawn
    expect(header("Actions").querySelector(".sr")).not.toBeNull();
  });

  it("starts from the sort it is given", () => {
    render(<DataTable rows={ROWS} rowKey={(r) => r.id} columns={COLUMNS} initialSort={{ by: "Name", dir: "desc" }} />);
    expect(names()).toEqual(["Northstar", "Bluefin", "Acme"]);
  });

  it("narrows by text, says how many are left, and says when none are", () => {
    render(
      <DataTable rows={ROWS} rowKey={(r) => r.id} columns={COLUMNS}
        filter={{ label: "Filter accounts", text: (r) => r.name }} />,
    );
    const box = screen.getByRole("searchbox", { name: "Filter accounts" });
    expect(screen.getByRole("status").textContent).toBe("");

    fireEvent.change(box, { target: { value: "  NORTH " } });
    expect(names()).toEqual(["Northstar"]);
    expect(screen.getByRole("status").textContent).toBe("1 of 3");

    fireEvent.change(box, { target: { value: "zzz" } });
    expect(screen.getByText("Nothing matches that")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("passes row props through, for rows that open something", () => {
    const open = vi.fn();
    render(
      <DataTable rows={ROWS} rowKey={(r) => r.id} columns={COLUMNS}
        rowProps={(r) => ({ className: "tap", onClick: () => open(r.id) })} />,
    );
    fireEvent.click(screen.getByText("Acme"));
    expect(open).toHaveBeenCalledWith("2");
  });
});
