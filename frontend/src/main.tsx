// Application entry point.
//
// A data router (createBrowserRouter) rather than <BrowserRouter>, for one
// reason: useBlocker, which holds a navigation away from unsaved work
// (shared/leave-guard), works only under one. The route tree itself is
// unchanged — a single splat route renders AppRouter, whose <Routes> match
// as they always did.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppRouter } from "@app/router";
import { ErrorBoundary } from "@app/error-boundary";
import { Providers } from "@app/providers";
import "@ds/tokens.css";
import "@ds/components.css";

const router = createBrowserRouter(
  [
    {
      path: "*",
      // Inside the route as well as outside it: a data router catches a render
      // error in its routes with its own bare developer screen before it could
      // reach the boundary below.
      element: (
        <ErrorBoundary scope="app">
          <Providers>
            <AppRouter />
          </Providers>
        </ErrorBoundary>
      ),
    },
  ],
  // Opt-ins for data-router features this app does not use (fetchers, form
  // actions, SSR hydration); set only to silence their deprecation warnings.
  // v7_relativeSplatPath is deliberately left off: it changes how relative
  // links resolve inside a splat route, which is all of this app.
  {
    future: {
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* Outermost, so nothing — not the router itself — can leave the user
        looking at a blank window. */}
    <ErrorBoundary scope="app">
      <RouterProvider router={router} />
    </ErrorBoundary>
  </StrictMode>,
);
