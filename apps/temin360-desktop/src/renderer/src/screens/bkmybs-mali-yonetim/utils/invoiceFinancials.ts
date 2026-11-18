// ─── Yardımcı Fatura ve Mali Kesinti Hesaplama Fonksiyonu ─────────────────────
// 5018 & 4734 Kamu Mali Yönetimi ve Damga Vergisi Kanunu Standartları

export interface InvoiceFinancialsResult {
  matrah: number
  kdvTutari: number
  tevkifatTutari: number
  odemeDamgaVergisi: number
  sozlesmeDamgaVergisi: number
  damgaVergisi: number
  kararPulu: number
  toplamKesinti: number
  netOdenecek: number
}

export function calculateInvoiceFinancials(
  brutTutar: number,
  kdvOrani: number,
  tevkifatOrani: string = 'Yok',
  kararPuluUygula: boolean = false,
  damgaVergisiUygula: boolean = true,
  sozlesmeDamgaVergisiUygula: boolean = false
): InvoiceFinancialsResult {
  const kdvMultiplier = (100 + kdvOrani) / 100
  const matrah = brutTutar > 0 ? Number((brutTutar / kdvMultiplier).toFixed(2)) : 0
  const kdvTutari = Number((brutTutar - matrah).toFixed(2))

  // Tevkifat Hesaplama
  let tevkifatKatsayisi = 0
  if (tevkifatOrani === '2/10') tevkifatKatsayisi = 0.2
  else if (tevkifatOrani === '3/10') tevkifatKatsayisi = 0.3
  else if (tevkifatOrani === '4/10') tevkifatKatsayisi = 0.4
  else if (tevkifatOrani === '5/10') tevkifatKatsayisi = 0.5
  else if (tevkifatOrani === '7/10') tevkifatKatsayisi = 0.7
  else if (tevkifatOrani === '9/10') tevkifatKatsayisi = 0.9
  else if (tevkifatOrani === 'Tam') tevkifatKatsayisi = 1.0

  const tevkifatTutari = Number((kdvTutari * tevkifatKatsayisi).toFixed(2))
  // 1) Ödeme Emri / Fatura Damga Vergisi (488 S.K. Tablo IV/1-a binde 9,48 - KDV hariç matrah üzerinden)
  const odemeDamgaVergisi = damgaVergisiUygula ? Number((matrah * 0.00948).toFixed(2)) : 0
  // 2) Sözleşme Damga Vergisi (488 S.K. Tablo I/A-1 binde 9,48 - Dosyada sözleşme varsa tahsil edilir)
  const sozlesmeDamgaVergisi = sozlesmeDamgaVergisiUygula ? Number((matrah * 0.00948).toFixed(2)) : 0
  const damgaVergisi = Number((odemeDamgaVergisi + sozlesmeDamgaVergisi).toFixed(2))
  // Karar Pulu (binde 5,69 - matrah üzerinden; Doğrudan Teminde uygulanmaz)
  const kararPulu = kararPuluUygula ? Number((matrah * 0.00569).toFixed(2)) : 0

  const toplamKesinti = Number((damgaVergisi + kararPulu + tevkifatTutari).toFixed(2))
  const netOdenecek = Number((brutTutar - toplamKesinti).toFixed(2))

  return {
    matrah,
    kdvTutari,
    tevkifatTutari,
    odemeDamgaVergisi,
    sozlesmeDamgaVergisi,
    damgaVergisi,
    kararPulu,
    toplamKesinti,
    netOdenecek
  }
}
