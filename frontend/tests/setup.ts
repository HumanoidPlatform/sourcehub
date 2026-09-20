// vitest setup: jest-axe matchers, MSW handlers, theme helpers.
//
// The a11y suite runs every route in both themes — see vite.config.ts.

// jsdom gives the page a `crypto` with getRandomValues and randomUUID but no
// `subtle`, and the upload hash needs SubtleCrypto. Node's implementation is
// the real thing, so lend it to the test DOM.
import { webcrypto } from "node:crypto";

if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, "crypto", { value: webcrypto, configurable: true });
}

// jsdom's Blob has no arrayBuffer(); every browser this console targets does.
// Read it the old way so the hash can be tested against real digests.
if (typeof Blob !== "undefined" && typeof Blob.prototype.arrayBuffer !== "function") {
  Blob.prototype.arrayBuffer = function (this: Blob): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as ArrayBuffer);
      r.onerror = () => reject(r.error);
      r.readAsArrayBuffer(this);
    });
  };
}

// jsdom has no layout, so window.scrollTo is a stub that logs "Not implemented"
// as an Error. Dialog restores the page's scroll position when it closes, which
// made every component test that opens one print a stack trace on success.
if (typeof window !== "undefined") {
  window.scrollTo = () => {};
}

// jsdom replaces AbortController/AbortSignal with its own, and Node's Request
// (undici) accepts only Node's signal. A data router (createMemoryRouter, as
// main.tsx uses createBrowserRouter) builds a Request with a signal on every
// navigation, so under jsdom each navigation threw "Expected signal to be an
// instance of AbortSignal" and never completed. Drop the signal: nothing under
// test aborts through it.
if (typeof window !== "undefined" && typeof globalThis.Request === "function") {
  const NodeRequest = globalThis.Request;
  globalThis.Request = class extends NodeRequest {
    constructor(input: RequestInfo | URL, init?: RequestInit) {
      const { signal: _signal, ...rest } = init ?? {};
      super(input, rest);
    }
  } as typeof Request;
}
