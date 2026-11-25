import type { DocumentComponentType } from "./types.js";

export interface ComponentDefinition {
  type: DocumentComponentType;
  description: string;
}

export const componentRegistry: Record<DocumentComponentType, ComponentDefinition> = {
  heading: { type: "heading", description: "Başlık bileşeni" },
  paragraph: { type: "paragraph", description: "Paragraf bileşeni" },
  table: { type: "table", description: "Tablo bileşeni" }
};
