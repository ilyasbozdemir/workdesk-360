export type TemplateStatus = "draft" | "published" | "archived";

export interface TemplateMetadata {
  id: string;
  moduleId: string;
  name: string;
  version: number;
  status: TemplateStatus;
  createdAt: string;
  updatedAt: string;
}
