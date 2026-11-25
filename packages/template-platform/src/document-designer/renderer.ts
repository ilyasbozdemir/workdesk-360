import type { DocumentDefinition } from "./types.js";
import { componentRegistry } from "./component-registry.js";

/** Produces a renderer-friendly tree; a React renderer can consume this tree. */
export function renderDocumentModel(definition: DocumentDefinition) {
  return {
    title: definition.title,
    page: definition.page,
    components: definition.components.map((component) => {
      if (!componentRegistry[component.type]) throw new Error(`Unknown component: ${component.type}`);
      return { ...component, renderer: `DocumentComponent:${component.type}` };
    })
  };
}
