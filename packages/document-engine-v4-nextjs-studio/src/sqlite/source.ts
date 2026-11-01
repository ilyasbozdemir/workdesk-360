import type Database from "better-sqlite3";
import type { DataSource, Mapping, ResolveContext } from "../core/types.js";
const allowed: Record<string, readonly string[]> = {
  global_settings: ["id", "kurum_ad", "kurum_adres", "logo", "yetkili_ad", "yetkili_unvan"],
  documents: ["id", "dosya_no", "konu", "tarih", "birim_id"],
  units: ["id", "ad"],
  items: ["id", "document_id", "sira_no", "ad", "miktar", "birim"],
  commission: ["id", "document_id", "ad_soyad", "unvan", "gorev"],
  offers: ["id", "document_id", "firma", "item_id", "birim_fiyat"]
};
function ident(table: string, col: string): string {
  if (!allowed[table]?.includes(col)) throw new Error(`Unapproved SQL identifier: ${table}.${col}`);
  return `"${col}"`;
}
export class SqliteDataSource implements DataSource {
  constructor(private readonly db: Database.Database) {}
  resolve(mapping: Mapping, ctx: ResolveContext): unknown {
    if (mapping.kind === "static") return mapping.value;
    if (mapping.kind === "computed") throw new Error("Computed mapping must be resolved by SnapshotEngine");
    if (mapping.kind === "relation") {
      const local = ident(mapping.table, mapping.localColumn);
      const where = ident(mapping.table, mapping.whereColumn);
      const foreign = ident(mapping.relatedTable, mapping.foreignColumn);
      const selected = ident(mapping.relatedTable, mapping.selectColumn);
      const row = this.db.prepare(`SELECT r.${selected} AS value FROM "${mapping.table}" AS t LEFT JOIN "${mapping.relatedTable}" AS r ON t.${local} = r.${foreign} WHERE t.${where} = ? LIMIT 1`).get(ctx[mapping.scopeId]) as {value: unknown} | undefined;
      return row?.value ?? null;
    }
    const table = mapping.table;
    const where = ident(table, mapping.whereColumn);
    const id = ctx[mapping.scopeId];
    if (mapping.kind === "column") {
      const col = ident(table, mapping.column);
      const row = this.db.prepare(`SELECT ${col} AS value FROM "${table}" WHERE ${where} = ? LIMIT 1`).get(id) as {value: unknown} | undefined;
      return row?.value ?? null;
    }
    const selections = Object.entries(mapping.fields).map(([alias, col]) => {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(alias)) throw new Error(`Invalid alias ${alias}`);
      return `${ident(table, col)} AS "${alias}"`;
    }).join(", ");
    const order = mapping.orderBy ? ` ORDER BY ${ident(table, mapping.orderBy)}` : "";
    return this.db.prepare(`SELECT ${selections} FROM "${table}" WHERE ${where} = ?${order}`).all(id);
  }
}
