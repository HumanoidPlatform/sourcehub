"""Draw the schema: db/*.sql -> build/erd/sourcehub.drawio and sourcehub.dbml.

    make erd                     # or, from sourcehub/:  python infra/erd.py

Reads the structure files in the order infra/bundle_schema.sh applies them
(seeds excluded), replays every ALTER TABLE that reshapes a table, and writes:

  build/erd/sourcehub.drawio   Open in draw.io (desktop app, or app.diagrams.net
                               -> File -> Open from -> Device). Ten pages: an
                               overview with key columns only, one page per
                               domain group with every column, and the whole
                               schema on one page. Tables sit inside a container
                               per group, so a group can be dragged as one; the
                               relationship lines attach to column rows.
  build/erd/sourcehub.dbml     Paste into https://dbdiagram.io for an auto-laid-
                               out view with table groups and enum values.

No database is opened and nothing outside the standard library is imported.

The domain groups and the links that are deliberately not foreign keys mirror
docs/database-guide.md. A table absent from GROUPS stops the
run: a new table is placed deliberately rather than landing in a heap at the
bottom of the page, the same reason bundle_schema.sh lists its files by hand.

build/ is gitignored on purpose (see infra/bundle_schema.sh): a committed
diagram would be a second schema to keep in step with db/*.sql.
"""

from __future__ import annotations

import re
import subprocess
import sys
from collections.abc import Callable
from dataclasses import dataclass, field
from pathlib import Path
from xml.sax.saxutils import escape

ROOT = Path(__file__).resolve().parents[1]
DB = ROOT / "db"
BUNDLE = ROOT / "infra" / "bundle_schema.sh"
OUT = ROOT / "build" / "erd"

# =============================================================================
# What the guide knows and the SQL does not
# =============================================================================

# (key, title, header colour, tables in reading order) — sections A-H of
# docs/database-guide.md.
GROUPS: list[tuple[str, str, str, list[str]]] = [
    (
        "identity",
        "A · Identity & access",
        "#D6E4F0",
        [
            "organisation",
            "app_user",
            "user_role_grant",
            "role",
            "permission",
            "role_permission",
            "user_session",
            "login_attempt",
            "user_password_history",
            "user_token",
            "invitation",
        ],
    ),
    (
        "onboarding",
        "B · Joining the platform",
        "#E4DDF0",
        [
            "onboarding_request",
            "onboarding_approval",
        ],
    ),
    (
        "marketplace",
        "C · Marketplace",
        "#FFE8C2",
        [
            "storage_target",
            "request",
            "proposal",
            "rfp_thread",
            "rfp_message",
            "rfp_thread_read",
        ],
    ),
    (
        "delivery",
        "D · Delivery & capture",
        "#D9EAD3",
        [
            "contract",
            "task",
            "task_offer",
            "task_offer_recipient",
            "task_assignment",
            "engagement_reminder",
            "asset",
            "submission",
            "attachment",
        ],
    ),
    (
        "qa",
        "E · Quality checks",
        "#FFD9D9",
        [
            "qa_review",
            "defect_code",
        ],
    ),
    (
        "network",
        "F · Supplier network",
        "#DCEFEF",
        [
            "crowd_worker",
            "equipment",
            "loan",
            "rating",
        ],
    ),
    (
        "money",
        "G · Money",
        "#FFF2B3",
        [
            "ledger_account",
            "ledger_transaction",
            "ledger_entry",
            "invoice",
        ],
    ),
    (
        "records",
        "H · Record-keeping & compliance",
        "#E6E6E6",
        [
            "audit_event",
            "notification",
        ],
    ),
]

# Relations the schema carries on purpose without a FOREIGN KEY: a polymorphic
# parent cannot be one.
# (child table, child column, parent table, parent column, label)
SOFT_LINKS: list[tuple[str, str, str, str, str]] = [
    ("attachment", "entity_id", "request", "id", "entity_type = 'request'"),
    ("attachment", "entity_id", "proposal", "id", "entity_type = 'proposal'"),
    ("attachment", "entity_id", "task", "id", "entity_type = 'task'"),
    ("attachment", "entity_id", "qa_review", "id", "entity_type = 'qa_review'"),
]

# Nearly every table carries these; their edges to app_user would bury every
# other line. Drawn on the "Full schema" page only.
AUDIT_COLUMNS = frozenset({"created_by", "updated_by"})


# =============================================================================
# Model
# =============================================================================


@dataclass
class Column:
    name: str
    type: str
    nullable: bool = True
    pk: bool = False
    unique: bool = False


@dataclass
class ForeignKey:
    name: str
    table: str
    columns: list[str]
    ref_table: str
    ref_columns: list[str]
    on_delete: str | None = None


@dataclass
class Table:
    name: str
    source: str
    columns: list[Column] = field(default_factory=list)
    pk: list[str] = field(default_factory=list)
    uniques: list[list[str]] = field(default_factory=list)
    fks: list[ForeignKey] = field(default_factory=list)
    partition_key: str | None = None

    def column(self, name: str) -> Column:
        for c in self.columns:
            if c.name == name:
                return c
        raise KeyError(f"{self.name}.{name}")

    def has_column(self, name: str) -> bool:
        return any(c.name == name for c in self.columns)

    def fk_columns(self) -> set[str]:
        return {c for fk in self.fks for c in fk.columns}

    def is_key(self, name: str) -> bool:
        return name in self.pk or name in self.fk_columns()

    def fk_is_one_to_one(self, fk: ForeignKey) -> bool:
        """The child side is 0..1 when the FK column(s) are the PK or unique."""
        if fk.columns == self.pk:
            return True
        if len(fk.columns) == 1 and self.column(fk.columns[0]).unique:
            return True
        return fk.columns in self.uniques


@dataclass
class Enum:
    name: str
    values: list[str]


@dataclass
class Model:
    tables: dict[str, Table] = field(default_factory=dict)
    enums: dict[str, Enum] = field(default_factory=dict)
    views: list[str] = field(default_factory=list)

    def fks(self) -> list[ForeignKey]:
        return [fk for t in self.tables.values() for fk in t.fks]


# =============================================================================
# Parser — the DDL is hand-written and regular; this reads exactly that dialect
# =============================================================================

DOLLAR_TAG = re.compile(r"\$[A-Za-z_]*\$")


def clean(text: str) -> str:
    """Drop -- comments and dollar-quoted bodies; keep string literals."""
    out: list[str] = []
    i, n = 0, len(text)
    while i < n:
        c = text[i]
        if c == "-" and text.startswith("--", i):
            j = text.find("\n", i)
            i = n if j < 0 else j
            continue
        if c == "'":
            j = i + 1
            while j < n:
                if text[j] == "'":
                    if j + 1 < n and text[j + 1] == "'":
                        j += 2
                        continue
                    break
                j += 1
            out.append(text[i : j + 1])
            i = j + 1
            continue
        if c == "$":
            m = DOLLAR_TAG.match(text, i)
            if m:
                tag = m.group(0)
                j = text.find(tag, m.end())
                if j < 0:
                    raise ValueError(f"unterminated dollar quote {tag}")
                out.append(" ")
                i = j + len(tag)
                continue
        out.append(c)
        i += 1
    return "".join(out)


def split_top(text: str, sep: str) -> list[str]:
    """Split on sep at bracket depth 0, outside string literals."""
    parts: list[str] = []
    depth = 0
    quoted = False
    start = 0
    for i, c in enumerate(text):
        if quoted:
            if c == "'":
                quoted = False
        elif c == "'":
            quoted = True
        elif c in "([":
            depth += 1
        elif c in ")]":
            depth -= 1
        elif c == sep and depth == 0:
            parts.append(text[start:i])
            start = i + 1
    parts.append(text[start:])
    return [p.strip() for p in parts if p.strip()]


def strip_parens(text: str) -> str:
    out: list[str] = []
    depth = 0
    for c in text:
        if c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
        elif depth == 0:
            out.append(c)
    return "".join(out)


def squash(text: str) -> str:
    return " ".join(text.split())


TYPE_RE = re.compile(
    r"^(?P<name>\w+)\s+(?P<type>"
    r"(?:double\s+precision"
    r"|timestamp(?:tz)?(?:\s*\(\d+\))?(?:\s+with(?:out)?\s+time\s+zone)?"
    r"|time(?:tz)?(?:\s*\(\d+\))?(?:\s+with(?:out)?\s+time\s+zone)?"
    r"|character\s+varying(?:\s*\([^)]*\))?"
    r"|bit\s+varying(?:\s*\([^)]*\))?"
    r"|\w+(?:\s*\([^)]*\))?)"
    r"(?:\s*\[\s*\])*)"
    r"(?P<rest>.*)$",
    re.I | re.S,
)
REF_RE = re.compile(
    r"\bREFERENCES\s+(?P<table>\w+)\s*(?:\(\s*(?P<col>\w+)\s*\))?"
    r"(?P<actions>(?:\s+ON\s+(?:DELETE|UPDATE)\s+"
    r"(?:CASCADE|RESTRICT|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION))*)",
    re.I,
)
ON_DELETE_RE = re.compile(
    r"ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION)", re.I
)
STRING_RE = re.compile(r"'(?:[^']|'')*'")
FK_RE = re.compile(
    r"^FOREIGN\s+KEY\s*\(\s*(?P<cols>[\w\s,]+?)\s*\)\s*REFERENCES\s+(?P<table>\w+)"
    r"\s*(?:\(\s*(?P<refcols>[\w\s,]+?)\s*\))?(?P<rest>.*)$",
    re.I | re.S,
)


def _cols(text: str) -> list[str]:
    return [c.strip() for c in text.split(",") if c.strip()]


def parse_column(table: Table, text: str) -> None:
    text = squash(text)
    m = TYPE_RE.match(text)
    if not m:
        raise ValueError(f"{table.name}: cannot read column definition: {text!r}")
    name, ctype, rest = m.group("name"), squash(m.group("type")), m.group("rest")
    col = Column(name=name, type=ctype)

    ref = REF_RE.search(rest)
    if ref:
        od = ON_DELETE_RE.search(ref.group("actions") or "")
        table.fks.append(
            ForeignKey(
                name=f"{table.name}_{name}_fkey",
                table=table.name,
                columns=[name],
                ref_table=ref.group("table"),
                ref_columns=[ref.group("col")] if ref.group("col") else [],
                on_delete=squash(od.group(1)).lower() if od else None,
            )
        )
        rest = rest[: ref.start()] + " " + rest[ref.end() :]

    flags = strip_parens(STRING_RE.sub("''", rest)).upper()
    if re.search(r"\bPRIMARY\s+KEY\b", flags):
        col.pk = True
        table.pk = [name]
    if re.search(r"\bNOT\s+NULL\b", flags) or col.pk:
        col.nullable = False
    if re.search(r"\bUNIQUE\b", flags):
        col.unique = True

    if table.has_column(name):
        raise ValueError(f"{table.name}.{name} defined twice")
    table.columns.append(col)


def parse_table_constraint(table: Table, text: str, name: str | None) -> bool:
    """PRIMARY KEY / UNIQUE / FOREIGN KEY / CHECK at table level. False if not one."""
    text = squash(text)
    m = re.match(r"^PRIMARY\s+KEY\s*\(([^)]*)\)", text, re.I)
    if m:
        table.pk = _cols(m.group(1))
        for c in table.pk:
            col = table.column(c)
            col.pk = True
            col.nullable = False
        return True
    m = re.match(r"^UNIQUE\s*\(([^)]*)\)", text, re.I)
    if m:
        cols = _cols(m.group(1))
        if len(cols) == 1:
            table.column(cols[0]).unique = True
        else:
            table.uniques.append(cols)
        return True
    m = FK_RE.match(text)
    if m:
        cols = _cols(m.group("cols"))
        od = ON_DELETE_RE.search(m.group("rest") or "")
        table.fks.append(
            ForeignKey(
                name=name or f"{table.name}_{'_'.join(cols)}_fkey",
                table=table.name,
                columns=cols,
                ref_table=m.group("table"),
                ref_columns=_cols(m.group("refcols")) if m.group("refcols") else [],
                on_delete=squash(od.group(1)).lower() if od else None,
            )
        )
        return True
    return bool(re.match(r"^(CHECK|EXCLUDE)\b", text, re.I))


def parse_body_item(table: Table, item: str) -> None:
    item = squash(item)
    m = re.match(r"^CONSTRAINT\s+(\w+)\s+(.*)$", item, re.I | re.S)
    if m:
        if not parse_table_constraint(table, m.group(2), m.group(1)):
            raise ValueError(f"{table.name}: unknown constraint form: {item!r}")
        return
    if parse_table_constraint(table, item, None):
        return
    if re.match(r"^LIKE\s+", item, re.I):
        raise ValueError(f"{table.name}: LIKE is not supported: {item!r}")
    parse_column(table, item)


def matching_paren(text: str, open_at: int) -> int:
    depth = 0
    quoted = False
    for i in range(open_at, len(text)):
        c = text[i]
        if quoted:
            if c == "'":
                quoted = False
        elif c == "'":
            quoted = True
        elif c == "(":
            depth += 1
        elif c == ")":
            depth -= 1
            if depth == 0:
                return i
    raise ValueError("unbalanced parentheses")


def handle_create_table(model: Model, stmt: str, source: str) -> None:
    m = re.match(
        r"^CREATE\s+(?:UNLOGGED\s+)?TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?(\w+)\s*(.*)$",
        stmt,
        re.I | re.S,
    )
    if not m:
        raise ValueError(f"{source}: cannot read CREATE TABLE: {squash(stmt)[:80]!r}")
    name, tail = m.group(1), m.group(2)
    if re.match(r"^PARTITION\s+OF\b", tail, re.I):
        return  # a partition of a table already drawn
    open_at = tail.index("(")
    close_at = matching_paren(tail, open_at)
    body, after = tail[open_at + 1 : close_at], tail[close_at + 1 :]
    if name in model.tables:
        raise ValueError(f"{source}: table {name} created twice")
    table = Table(name=name, source=source)
    for item in split_top(body, ","):
        parse_body_item(table, item)
    pm = re.search(r"PARTITION\s+BY\s+\w+\s*\(([^)]*)\)", after, re.I)
    if pm:
        table.partition_key = squash(pm.group(1))
    model.tables[name] = table


def handle_alter_table(model: Model, stmt: str, source: str) -> None:
    m = re.match(
        r"^ALTER\s+TABLE\s+(?:ONLY\s+)?(?:IF\s+EXISTS\s+)?(\w+)\s+(.*)$", stmt, re.I | re.S
    )
    if not m:
        raise ValueError(f"{source}: cannot read ALTER TABLE: {squash(stmt)[:80]!r}")
    name, actions = m.group(1), split_top(m.group(2), ",")
    table = model.tables.get(name)

    def known() -> Table:
        if table is None:
            raise ValueError(f"{source}: ALTER TABLE {name}: unknown table")
        return table

    for action in actions:
        action = squash(action)
        am = re.match(r"^ADD\s+CONSTRAINT\s+(\w+)\s+(.*)$", action, re.I | re.S)
        if am:
            if not parse_table_constraint(known(), am.group(2), am.group(1)):
                raise ValueError(f"{source}: {name}: unknown constraint: {action!r}")
            continue
        if re.match(r"^ADD\s+(CHECK|UNIQUE|PRIMARY|FOREIGN|EXCLUDE)\b", action, re.I):
            parse_table_constraint(known(), action[4:], None)
            continue
        am = re.match(
            r"^ADD\s+(?:COLUMN\s+)?(?:IF\s+NOT\s+EXISTS\s+)?(\w+\s+.*)$", action, re.I | re.S
        )
        if am:
            parse_column(known(), am.group(1))
            continue
        am = re.match(r"^DROP\s+(?:COLUMN\s+)?(?:IF\s+EXISTS\s+)?(\w+)", action, re.I)
        if am and not re.match(r"^DROP\s+CONSTRAINT\b", action, re.I):
            t = known()
            col = am.group(1)
            t.columns = [c for c in t.columns if c.name != col]
            t.fks = [fk for fk in t.fks if col not in fk.columns]
            t.pk = [c for c in t.pk if c != col]
            continue
        am = re.match(r"^ALTER\s+(?:COLUMN\s+)?(\w+)\s+(SET|DROP)\s+NOT\s+NULL$", action, re.I)
        if am:
            known().column(am.group(1)).nullable = am.group(2).upper() == "DROP"
            continue
        am = re.match(
            r"^ALTER\s+(?:COLUMN\s+)?(\w+)\s+(?:SET\s+DATA\s+)?TYPE\s+(.+?)"
            r"(?:\s+USING\b.*)?$",
            action,
            re.I | re.S,
        )
        if am:
            known().column(am.group(1)).type = squash(am.group(2))
            continue
        am = re.match(r"^RENAME\s+(?:COLUMN\s+)?(\w+)\s+TO\s+(\w+)$", action, re.I)
        if am:
            t = known()
            old, new = am.group(1), am.group(2)
            t.column(old).name = new
            t.pk = [new if c == old else c for c in t.pk]
            for fk in t.fks:
                fk.columns = [new if c == old else c for c in fk.columns]
            continue
        am = re.match(r"^RENAME\s+TO\s+(\w+)$", action, re.I)
        if am:
            t = known()
            new = am.group(1)
            del model.tables[name]
            t.name = new
            for fk in t.fks:
                fk.table = new
            model.tables[new] = t
            for other in model.tables.values():
                for fk in other.fks:
                    if fk.ref_table == name:
                        fk.ref_table = new
            continue
        # Row-level security, ownership, defaults, dropped constraints, storage
        # parameters: nothing a diagram shows.


def handle_drop_table(model: Model, stmt: str) -> None:
    m = re.match(
        r"^DROP\s+TABLE\s+(?:IF\s+EXISTS\s+)?([\w\s,]+?)\s*(?:CASCADE|RESTRICT)?$",
        squash(stmt),
        re.I,
    )
    if m:
        for name in _cols(m.group(1)):
            model.tables.pop(name, None)


def handle_drop_view(model: Model, stmt: str) -> None:
    m = re.match(
        r"^DROP\s+(?:MATERIALIZED\s+)?VIEW\s+(?:IF\s+EXISTS\s+)?([\w\s,]+?)\s*(?:CASCADE|RESTRICT)?$",
        squash(stmt),
        re.I,
    )
    if m:
        for name in _cols(m.group(1)):
            if name in model.views:
                model.views.remove(name)


def handle_type(model: Model, stmt: str) -> None:
    s = squash(stmt)
    m = re.match(r"^CREATE\s+TYPE\s+(\w+)\s+AS\s+ENUM\s*\((.*)\)$", s, re.I | re.S)
    if m:
        values = [v.replace("''", "'") for v in re.findall(r"'((?:[^']|'')*)'", m.group(2))]
        model.enums[m.group(1)] = Enum(m.group(1), values)
        return
    m = re.match(r"^DROP\s+TYPE\s+(?:IF\s+EXISTS\s+)?([\w\s,]+?)\s*(?:CASCADE|RESTRICT)?$", s, re.I)
    if m:
        for name in _cols(m.group(1)):
            model.enums.pop(name, None)
        return
    m = re.match(
        r"^ALTER\s+TYPE\s+(\w+)\s+ADD\s+VALUE\s+(?:IF\s+NOT\s+EXISTS\s+)?'([^']*)'"
        r"(?:\s+(BEFORE|AFTER)\s+'([^']*)')?$",
        s,
        re.I,
    )
    if m and m.group(1) in model.enums:
        values = model.enums[m.group(1)].values
        new, where, anchor = m.group(2), m.group(3), m.group(4)
        if new in values:
            return
        if where and anchor in values:
            i = values.index(anchor) + (1 if where.upper() == "AFTER" else 0)
            values.insert(i, new)
        else:
            values.append(new)


def structure_files() -> list[str]:
    text = BUNDLE.read_text(encoding="utf-8")
    m = re.search(r'STRUCTURE="([^"]*)"', text)
    if not m:
        raise SystemExit(f"no STRUCTURE list in {BUNDLE}")
    return m.group(1).split()


def build_model(files: list[str] | None = None) -> Model:
    model = Model()
    for name in files or structure_files():
        path = DB / f"{name}.sql"
        if not path.is_file():
            raise SystemExit(f"missing: db/{name}.sql (listed in infra/bundle_schema.sh)")
        source = f"db/{name}.sql"
        for stmt in split_top(clean(path.read_text(encoding="utf-8")), ";"):
            head = squash(stmt[:40]).upper()
            if head.startswith("CREATE TABLE") or head.startswith("CREATE UNLOGGED TABLE"):
                handle_create_table(model, stmt, source)
            elif head.startswith("ALTER TABLE"):
                handle_alter_table(model, stmt, source)
            elif head.startswith("DROP TABLE"):
                handle_drop_table(model, stmt)
            elif head.startswith("DROP VIEW") or head.startswith("DROP MATERIALIZED VIEW"):
                handle_drop_view(model, stmt)
            elif head.startswith(("CREATE TYPE", "ALTER TYPE", "DROP TYPE")):
                handle_type(model, stmt)
            elif re.match(r"^CREATE (OR REPLACE )?(MATERIALIZED )?VIEW ", head):
                vm = re.match(
                    r"^CREATE\s+(?:OR\s+REPLACE\s+)?(?:MATERIALIZED\s+)?VIEW\s+(\w+)",
                    squash(stmt),
                    re.I,
                )
                if vm and vm.group(1) not in model.views:
                    model.views.append(vm.group(1))
    resolve(model)
    return model


def resolve(model: Model) -> None:
    """Fill in implicit reference columns and refuse anything dangling."""
    for table in model.tables.values():
        for fk in table.fks:
            target = model.tables.get(fk.ref_table)
            if target is None:
                raise SystemExit(
                    f"{table.name}.{fk.columns}: references unknown table {fk.ref_table}"
                )
            if not fk.ref_columns:
                fk.ref_columns = list(target.pk)
            for c in fk.columns:
                table.column(c)
            for c in fk.ref_columns:
                if not target.has_column(c):
                    raise SystemExit(f"{table.name}: references {fk.ref_table}.{c}, no such column")
    mapped = {t for _, _, _, names in GROUPS for t in names}
    missing = sorted(set(model.tables) - mapped)
    extra = sorted(mapped - set(model.tables))
    if missing or extra:
        msg = []
        if missing:
            msg.append(f"tables not in GROUPS (add them to infra/erd.py): {', '.join(missing)}")
        if extra:
            msg.append(f"GROUPS names no table: {', '.join(extra)}")
        raise SystemExit("\n".join(msg))
    for child, col, parent, pcol, _ in SOFT_LINKS:
        model.tables[child].column(col)
        model.tables[parent].column(pcol)


def group_of(name: str) -> tuple[str, str, str]:
    for key, title, colour, names in GROUPS:
        if name in names:
            return key, title, colour
    raise KeyError(name)


# =============================================================================
# draw.io
# =============================================================================

W, ROW_H, HEAD_H = 260, 26, 30
KEY_W, TYPE_W = 36, 96
NAME_W = W - KEY_W - TYPE_W
PAD, GAP_X, GAP_Y, G_HEAD = 24, 40, 30, 32
GUTTER = 80

STYLE_TABLE = (
    "shape=table;startSize=30;container=1;collapsible=1;childLayout=tableLayout;"
    "fixedRows=1;rowLines=0;fontStyle=1;align=center;resizeLast=1;html=1;"
    "swimlaneFillColor=#FFFFFF;strokeColor=#5C6B7A;fontColor=#1F2933;"
)
STYLE_TABLE_EXTERNAL = (
    "fillColor=#F0F0F0;swimlaneFillColor=#FAFAFA;strokeColor=#B0B0B0;fontColor=#6B6B6B;"
)
STYLE_ROW = (
    "shape=tableRow;horizontal=0;startSize=0;swimlaneHead=0;swimlaneBody=0;"
    "fillColor=none;collapsible=0;dropTarget=0;points=[[0,0.5],[1,0.5]];"
    "portConstraint=eastwest;top=0;left=0;right=0;bottom=0;"
)
STYLE_CELL = (
    "shape=partialRectangle;connectable=0;fillColor=none;top=0;left=0;bottom=0;right=0;"
    "overflow=hidden;whiteSpace=wrap;html=1;"
)
STYLE_KEY = STYLE_CELL + "align=center;fontStyle=1;fontSize=9;fontColor=#6B7280;"
STYLE_NAME = STYLE_CELL + "align=left;spacingLeft=6;"
STYLE_TYPE = STYLE_CELL + "align=left;spacingLeft=4;fontSize=10;fontColor=#6B7280;"
STYLE_GROUP = (
    "swimlane;html=1;startSize=32;container=1;collapsible=0;fontStyle=1;fontSize=14;"
    "align=left;spacingLeft=12;swimlaneFillColor=#FBFCFD;strokeColor=#9AA5B1;"
    "rounded=1;arcSize=3;fontColor=#1F2933;"
)
STYLE_EDGE = "edgeStyle=entityRelationEdgeStyle;html=1;endFill=0;startFill=0;strokeColor=#5C6B7A;"
STYLE_EDGE_SOFT = STYLE_EDGE + "dashed=1;strokeColor=#9AA5B1;fontSize=9;fontColor=#6B7280;"
STYLE_EDGE_AUDIT = STYLE_EDGE + "strokeColor=#C4CCD4;"
STYLE_LEGEND = (
    "text;html=1;align=left;verticalAlign=top;whiteSpace=wrap;fontSize=11;spacing=6;"
    "strokeColor=#9AA5B1;fillColor=#FFFFFF;rounded=1;arcSize=6;fontColor=#1F2933;"
)


def attr(value: str) -> str:
    return escape(value, {'"': "&quot;"})


RowsFor = Callable[[Table], list[Column]]


def rows_keys(t: Table) -> list[Column]:
    """Primary and foreign key columns, minus the audit pair whose edges are
    hidden on the same pages."""
    keys = [c for c in t.columns if t.is_key(c.name) and c.name not in AUDIT_COLUMNS]
    return keys or t.columns[:1]


def rows_all(t: Table) -> list[Column]:
    return list(t.columns)


class Page:
    def __init__(self, page_id: str, name: str) -> None:
        self.id = page_id
        self.name = name
        self.cells: list[str] = []
        self.rows: set[str] = set()  # "table.column" rendered on this page
        self.tables: set[str] = set()
        self.edges = 0

    def add(self, xml: str) -> None:
        self.cells.append(xml)

    def table(
        self, t: Table, x: int, y: int, rows: list[Column], parent: str, *, external: bool = False
    ) -> int:
        height = HEAD_H + ROW_H * len(rows)
        style = STYLE_TABLE
        if external:
            style += STYLE_TABLE_EXTERNAL
        else:
            style += f"fillColor={group_of(t.name)[2]};"
        label = t.name
        notes = []
        if t.partition_key:
            notes.append(f"partitioned by {t.partition_key}")
        if external:
            notes.append("other group")
        if notes:
            label += (
                f'<br><font style="font-size:9px;font-weight:normal">{" · ".join(notes)}</font>'
            )
        tid = f"t:{t.name}"
        self.add(
            f'<mxCell id="{tid}" value="{attr(label)}" style="{style}" vertex="1" '
            f'parent="{parent}"><mxGeometry x="{x}" y="{y}" width="{W}" height="{height}" '
            f'as="geometry"/></mxCell>'
        )
        fkcols = t.fk_columns()
        for i, c in enumerate(rows):
            rid = f"r:{t.name}.{c.name}"
            self.rows.add(f"{t.name}.{c.name}")
            self.add(
                f'<mxCell id="{rid}" value="" style="{STYLE_ROW}" vertex="1" parent="{tid}">'
                f'<mxGeometry y="{HEAD_H + i * ROW_H}" width="{W}" height="{ROW_H}" '
                f'as="geometry"/></mxCell>'
            )
            marks = []
            if c.pk:
                marks.append("PK")
            if c.name in fkcols:
                marks.append("FK")
            name_style = STYLE_NAME
            if c.pk and c.name in fkcols:
                name_style += "fontStyle=6;"
            elif c.pk:
                name_style += "fontStyle=4;"
            elif c.name in fkcols:
                name_style += "fontStyle=2;"
            ctype = c.type + ("?" if c.nullable else "")
            if c.unique and not c.pk:
                ctype += " U"
            self._cell(f"{rid}:k", rid, ",".join(marks), STYLE_KEY, 0, KEY_W)
            self._cell(f"{rid}:n", rid, c.name, name_style, KEY_W, NAME_W)
            self._cell(f"{rid}:t", rid, ctype, STYLE_TYPE, KEY_W + NAME_W, TYPE_W)
        self.tables.add(t.name)
        return height

    def _cell(self, cid: str, parent: str, value: str, style: str, x: int, width: int) -> None:
        self.add(
            f'<mxCell id="{cid}" value="{attr(value)}" style="{style}" vertex="1" '
            f'parent="{parent}"><mxGeometry x="{x}" width="{width}" height="{ROW_H}" '
            f'as="geometry"><mxRectangle width="{width}" height="{ROW_H}" '
            f'as="alternateBounds"/></mxGeometry></mxCell>'
        )

    def group(self, gid: str, title: str, colour: str, x: int, y: int, w: int, h: int) -> None:
        self.add(
            f'<mxCell id="{gid}" value="{attr(title)}" '
            f'style="{STYLE_GROUP}fillColor={colour};" vertex="1" parent="1">'
            f'<mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" as="geometry"/></mxCell>'
        )

    def edge(self, eid: str, src: str, dst: str, style: str, label: str = "") -> None:
        self.add(
            f'<mxCell id="{eid}" value="{attr(label)}" style="{style}" edge="1" parent="1" '
            f'source="{src}" target="{dst}"><mxGeometry relative="1" as="geometry"/></mxCell>'
        )
        self.edges += 1

    def endpoint(self, table: str, column: str) -> str:
        return f"r:{table}.{column}" if f"{table}.{column}" in self.rows else f"t:{table}"

    def legend(self, html: str, x: int, y: int, w: int, h: int) -> None:
        self.add(
            f'<mxCell id="legend" value="{attr(html)}" style="{STYLE_LEGEND}" vertex="1" '
            f'parent="1"><mxGeometry x="{x}" y="{y}" width="{w}" height="{h}" '
            f'as="geometry"/></mxCell>'
        )

    def xml(self) -> str:
        body = "\n".join(self.cells)
        return (
            f'  <diagram id="{self.id}" name="{attr(self.name)}">\n'
            f'    <mxGraphModel dx="0" dy="0" grid="1" gridSize="10" guides="1" tooltips="1" '
            f'connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="1169" '
            f'pageHeight="827" math="0" shadow="0">\n'
            f'      <root>\n<mxCell id="0"/>\n<mxCell id="1" parent="0"/>\n{body}\n'
            f"      </root>\n    </mxGraphModel>\n  </diagram>"
        )


def layout_group(
    tables: list[Table], rows_for: RowsFor, max_cols: int = 3
) -> tuple[list[tuple[Table, int, int]], int, int]:
    """Pack tables into columns, shortest column first. Coordinates are relative
    to the group container."""
    ncols = max(1, min(max_cols, len(tables)))
    heights = [0] * ncols
    placed: list[tuple[Table, int, int]] = []
    for t in tables:
        h = HEAD_H + ROW_H * len(rows_for(t))
        c = min(range(ncols), key=lambda i: heights[i])
        placed.append((t, PAD + c * (W + GAP_X), G_HEAD + PAD + heights[c]))
        heights[c] += h + GAP_Y
    width = PAD * 2 + ncols * W + (ncols - 1) * GAP_X
    height = G_HEAD + PAD + max(heights) - GAP_Y + PAD
    return placed, width, height


def draw_groups(
    page: Page,
    model: Model,
    groups: list[tuple[str, str, str, list[str]]],
    rows_for: RowsFor,
    x0: int,
    y0: int,
    per_row: int = 3,
    max_cols: int = 3,
) -> int:
    """Tile group containers per_row across; returns the y below the last row."""
    x, y, row_h = x0, y0, 0
    for i, (key, title, colour, names) in enumerate(groups):
        tables = [model.tables[n] for n in names]
        placed, w, h = layout_group(tables, rows_for, max_cols)
        if i and i % per_row == 0:
            x, y, row_h = x0, y + row_h + GUTTER, 0
        gid = f"g:{key}"
        page.group(gid, title, colour, x, y, w, h)
        for t, tx, ty in placed:
            page.table(t, tx, ty, rows_for(t), gid)
        x += w + GUTTER
        row_h = max(row_h, h)
    return y + row_h


def is_audit_fk(fk: ForeignKey) -> bool:
    return fk.columns[0] in AUDIT_COLUMNS and fk.ref_table == "app_user"


def draw_edges(page: Page, model: Model, *, audit: bool) -> None:
    for fk in model.fks():
        if fk.table not in page.tables or fk.ref_table not in page.tables:
            continue
        if is_audit_fk(fk) and not audit:
            continue
        child = model.tables[fk.table]
        nullable = any(child.column(c).nullable for c in fk.columns)
        start = "ERzeroToOne" if child.fk_is_one_to_one(fk) else "ERmany"
        end = "ERzeroToOne" if nullable else "ERone"
        style = STYLE_EDGE_AUDIT if is_audit_fk(fk) else STYLE_EDGE
        page.edge(
            f"e:{fk.name}",
            page.endpoint(fk.table, fk.columns[0]),
            page.endpoint(fk.ref_table, fk.ref_columns[0]),
            style + f"startArrow={start};endArrow={end};",
        )
    for child, col, parent, pcol, label in SOFT_LINKS:
        if child in page.tables and parent in page.tables:
            page.edge(
                f"s:{child}.{col}->{parent}",
                page.endpoint(child, col),
                page.endpoint(parent, pcol),
                STYLE_EDGE_SOFT + "startArrow=ERmany;endArrow=ERzeroToOne;",
                label,
            )


LEGEND = (
    "<b>SourceHub database — overview, key columns only.</b> One page per group follows, "
    "with every column; the last page is the whole schema.<br>"
    "<u>underlined</u> primary key · <i>italic</i> foreign key · <code>type?</code> nullable · "
    "<code>U</code> unique · crow's foot = many side, ○ = optional · "
    "dashed line = link kept without a foreign key on purpose · "
    "created_by / updated_by → app_user drawn on the Full schema page only.<br>"
    "Generated by infra/erd.py from db/*.sql (revision {rev}). Do not edit: change db/ and "
    "run <code>make erd</code>. Read docs/database-guide.md for what each table is for."
)


def related_tables(model: Model, own: set[str]) -> list[str]:
    """Tables outside `own` joined to it by a foreign key or a soft link."""
    related: list[str] = []
    pairs = [(fk.table, fk.ref_table) for fk in model.fks() if not is_audit_fk(fk)]
    pairs += [(child, parent) for child, _, parent, _, _ in SOFT_LINKS]
    for a, b in pairs:
        for x, y in ((a, b), (b, a)):
            if x in own and y not in own and y not in related:
                related.append(y)
    order = {n: i for i, (_, _, _, ns) in enumerate(GROUPS) for n in ns}
    return sorted(related, key=lambda n: (order[n], n))


def render_drawio(model: Model, rev: str) -> str:
    pages: list[Page] = []

    overview = Page("p-overview", "Overview")
    overview.legend(LEGEND.format(rev=rev), 0, 0, 1200, 84)
    draw_groups(overview, model, GROUPS, rows_keys, 0, 120)
    draw_edges(overview, model, audit=False)
    pages.append(overview)

    for key, title, colour, names in GROUPS:
        page = Page(f"p-{key}", title)
        tables = [model.tables[n] for n in names]
        placed, w, h = layout_group(tables, rows_all, 3)
        page.group(f"g:{key}", title, colour, 0, 0, w, h)
        for t, tx, ty in placed:
            page.table(t, tx, ty, rows_all(t), f"g:{key}")
        related = related_tables(model, set(names))
        if related:
            ext = [model.tables[n] for n in related]
            eplaced, ew, eh = layout_group(ext, rows_keys, 2)
            page.group(
                "g:related",
                "Related tables in other groups (key columns only)",
                "#F0F0F0",
                w + GUTTER,
                0,
                ew,
                eh,
            )
            for t, tx, ty in eplaced:
                page.table(t, tx, ty, rows_keys(t), "g:related", external=True)
        draw_edges(page, model, audit=False)
        pages.append(page)

    full = Page("p-full", "Full schema")
    draw_groups(full, model, GROUPS, rows_all, 0, 0, per_row=4, max_cols=3)
    draw_edges(full, model, audit=True)
    pages.append(full)

    return (
        '<mxfile host="infra/erd.py" type="device" version="1">\n'
        + "\n".join(p.xml() for p in pages)
        + "\n</mxfile>\n"
    )


# =============================================================================
# DBML — https://dbml.dbdiagram.io/docs
# =============================================================================


def dbml_type(t: str) -> str:
    return f'"{t}"' if re.search(r"[\[\] ]", t) else t


def dbml_note(text: str) -> str:
    return "'" + text.replace("\\", "\\\\").replace("'", "\\'") + "'"


def render_dbml(model: Model, rev: str) -> str:
    out: list[str] = []
    views = ", ".join(model.views) or "none"
    out.append("Project sourcehub {\n  database_type: 'PostgreSQL'\n  Note: '''")
    out.append(
        f"    Generated by infra/erd.py from db/*.sql (revision {rev}); regenerate with make erd."
    )
    out.append("    Groups follow docs/database-guide.md.")
    out.append(f"    Views (not drawn): {views}.")
    out.append("    Links drawn dashed in the .drawio file are not foreign keys here either:")
    for child, col, parent, pcol, label in SOFT_LINKS:
        out.append(f"      {child}.{col} -> {parent}.{pcol} ({label})")
    out.append("  '''\n}\n")

    for e in model.enums.values():
        out.append(f"Enum {e.name} {{")
        out.extend(f"  {v}" if re.match(r"^\w+$", v) else f'  "{v}"' for v in e.values)
        out.append("}\n")

    for _key, title, colour, names in GROUPS:
        for name in names:
            t = model.tables[name]
            out.append(f"Table {t.name} [headercolor: {colour}] {{")
            for c in t.columns:
                settings = []
                if c.pk and len(t.pk) == 1:
                    settings.append("pk")
                if not c.nullable and not (c.pk and len(t.pk) == 1):
                    settings.append("not null")
                if c.unique:
                    settings.append("unique")
                suffix = f" [{', '.join(settings)}]" if settings else ""
                out.append(f"  {c.name} {dbml_type(c.type)}{suffix}")
            if len(t.pk) > 1 or t.uniques:
                out.append("  indexes {")
                if len(t.pk) > 1:
                    out.append(f"    ({', '.join(t.pk)}) [pk]")
                for u in t.uniques:
                    out.append(f"    ({', '.join(u)}) [unique]")
                out.append("  }")
            note = f"{title} · {t.source}"
            if t.partition_key:
                note += f" · partitioned by {t.partition_key}"
            out.append(f"  Note: {dbml_note(note)}")
            out.append("}\n")

    for fk in model.fks():
        if len(fk.columns) == 1:
            left = f"{fk.table}.{fk.columns[0]}"
            right = f"{fk.ref_table}.{fk.ref_columns[0]}"
        else:
            left = f"{fk.table}.({', '.join(fk.columns)})"
            right = f"{fk.ref_table}.({', '.join(fk.ref_columns)})"
        child = model.tables[fk.table]
        op = "-" if child.fk_is_one_to_one(fk) else ">"
        settings = f" [delete: {fk.on_delete}]" if fk.on_delete else ""
        out.append(f"Ref {fk.name}: {left} {op} {right}{settings}")
    out.append("")

    for key, _title, _, names in GROUPS:
        out.append(f"TableGroup {key} {{")
        out.extend(f"  {n}" for n in names)
        out.append("}\n")
    return "\n".join(out)


# =============================================================================


def git_revision() -> str:
    try:
        return subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "--short", "HEAD"],
            capture_output=True,
            text=True,
            check=True,
        ).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return "unknown"


def main() -> int:
    model = build_model()
    rev = git_revision()
    OUT.mkdir(parents=True, exist_ok=True)
    drawio = OUT / "sourcehub.drawio"
    dbml = OUT / "sourcehub.dbml"
    drawio.write_text(render_drawio(model, rev), encoding="utf-8", newline="\n")
    dbml.write_text(render_dbml(model, rev), encoding="utf-8", newline="\n")
    ncols = sum(len(t.columns) for t in model.tables.values())
    print(f"  {drawio.relative_to(ROOT)}   {len(GROUPS) + 2} pages")
    print(f"  {dbml.relative_to(ROOT)}")
    print(
        f"  {len(model.tables)} tables, {ncols} columns, {len(model.fks())} foreign keys, "
        f"{len(SOFT_LINKS)} soft links, {len(model.enums)} enums, {len(model.views)} views"
    )
    print()
    print(
        "  Open the .drawio in draw.io (File > Open from > Device); "
        "paste the .dbml into dbdiagram.io."
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
