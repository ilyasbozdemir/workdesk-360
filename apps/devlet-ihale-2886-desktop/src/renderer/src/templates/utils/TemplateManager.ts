export interface TemplateConfig {
  id: string
  name: string
  category: string
  version: string
  schema: any
  htmlPath: string
  metadata: {
    pageSize: 'A4' | 'A3'
    margins: { top: string; right: string; bottom: string; left: string }
    locale: string
  }
}

export class TemplateManager {
  private templates: Map<string, TemplateConfig> = new Map()
  private legacyPaths: Map<string, string> = new Map() // route_path/dosya_adi -> templateId mapping

  registerTemplate(config: TemplateConfig) {
    this.templates.set(config.id, config)
  }

  registerLegacyPath(path: string, templateId: string) {
    this.legacyPaths.set(path, templateId)
  }

  getTemplate(id: string): TemplateConfig | undefined {
    return this.templates.get(id)
  }

  resolveTemplateIdByPath(path: string): string | undefined {
    // legacy mapping check
    const mapped = this.legacyPaths.get(path)
    if (mapped) return mapped

    // Direct match check (removes extensions, splits to get base name)
    const clean = path
      .replace(/\.html$/, '')
      .split('/')
      .pop()
    if (clean && this.templates.has(clean)) {
      return clean
    }
    return undefined
  }

  validate(id: string, data: unknown): { success: boolean; error?: string; data?: any } {
    const config = this.templates.get(id)
    if (!config) {
      return { success: false, error: `Şablon bulunamadı: ${id}` }
    }
    const result = config.schema.safeParse(data)
    if (!result.success) {
      return { success: false, error: result.error.message }
    }
    return { success: true, data: result.data }
  }

  getAllTemplates(): TemplateConfig[] {
    return Array.from(this.templates.values())
  }

  info() {
    const all = this.getAllTemplates()
    const categories = Array.from(new Set(all.map((t) => t.category)))
    return {
      totalTemplates: all.length,
      categories,
      legacyPaths: this.legacyPaths.size
    }
  }
}

// Global Singleton Instance
export const templateManager = new TemplateManager()
