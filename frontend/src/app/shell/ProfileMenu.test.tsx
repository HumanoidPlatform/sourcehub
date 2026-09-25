// The account menu's contract: what is a menu item and what is not, and how it
// behaves from the keyboard. Written because the menu it replaced declared
// role="menu" while containing no menu items, took no keyboard input, and
// styled read-only text as clickable rows — none of which a build catches.

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { ProfileMenu } from "./ProfileMenu";
import type { Theme } from "./Shell";

// Hoisted so a test can change who is signed in. The menu now shows or hides
// "Manage users" by capability AND scope, so a session that cannot express
// either would be testing a shape the app never sees.
const session = vi.hoisted(() => ({
  current: {
    full_name: "Priya Nair",
    email: "priya@acme.example",
    org_name: "Acme Retail Analytics",
    role: "client",
    scope: "owner",
    capabilities: ["user.manage", "rfp.create"],
  } as Record<string, unknown>,
}));

vi.mock("@shared/auth", () => ({
  useSession: () => session.current,
  useAuth: () => ({ logout: () => Promise.resolve() }),
}));

function open(theme: Theme = "system") {
  const onTheme = vi.fn();
  render(
    <MemoryRouter>
      <ToastProvider>
        <ProfileMenu theme={theme} onTheme={onTheme} />
      </ToastProvider>
    </MemoryRouter>,
  );
  const chip = screen.getByRole("button", { name: "Account menu for Priya Nair" });
  fireEvent.click(chip);
  return { chip, onTheme };
}

const focused = () => document.activeElement?.textContent;
const key = (k: string) => fireEvent.keyDown(document.activeElement!, { key: k });

describe("account menu", () => {
  it("shows identity and workspace as content, and only actions as menu items", () => {
    open();
    expect(screen.getAllByRole("menuitem").map((e) => e.textContent)).toEqual([
      "Change password",
      "Manage users",
      "Privacy notice",
      "Sign out",
    ]);
    // present on screen, but not something you can activate
    expect(screen.getByText("priya@acme.example").closest('[role^="menuitem"]')).toBeNull();
    expect(screen.getByText("Acme Retail Analytics").closest('[role^="menuitem"]')).toBeNull();
    expect(screen.getByText("Client")).toBeTruthy();
  });

  it("moves focus into the menu on open and through it with the arrow keys", () => {
    open();
    expect(focused()).toBe("Change password");
    key("ArrowDown");
    expect(focused()).toBe("Manage users");
    key("ArrowDown");
    expect(focused()).toBe("Privacy notice");
    key("ArrowDown");
    expect(focused()).toBe("System");
    key("End");
    expect(focused()).toBe("Sign out");
    key("ArrowDown"); // wraps
    expect(focused()).toBe("Change password");
    key("ArrowUp"); // wraps the other way
    expect(focused()).toBe("Sign out");
    key("Home");
    expect(focused()).toBe("Change password");
  });

  it("closes on Escape and hands focus back to the chip", () => {
    const { chip } = open();
    key("Escape");
    expect(screen.queryByRole("menu")).toBeNull();
    expect(document.activeElement).toBe(chip);
    expect(chip.getAttribute("aria-expanded")).toBe("false");
  });

  it("marks the current theme and reports a new choice without closing", () => {
    const { onTheme } = open("dark");
    const radios = screen.getAllByRole("menuitemradio");
    expect(radios.map((r) => `${r.textContent}:${r.getAttribute("aria-checked")}`)).toEqual([
      "System:false",
      "Light:false",
      "Dark:true",
    ]);
    fireEvent.click(screen.getByRole("menuitemradio", { name: "Light" }));
    expect(onTheme).toHaveBeenCalledWith("light");
    expect(screen.getByRole("menu")).toBeTruthy();
  });

  it("opens the change-password dialog and closes the menu", () => {
    open();
    fireEvent.click(screen.getByRole("menuitem", { name: "Change password" }));
    expect(screen.queryByRole("menu")).toBeNull();
    expect(screen.getByRole("dialog", { name: "Change password" })).toBeTruthy();
    expect(screen.getByLabelText(/Confirm new password/)).toBeTruthy();
  });
});

// Manage users is the one item here that is not offered to everyone, and the
// capability alone cannot decide it: every member of a client organisation
// holds user.manage, because capabilities come from the role and there is one
// role per organisation kind. Only the scope tells a colleague apart from an
// administrator.
describe("the Manage users entry", () => {
  const base = { ...session.current };
  afterEach(() => {
    session.current = { ...base };
  });

  const items = () => screen.getAllByRole("menuitem").map((e) => e.textContent);

  it("is offered to an owner and to a manager", () => {
    for (const scope of ["owner", "manager"]) {
      session.current = { ...base, scope };
      open();
      expect(items()).toContain("Manage users");
      cleanup();
    }
  });

  it("is hidden from a member, who holds the capability anyway", () => {
    session.current = { ...base, scope: "member" };
    open();
    // The capability IS present — that is the whole point of the scope gate.
    expect(session.current.capabilities).toContain("user.manage");
    expect(items()).not.toContain("Manage users");
  });

  it("is hidden without the capability, whatever the scope says", () => {
    session.current = { ...base, scope: "owner", capabilities: ["rfp.create"] };
    open();
    expect(items()).not.toContain("Manage users");
  });

  it("does not crash the whole shell when a stored session has no capabilities", () => {
    // ProfileMenu renders on every page, so reading .includes off undefined
    // here would take down the console rather than one feature. A session
    // persisted by an older build can lack the field entirely.
    session.current = { ...base, capabilities: undefined };
    expect(() => open()).not.toThrow();
    expect(items()).not.toContain("Manage users");
    expect(items()).toContain("Sign out");
  });
});
