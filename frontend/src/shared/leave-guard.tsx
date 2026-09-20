// Asks before a page with unsaved work is left.
//
// Two ways out, two mechanisms. Inside the console — a rail link, Back, a
// button that navigates — useBlocker holds the navigation and this renders a
// dialog to confirm or cancel it (it needs the data router main.tsx creates).
// Out of the console — closing the tab, reloading, typing an address — only
// the browser's own beforeunload prompt can intervene, and its wording is the
// browser's.
//
// release() is for leaving on purpose once the work is safe, such as moving to
// the page of a request that has just been saved.

import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";
import { Button, Dialog } from "@ds/primitives";

export function useLeaveGuard(dirty: boolean) {
  const released = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirty && !released.current && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!dirty) return;
    const onUnload = (e: BeforeUnloadEvent) => {
      if (released.current) return;
      e.preventDefault();
      e.returnValue = ""; // older browsers show the prompt only when this is set
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, [dirty]);

  const dialog =
    blocker.state === "blocked" ? (
      <Dialog
        title="Leave without saving?"
        onClose={() => blocker.reset()}
        foot={
          <>
            <Button onClick={() => blocker.reset()}>Keep editing</Button>
            <Button variant="danger" onClick={() => blocker.proceed()}>Leave without saving</Button>
          </>
        }
      >
        <p style={{ margin: 0 }}>
          The changes you have made here are not saved, and are lost if you leave. Save as a draft
          first to keep them.
        </p>
      </Dialog>
    ) : null;

  return {
    dialog,
    release: () => {
      released.current = true;
    },
  };
}
