import * as SQLite from "expo-sqlite";
import { SCHEMA_V1, SCHEMA_V2, SCHEMA_V3, SCHEMA_V4, SCHEMA_V5, SCHEMA_V6, SCHEMA_V7, SCHEMA_V8 } from "./schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    // A failed open is not kept: one bad moment (a full disk at launch) used to
    // break every database call until the app was restarted.
    dbPromise = open().catch((e: unknown) => {
      dbPromise = null;
      throw e;
    });
  }
  return dbPromise;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("cosarathi-capture.db");
  await migrate(db);
  return db;
}

/** Each statement on its own. A column that is already there (a fresh install
 *  has it from SCHEMA_V1, an upgrade does not) is skipped; anything else — a
 *  full disk, an I/O error — fails the migration, which used to swallow it,
 *  bump the version anyway and leave the install without the column for good. */
export async function addColumns(db: Pick<SQLite.SQLiteDatabase, "execAsync">, sql: string): Promise<void> {
  for (const stmt of sql.split(";").map((s) => s.trim()).filter(Boolean)) {
    try {
      await db.execAsync(stmt);
    } catch (e) {
      if (!/duplicate column/i.test(e instanceof Error ? e.message : String(e))) throw e;
    }
  }
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const version = row?.user_version ?? 0;
  // Each step and its version bump commit together, or not at all.
  const step = async (to: number, run: () => Promise<void>) => {
    if (version >= to) return;
    await db.withTransactionAsync(async () => {
      await run();
      await db.execAsync(`PRAGMA user_version = ${to}`);
    });
  };
  // Not in a transaction: SCHEMA_V1 switches the journal to WAL, which SQLite
  // refuses inside one. Its tables are CREATE IF NOT EXISTS, so a half-done
  // first run simply runs again.
  if (version < 1) {
    await db.execAsync(SCHEMA_V1);
    await db.execAsync("PRAGMA user_version = 1");
  }
  await step(2, () => addColumns(db, SCHEMA_V2));
  await step(3, () => addColumns(db, SCHEMA_V3));
  // CREATE TABLE IF NOT EXISTS: safe on a fresh install and an upgrade alike
  await step(4, () => db.execAsync(SCHEMA_V4));
  await step(5, () => db.execAsync(SCHEMA_V5));
  await step(6, () => addColumns(db, SCHEMA_V6));
  await step(7, () => addColumns(db, SCHEMA_V7));
  await step(8, () => addColumns(db, SCHEMA_V8));
}
