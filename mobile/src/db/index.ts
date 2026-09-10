import * as SQLite from "expo-sqlite";
import { SCHEMA_V1, SCHEMA_V2 } from "./schema";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = open();
  return dbPromise;
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("cosarathi-capture.db");
  await migrate(db);
  return db;
}

async function migrate(db: SQLite.SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>("PRAGMA user_version");
  const version = row?.user_version ?? 0;
  if (version < 1) {
    await db.execAsync(SCHEMA_V1);
    await db.execAsync("PRAGMA user_version = 1");
  }
  if (version < 2) {
    // A fresh install already has the column from SCHEMA_V1; an upgrade
    // does not. Tolerate both rather than branching on which happened.
    try {
      await db.execAsync(SCHEMA_V2);
    } catch {
      // the column is already there
    }
    await db.execAsync("PRAGMA user_version = 2");
  }
}
