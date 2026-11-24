export type DocumentComponentType = "heading" | "paragraph" | "table";

export interface DocumentComponent {
  id: string;
  type: DocumentComponentType;
  props: Record<string, unknown>;
}

export interface DocumentDefinition {
  schemaVersion: 1;
  id: string;
  title: string;
  page: { size: "A4" | "Letter"; orientation: "portrait" | "landscape"; marginMm: number };
  components: DocumentComponent[];
}
