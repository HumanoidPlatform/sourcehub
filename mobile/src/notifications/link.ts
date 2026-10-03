// Where a notification takes the worker. One mapping for the two ways in: a
// row tapped in the bell, and a push tapped in the Android notification shade.
// Both carry the server's link_page and link_params (modules/notify), the
// push inside its data payload (modules/push).

export interface NotificationLink {
  link_page?: string | null;
  link_params?: Record<string, unknown> | null;
}

export function target(n: NotificationLink): string {
  const raw = n.link_params?.id ?? n.link_params?.assignment_id;
  const id = typeof raw === "string" && raw ? raw : null;
  if (n.link_page === "assignment" && id) return `/assignments/${id}`;
  return "/assignments";
}
