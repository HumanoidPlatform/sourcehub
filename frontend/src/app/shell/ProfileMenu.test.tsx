// The account menu's contract: what is a menu item and what is not, and how it
// behaves from the keyboard. Written because the menu it replaced declared
// role="menu" while containing no menu items, took no keyboard input, and
// styled read-only text as clickable rows — none of which a build catches.

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { ToastProvider } from "@ds/primitives";
import { ProfileMenu } from "./ProfileMenu";
import type { Theme } from "./Shell";

vi.mock("@shared/auth", () => ({
  useSession: () => ({
    full_name: "Priya Nair",
    email: "priya@acme.example",
    org_name: "Acme Retail Analytics",
    role: "client",
  }),
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
