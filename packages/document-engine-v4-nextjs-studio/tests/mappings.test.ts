import assert from "node:assert/strict";
import test from "node:test";
import Database from "better-sqlite3";
import { SnapshotEngine } from "../src/core/engine.js";
import { SqliteDataSource } from "../src/sqlite/source.js";
import type { TemplateDefinition } from "../src/core/types.js";

const context = { globalId: "g1", documentId: "d1" };
const rows = { path: "document.rows" as const, placeholder: "{{document.rows}}" as const, refreshPolicy: "source" as const, valueType: "array" as const, mapping: {kind:"static" as const, value:[{qty:2, price:5000},{qty:3,price:1000}]}};
const sum = {path:"document.total" as const,placeholder:"{{document.total}}" as const,refreshPolicy:"source" as const,valueType:"number" as const,mapping:{kind:"computed" as const,operation:"sum" as const,sourcePath:"document.rows" as const,valueField:"price",multiplyField:"qty"}};
const count = {path:"document.count" as const,placeholder:"{{document.count}}" as const,refreshPolicy:"source" as const,valueType:"number" as const,mapping:{kind:"computed" as const,operation:"count" as const,sourcePath:"document.rows" as const}};
const makeDefinition = (fields: TemplateDefinition["fields"]): TemplateDefinition => ({id:"mappings",version:1,schemaVersion:1,fields,form:[]});

test("computed supports out-of-order dependencies, sum, count and frozen revisions", () => {
 const engine = new SnapshotEngine({resolve: mapping => mapping.kind === "static" ? mapping.value : null});
 const def = makeDefinition([sum,count,rows]);
 const first = engine.build(def,context);
 assert.equal((first.data as any).document.total,13000);
 assert.equal((first.data as any).document.count,2);
 const second = engine.build(def,context,first);
 assert.equal((first.data as any).document.total,13000);
 assert.equal(second.revision,2);
});

test("computed rejects missing and circular dependencies, invalid numbers", () => {
 const engine = new SnapshotEngine({resolve: m => m.kind === "static" ? m.value : null});
 assert.throws(()=>engine.build(makeDefinition([sum]),context),/Unknown computed dependency/);
 const cyclic = makeDefinition([{...sum,mapping:{...sum.mapping,sourcePath:"document.total"}}]);
 assert.throws(()=>engine.build(cyclic,context),/cycle/);
 assert.throws(()=>engine.build(makeDefinition([sum,{...rows,mapping:{kind:"static",value:[{qty:1,price:"bad"}]}}]),context),/Invalid computed number/);
});

test("relation resolves a scoped, allowlisted LEFT JOIN and rejects identifiers", () => {
 const db = new Database(":memory:");
 try {
  db.exec("CREATE TABLE documents (id TEXT, birim_id TEXT); CREATE TABLE units (id TEXT, ad TEXT); INSERT INTO documents VALUES ('d1','u1'); INSERT INTO units VALUES ('u1','Fen İşleri Müdürlüğü');");
  const source = new SqliteDataSource(db);
  const mapping = {kind:"relation" as const,table:"documents",whereColumn:"id",scopeId:"documentId" as const,localColumn:"birim_id",relatedTable:"units",foreignColumn:"id",selectColumn:"ad"};
  assert.equal(source.resolve(mapping,context),"Fen İşleri Müdürlüğü");
  assert.throws(()=>source.resolve({...mapping,selectColumn:"ad; DROP TABLE units"},context),/Unapproved SQL identifier/);
 } finally { db.close(); }
});
