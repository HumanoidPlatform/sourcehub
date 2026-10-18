// delivery/components — the query keys the gallery and the review dialogs
// share (db/530).
//
// Written down once because the dialogs invalidate them by hand: a verdict
// names the batch and the task it touched rather than clearing the whole
// cache, which used to refetch every loaded page and re-sign every link in
// view. ["gallery", kind, id] is the prefix a dialog invalidates; the page key
// carries the flagged filter after it, so both filters of one source refetch
// together.

export type GalleryKind = "task" | "batch" | "submission";

export const galleryKeys = {
  /** one source's pages under one filter; invalidate with scope() */
  pages: (kind: GalleryKind, id: string, flagged: boolean) => ["gallery", kind, id, { flagged }] as const,
  /** every page of one source, whatever the filter */
  scope: (kind: GalleryKind, id: string) => ["gallery", kind, id] as const,
  /** the full row behind a preview, GET /assets/{id} */
  asset: (id: string) => ["asset", id] as const,
  /** the preview's signed link, GET /assets/{id}/url — AssetGallery's own key, unchanged */
  assetUrl: (id: string) => ["asset-url", id] as const,
  /** the phone's findings over a task, GET /tasks/{id}/check-summary */
  checkSummary: (taskId: string) => ["check-summary", taskId] as const,
};
