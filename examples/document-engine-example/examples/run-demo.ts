import {
  InMemorySnapshotRepository,
  MappingResolver,
  MustacheRenderer,
  SnapshotBuilder
} from "../src/index.js";
import { piyasaFiyatArastirmaDefinition } from "../src/examples/piyasa-fiyat-arastirma.definition.js";
import { DemoDataSource } from "../src/examples/demo-data-source.js";
import { readFile } from "node:fs/promises";

const repository = new InMemorySnapshotRepository();
const resolver = new MappingResolver(new DemoDataSource());
const definitions = new Map([
  [piyasaFiyatArastirmaDefinition.templateId, piyasaFiyatArastirmaDefinition]
]);

const engine = new SnapshotBuilder(definitions, resolver, repository);

const first = await engine.create({
  documentId: "DOSYA-123",
  templateId: "piyasa-fiyat-arastirma"
});

const manuallyEdited = await engine.applyOverride({
  snapshotId: first.id,
  path: "teslimSuresi",
  value: "45 gün",
  updatedBy: "demo-user"
});

// Aynı template için tekrar create çağrısı güncel kaynağı okur.
// teslimSuresi manual override olduğu için 45 gün korunur.
const refreshed = await engine.create({
  documentId: "DOSYA-123",
  templateId: "piyasa-fiyat-arastirma"
});

const template = await readFile(
  new URL("./piyasa-fiyat-arastirma.mustache", import.meta.url),
  "utf8"
);
const html = new MustacheRenderer().render(template, refreshed.data);

console.log({
  firstRevision: first.revision,
  editedRevision: manuallyEdited.revision,
  refreshedRevision: refreshed.revision,
  teslimSuresi: refreshed.data.teslimSuresi,
  html
});
