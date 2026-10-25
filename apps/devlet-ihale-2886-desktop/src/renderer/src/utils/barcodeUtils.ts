/**
 * 13 haneli EAN-13 uyumlu rastgele barkod numarası üretir.
 */
export function generateBarcode(): string {
  return Math.floor(1000000000000 + Math.random() * 9000000000000).toString()
}
