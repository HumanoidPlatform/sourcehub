// What the user sees when a screen throws while rendering.
//
// There was no boundary anywhere, and React's answer to an uncaught render error
// is to unmount the whole tree: one bad row on one page left a blank white
// window with no sidebar, no message and no way forward but a reload.
//
// Used twice:
//   scope="page" — inside the Shell, around the routed page. The sidebar and top
//                  bar survive, and moving to another page (resetKey) clears it.
//   scope="app"  — outermost, in main.tsx. The last resort, for a failure in the
//                  providers, the router or a signed-out page. It sits outside
//                  the router, so it cannot use <Link>.

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Button, Callout, Panel, View } from "@ds/primitives";

interface Props {
  scope: "page" | "app";
  /** Changing this clears a caught error — pass the pathname, so navigating away recovers. */
  resetKey?: string;
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    // Still reach the console, where a developer or a support session can see it.
    console.error("Render failed", error, info.componentStack);
  }

  override componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  private reset = () => this.setState({ error: null });

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    // The raw message is for support, not the headline: "Cannot read properties
    // of undefined" tells the person in front of it nothing they can act on.
    const details = (
      <details style={{ marginTop: 8 }}>
        <summary className="small muted" style={{ cursor: "pointer" }}>Technical details</summary>
        <pre className="small mono" style={{ whiteSpace: "pre-wrap", margin: "6px 0 0" }}>{error.message}</pre>
      </details>
    );

    if (this.props.scope === "page") {
      return (
        <View title="Something went wrong" sub="This page hit an error. The rest of the console still works.">
          <Panel>
            <Callout tone="critical" title="The page could not be displayed">
              Try again, or go back to your overview. If it keeps happening, send the technical
              details below to your administrator.
              {details}
            </Callout>
            <div className="btnrow" style={{ marginTop: 12 }}>
              <Button variant="primary" onClick={this.reset}>Try again</Button>
              <Link to="/" className="btn">Go to your overview</Link>
            </div>
          </Panel>
        </View>
      );
    }

    return (
      <div style={{ maxWidth: 520, margin: "12vh auto", padding: "0 16px" }}>
        <Panel title="Something went wrong">
          <Callout tone="critical" title="The console could not start">
            Reloading usually fixes this. If it does not, send the technical details below to your
            administrator.
            {details}
          </Callout>
          <div className="btnrow" style={{ marginTop: 12 }}>
            <Button variant="primary" onClick={() => window.location.reload()}>Reload</Button>
            <a href="/" className="btn">Go to the start</a>
          </div>
        </Panel>
      </div>
    );
  }
}
