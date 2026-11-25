import { readFile } from "node:fs/promises";
import { renderFormModel } from "./form-builder/renderer.js";
import { renderDocumentModel } from "./document-designer/renderer.js";
import { renderTextTemplate } from "./handlebars-runtime/renderer.js";

const form = JSON.parse(await readFile("examples/procurement-form.json", "utf8"));
const documentDefinition = JSON.parse(await readFile("examples/procurement-document.json", "utf8"));
const submission = JSON.parse(await readFile("examples/submission.json", "utf8"));
const template = await readFile("src/handlebars-runtime/templates/procurement-summary.hbs", "utf8");

console.log("\\n--- FORM RENDER MODEL ---");
console.log(JSON.stringify(renderFormModel(form), null, 2));

console.log("\\n--- DOCUMENT RENDER MODEL ---");
console.log(JSON.stringify(renderDocumentModel(documentDefinition), null, 2));

console.log("\\n--- HANDLEBARS HTML OUTPUT ---");
console.log(renderTextTemplate(template, {
  ...submission,
  documentTitle: "Doğrudan Temin İhtiyaç Özeti"
}));
