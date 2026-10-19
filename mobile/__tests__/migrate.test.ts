// The migration helper: only "the column is already there" is tolerated.

jest.mock("expo-sqlite", () => ({}));

import { addColumns } from "../src/db/index";

const db = (fail: (stmt: string) => string | null) => {
  const ran: string[] = [];
  return {
    ran,
    execAsync: jest.fn(async (stmt: string) => {
      const msg = fail(stmt);
      if (msg) throw new Error(msg);
      ran.push(stmt);
    }),
  };
};

describe("addColumns", () => {
  it("skips a column that is already there and adds the rest", async () => {
    const d = db((s) => (s.includes(" a ") ? "duplicate column name: a" : null));
    await addColumns(d, "ALTER TABLE t ADD COLUMN a TEXT; ALTER TABLE t ADD COLUMN b TEXT;");
    expect(d.ran).toEqual(["ALTER TABLE t ADD COLUMN b TEXT"]);
  });

  it("fails on anything else, so the version is not bumped over a missing column", async () => {
    const d = db(() => "database or disk is full");
    await expect(addColumns(d, "ALTER TABLE t ADD COLUMN a TEXT;")).rejects.toThrow(/disk is full/);
  });
});
