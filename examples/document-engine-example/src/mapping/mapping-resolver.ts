import type {
  DocumentDataSource,
  ProcessMapping,
  ResolveContext
} from "../types.js";

/**
 * Mapping'i kaynak adaptörüne çözdürür.
 * SQL, join, altEslestirme ve formul semantiği host adapter'da uygulanır.
 */
export class MappingResolver {
  constructor(private readonly dataSource: DocumentDataSource) {}

  async resolve(
    mapping: ProcessMapping,
    context: ResolveContext
  ): Promise<Record<string, unknown>> {
    const entries = await Promise.all(
      Object.entries(mapping).map(async ([key, definition]) => {
        const value = await this.dataSource.resolve(definition, context);
        return [key, value] as const;
      })
    );

    return Object.fromEntries(entries);
  }
}
