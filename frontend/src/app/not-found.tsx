// An address with nothing behind it.
//
// The signed-in catch-all used to <Navigate to="/"> — so a typo, a stale
// bookmark or an out-of-date link in an email silently landed the user on their
// overview, looking at something they had not asked for, with nothing to say
// why. Say so, and offer the way back.

import { Link, useLocation } from "react-router-dom";
import { Empty, Panel, View } from "@ds/primitives";

export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <View title="Page not found">
      <Panel>
        <Empty
          title="There is nothing at this address"
          hint={`${pathname} may be an old link, or the page may have moved.`}
          action={<Link to="/" className="btn" data-variant="primary">Go to your overview</Link>}
        />
      </Panel>
    </View>
  );
}
