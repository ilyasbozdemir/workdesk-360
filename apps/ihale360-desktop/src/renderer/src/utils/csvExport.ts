/**
 * Tablo verilerini UTF-8 BOM ile noktalı virgül (;) ayrılmış CSV dosyası olarak indirir.
 *
 * @param fileName - İndirilecek dosyanın adı (örn. 'rapor.csv')
 * @param headers - Başlık dizisi
 * @param rows - Satır dizisi (her satır hücre değerlerini içerir)
 */
export function exportCsv(
  fileName: string,
  headers: (string | number)[],
  rows: (string | number)[][]
): void {
  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', fileName.endsWith('.csv') ? fileName : `${fileName}.csv`)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
