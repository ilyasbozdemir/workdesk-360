import Handlebars from "handlebars";
import { registerHelpers } from "./helpers.js";
import { registerPartials } from "./partials.js";

let initialized = false;

export function renderTextTemplate(source: string, data: Record<string, unknown>): string {
  if (!initialized) {
    registerHelpers();
    registerPartials();
    initialized = true;
  }
  return Handlebars.compile(source, { strict: true })(data);
}
