// Leaving a page with unsaved work asks first; leaving a clean one does not.

import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { createMemoryRouter, Link, RouterProvider, useNavigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { useLeaveGuard } from "./leave-guard";

function Form() {
  const [text, setText] = useState("");
  const guard = useLeaveGuard(text !== "");
  const navigate = useNavigate();
  return (
    <>
      <input aria-label="Title" value={text} onChange={(e) => setText(e.target.value)} />
      <Link to="/requests">Requests</Link>
      <Link to="/requests/new?step=2">Same page, another step</Link>
      <button type="button" onClick={() => { guard.release(); navigate("/requests/r1"); }}>Save</button>
      {guard.dialog}
    </>
  );
}

function renderForm() {
  const router = createMemoryRouter(
    [
      { path: "/requests/new", element: <Form /> },
      { path: "/requests", element: <p>request list</p> },
      { path: "/requests/:id", element: <p>saved request</p> },
    ],
    { initialEntries: ["/requests/new"] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const type = (v: string) => fireEvent.change(screen.getByLabelText("Title"), { target: { value: v } });
const unload = () => {
  const e = new Event("beforeunload", { cancelable: true });
  window.dispatchEvent(e);
  return e.defaultPrevented;
};

describe("leave guard", () => {
  it("lets a clean page go without asking", () => {
    const router = renderForm();
    fireEvent.click(screen.getByRole("link", { name: "Requests" }));
    expect(router.state.location.pathname).toBe("/requests");
    expect(unload()).toBe(false);
  });

  it("holds the navigation and asks when there is unsaved work", async () => {
    const router = renderForm();
    type("Street photos, Pune");
    fireEvent.click(screen.getByRole("link", { name: "Requests" }));

    expect(await screen.findByRole("dialog", { name: "Leave without saving?" })).toBeTruthy();
    expect(router.state.location.pathname).toBe("/requests/new");

    fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect((screen.getByLabelText("Title") as HTMLInputElement).value).toBe("Street photos, Pune");

    fireEvent.click(screen.getByRole("link", { name: "Requests" }));
    fireEvent.click(await screen.findByRole("button", { name: "Leave without saving" }));
    expect(await screen.findByText("request list")).toBeTruthy();
  });

  it("asks the browser to confirm closing or reloading the tab only while there is unsaved work", () => {
    renderForm();
    expect(unload()).toBe(false);
    type("Street photos, Pune");
    expect(unload()).toBe(true);
  });

  it("does not ask once the work is saved", async () => {
    const router = renderForm();
    type("Street photos, Pune");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    expect(await screen.findByText("saved request")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/requests/r1");
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("does not ask when only the query string changes", () => {
    const router = renderForm();
    type("Street photos, Pune");
    fireEvent.click(screen.getByRole("link", { name: "Same page, another step" }));
    expect(router.state.location.search).toBe("?step=2");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
