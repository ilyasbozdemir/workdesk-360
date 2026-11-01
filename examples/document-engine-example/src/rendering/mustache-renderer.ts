import Mustache from "mustache";

export class MustacheRenderer {
  render(templateSource: string, snapshotData: Record<string, unknown>): string {
    // Renderer DB bilmez; yalnızca snapshot JSON alır.
    return Mustache.render(templateSource, snapshotData);
  }
}
