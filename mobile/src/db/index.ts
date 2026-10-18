import * as SQLite from "expo-sqlite";
import { SCHEMA_V1, SCHEMA_V2, SCHEMA_V3, SCHEMA_V4, SCHEMA_V5, SCHEMA_V6, SCHEMA_V7, SCHEMA_V8 } from "./schema";

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
  if (version < 3) {
    try {
      await db.execAsync(SCHEMA_V3);
    } catch {
      // the column is already there
    }
    await db.execAsync("PRAGMA user_version = 3");
  }
  if (version < 4) {
    // CREATE TABLE IF NOT EXISTS, so unlike the ALTERs above this is safe on
    // both a fresh install and an upgrade without needing the catch.
    await db.execAsync(SCHEMA_V4);
    await db.execAsync("PRAGMA user_version = 4");
  }
  if (version < 5) {
    await db.execAsync(SCHEMA_V5);
    await db.execAsync("PRAGMA user_version = 5");
  }
  if (version < 6) {
    try {
      await db.execAsync(SCHEMA_V6);
    } catch {
      // the column is already there
    }
    await db.execAsync("PRAGMA user_version = 6");
  }
  if (version < 7) {
    try {
      await db.execAsync(SCHEMA_V7);
    } catch {
      // the column is already there
    }
    await db.execAsync("PRAGMA user_version = 7");
  }
  if (version < 8) {
    // Eight ALTERs, each its own statement: SQLite adds one column per ALTER,
    // and a column that is already there must not stop the ones after it.
    for (const stmt of SCHEMA_V8.split(";").map((s) => s.trim()).filter(Boolean)) {
      try {
        await db.execAsync(stmt);
      } catch {
        // the column is already there
      }
    }
    await db.execAsync("PRAGMA user_version = 8");
  }
}
