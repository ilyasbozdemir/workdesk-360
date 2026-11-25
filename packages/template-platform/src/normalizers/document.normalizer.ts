export interface NormalizedDocumentMeta {
  number: string;
  date: string;
  title: string;
}

export function normalizeDocumentMeta(doc: any): NormalizedDocumentMeta {
  return {
    number: doc?.sayi || doc?.number || '',
    date: doc?.tarih || doc?.date || new Date().toISOString(),
    title: doc?.baslik || doc?.title || ''
  };
}
