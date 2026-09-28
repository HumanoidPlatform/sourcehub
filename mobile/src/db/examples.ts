// The label lists of the client's example photos, kept so each example is
// downloaded and labelled once per task rather than once per capture.
//
// The images themselves are never kept — see SCHEMA_V5. Rows are written by
// capture/examples.ts and read at the shutter.

import type { ExampleLabels } from "@/validation/examples";
import type { Label } from "@/validation/subject";
import { getDb } from "./index";

interface Row {
  attachment_id: string;
  filename: string;
  labels: string;
}

/** Which of these attachment ids the phone has already labelled. */
export async function labelledExamples(attachmentIds: string[]): Promise<Set<string>> {
  if (attachmentIds.length === 0) return new Set();
  const db = await getDb();
  const marks = attachmentIds.map(() => "?").join(",");
  const rows = await db.getAllAsync<{ attachment_id: string }>(
    `SELECT attachment_id FROM example_labels WHERE attachment_id IN (${marks})`,
    attachmentIds,
  );
  return new Set(rows.map((r) => r.attachment_id));
}

export async function saveExampleLabels(
  taskId: string,
  attachmentId: string,
  filename: string,
  labels: Label[],
): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO example_labels (attachment_id, task_id, filename, labels, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [attachmentId, taskId, filename, JSON.stringify(labels), Date.now()],
  );
}

/** Everything the phone holds for a task, in the order it was stored.
 *
 *  Reads by attachment id rather than by task so a document replaced in the
 *  console cannot be answered with the row for the version it replaced: the
 *  caller passes the ids the assignment payload carries now, and a stale row
 *  is simply never selected. */
export async function loadExampleLabels(attachmentIds: string[]): Promise<ExampleLabels[]> {
  if (attachmentIds.length === 0) return [];
  const db = await getDb();
  const marks = attachmentIds.map(() => "?").join(",");
  const rows = await db.getAllAsync<Row>(
    `SELECT attachment_id, filename, labels FROM example_labels WHERE attachment_id IN (${marks})`,
    attachmentIds,
  );
  const out: ExampleLabels[] = [];
  for (const r of rows) {
    // A row whose JSON will not parse is a row from a build that wrote a
    // different shape. Skipping it costs one example; throwing would cost the
    // capture.
    try {
      const labels = JSON.parse(r.labels) as Label[];
      if (Array.isArray(labels)) out.push({ attachmentId: r.attachment_id, filename: r.filename, labels });
    } catch {
      // unreadable row
    }
  }
  return out;
}
