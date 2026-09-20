// A page that throws must not blank the console, and an unknown address must
// say so rather than silently redirect.

import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ErrorBoundary } from "./error-boundary";
import { NotFoundPage } from "./not-found";

let explode = true;
function Page() {
  if (explode) throw new Error("Cannot read properties of undefined (reading 'map')");
  return <p>page rendered</p>;
}

beforeEach(() => {
  explode = true;
  // React logs every caught render error; the boundary is doing its job here.
  vi.spyOn(console, "error").mockImplementation(() => {});
});
afterEach(() => vi.restoreAllMocks());

const pageBoundary = (resetKey: string) => (
  <MemoryRouter>
    <ErrorBoundary scope="page" resetKey={resetKey}>
      <Page />
    </ErrorBoundary>
  </MemoryRouter>
);

describe("page error boundary", () => {
  it("shows a readable error in place of the page, with the raw message tucked away", () => {
    render(pageBoundary("/accounts"));
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    expect(screen.getByText("Technical details")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to your overview" }).getAttribute("href")).toBe("/");
  });

  it("recovers when the user navigates to another page", () => {
    const { rerender } = render(pageBoundary("/accounts"));
    explode = false;
    rerender(pageBoundary("/billing"));
    expect(screen.getByText("page rendered")).toBeTruthy();
  });

  it("recovers on Try again once the cause has passed", () => {
    render(pageBoundary("/accounts"));
    explode = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(screen.getByText("page rendered")).toBeTruthy();
  });
});

describe("app error boundary", () => {
  it("offers a reload without needing the router it sits outside of", () => {
    render(<ErrorBoundary scope="app"><Page /></ErrorBoundary>);
    expect(screen.getByText("The console could not start")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Reload" })).toBeTruthy();
  });
});

describe("not found", () => {
  it("names the address that failed and offers the way back", () => {
    render(
      <MemoryRouter initialEntries={["/overveiw"]}>
        <NotFoundPage />
      </MemoryRouter>,
    );
    expect(screen.getByText("There is nothing at this address")).toBeTruthy();
    expect(screen.getByText(/\/overveiw may be an old link/)).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to your overview" }).getAttribute("href")).toBe("/");
  });
});
