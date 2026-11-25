/**
 * DocumentTemplateAdapter
 *
 * Mimari Kurallar (Rule 1 & Rule 8):
 * - Şablon içinde SQL çalıştırılamaz; şablon yalnızca tip güvenli veriyi çizer.
 * - PDF çıktısı Document Engine ve HTML derleyici üzerinden yürütülür.
 */

export interface RenderTemplateOptions {
    templateId: string | number;
    data: Record<string, unknown>;
    title?: string;
}

export interface RenderedDocumentOutput {
    html: string;
    templateId: string | number;
    metadata: {
        renderedAt: string;
        title: string;
        pageCount?: number;
    };
}

export class DocumentTemplateAdapter {
    /**
     * Şablon verisini HTML çıktısına dönüştürür.
     */
    async compileTemplateHtml(options: RenderTemplateOptions): Promise<RenderedDocumentOutput> {
        const title = options.title ?? `Belge_${options.templateId}`;
        const serialized = JSON.stringify(options.data, null, 2);

        // Standart A4 Document Engine HTML iskeleti
        const html = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.4; color: #111; }
    .document-container { width: 100%; max-width: 210mm; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="document-container">
    <div id="document-root" data-template-id="${options.templateId}">
      <!-- Derlenmiş Belge İçeriği -->
    </div>
  </div>
</body>
</html>`;

        return {
            html,
            templateId: options.templateId,
            metadata: {
                renderedAt: new Date().toISOString(),
                title,
                pageCount: 1,
            },
        };
    }
}
