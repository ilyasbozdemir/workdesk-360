import type ExcelJS from 'exceljs'
import type { ExportContext, MasterExcelExportData } from '../types'
import {
  FONT_FAMILY,
  headerFillOfficial,
  subHeaderFillOfficial,
  thinBorder,
  zebraFill
} from '../styles'

export function buildSablonSheet(
  workbook: ExcelJS.Workbook,
  data: MasterExcelExportData,
  ctx: ExportContext
): void {
  const { sablons = [] } = data
  const { dosyaNoStr } = ctx

  const wsSablon = workbook.addWorksheet('Belge ve Şablon Envanteri', {
    pageSetup: {
      paperSize: 9, // A4
      orientation: 'landscape',
      fitToPage: true,
      fitToWidth: 1,
      fitToHeight: 0,
      margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
      showGridLines: true
    },
    views: [{ showGridLines: true }]
  })

  wsSablon.columns = [
    { width: 6 },
    { width: 34 },
    { width: 24 },
    { width: 28 },
    { width: 24 },
    { width: 45 }
  ]

  wsSablon.mergeCells('A1:F1')
  const sabTitle = wsSablon.getCell('A1')
  sabTitle.value = `${dosyaNoStr} - 4734 SAYILI KİK DOĞRUDAN TEMİN STANDART ŞABLON VE EVRAK ENVANTERİ`
  sabTitle.font = { name: FONT_FAMILY, size: 12, bold: true, color: { argb: 'FF000000' } }
  sabTitle.fill = headerFillOfficial
  sabTitle.alignment = { vertical: 'middle', horizontal: 'center' }
  wsSablon.getRow(1).height = 26

  const sabHeaders = [
    'Sıra',
    'Standart Şablon / Belge Adı',
    'Süreç Aşaması',
    'Şablon Dosyası (.html / .docx)',
    'Mevzuat Maddesi',
    'Belgenin Amacı ve Hukuki Niteliği'
  ]
  const sabHeaderRow = wsSablon.getRow(3)
  sabHeaderRow.height = 24
  sabHeaders.forEach((sh, idx) => {
    const c = sabHeaderRow.getCell(idx + 1)
    c.value = sh
    c.font = { name: FONT_FAMILY, size: 10, bold: true, color: { argb: 'FF000000' } }
    c.fill = subHeaderFillOfficial
    c.border = thinBorder
    c.alignment = { vertical: 'middle', horizontal: idx === 0 ? 'center' : 'left' }
  })

  const standardDocs =
    sablons.length > 0
      ? sablons.map((s, idx) => [
          String(idx + 1),
          s.ad || 'Şablon',
          s.kategori || 'Doğrudan Temin Süreci',
          s.dosya_adi || s.route_path || `${s.id}.html`,
          '4734 Sayılı KİK & Tebliğ',
          s.aciklama || 'Doğrudan temin süreci resmi evrak çıktısı'
        ])
      : [
          [
            '1',
            'İhtiyaç Listesi & Talep Formu',
            '1. İhtiyaç & Başlangıç',
            'ihtiyac-listesi.html',
            'KİK Md. 22',
            'Birimlerin talep ettiği malzeme/hizmet kalemlerinin resmi dökümü'
          ],
          [
            '2',
            'Lüzum Müzekkeresi',
            '1. İhtiyaç & Başlangıç',
            'luzum-muzekkeresi.html',
            'KİK Md. 22',
            'Alımın idari ve teknik gerekçesini belirten resmi talep yazısı'
          ],
          [
            '3',
            'Doğrudan Temin Onay Belgesi / Harcama Talimatı',
            '1. İhtiyaç & Başlangıç',
            'harcama-talimati.html',
            'KİK Md. 22 & Tebliğ',
            'Harcama yetkilisinden alım izni ve bütçe kullanımı onayı'
          ],
          [
            '4',
            'Piyasa Fiyat Araştırma Görevlendirmesi',
            '2. Teklifler & Piyasa',
            'piyasa-fiyat-arastirma-gorevlendirmesi.html',
            'KİK Md. 22/d',
            'Piyasa fiyat araştırması yapacak personelin görev onayı'
          ],
          [
            '5',
            'Birim Fiyat Teklif Mektubu',
            '2. Teklifler & Piyasa',
            'birim-fiyat-teklif-mektubu.html',
            'KİK Md. 22/d',
            'İstekli firmalara fiyat teklifi vermeleri için gönderilen davet mektubu'
          ],
          [
            '6',
            'Piyasa Fiyat Araştırma Tutanağı',
            '2. Teklifler & Piyasa',
            'piyasa-fiyat-arastirma-tutanagi.html',
            'KİK Md. 22/d & Tebliğ',
            'Alınan tüm tekliflerin karşılaştırılarak en uygunun belirlendiği tutanak'
          ],
          [
            '7',
            'Yaklaşık Maliyet Hesap Cetveli',
            '2. Teklifler & Piyasa',
            'yaklasik-maliyet-cetveli.html',
            'KİK Tebliği Md. 22',
            'Alımın tahmini bütçe ve piyasa ortalama maliyetinin tespit cetveli'
          ],
          [
            '8',
            'Doğrudan Temin Sözleşmesi',
            '3. Sipariş & Sözleşme',
            'dogrudan-temin-sozlesmesi.html',
            '4734 / Borçlar Kanunu',
            'Yüklenici firma ile idare arasında yapılan resmi alım sözleşmesi'
          ],
          [
            '9',
            'Sipariş Mektubu / Taahhütname',
            '3. Sipariş & Sözleşme',
            'siparis-mektubu.html',
            'KİK Md. 22',
            'Sözleşme yapılmayan hallerde işin yapılmasını bildiren resmi sipariş emri'
          ],
          [
            '10',
            'Muayene ve Kabul Tutanağı',
            '4. Muayene & Ödeme',
            'muayene-kabul-tutanagi.html',
            'Muayene ve Kabul Yön.',
            'Mal veya hizmetin teknik şartlara uygun teslim alındığına dair kabul tutanağı'
          ],
          [
            '11',
            'Harcama Pusulası & Ödeme Emri',
            '4. Muayene & Ödeme',
            'harcama-pusulasi.html',
            '5018 Sayılı KMYKK',
            'Faturanın muhasebeleştirilip yükleniciye ödeme yapılması talimatı'
          ]
        ]

  let sabRowIdx = 4
  standardDocs.forEach((sd, idx) => {
    const row = wsSablon.getRow(sabRowIdx)
    row.height = 22
    row.getCell(1).value = idx + 1
    row.getCell(1).alignment = { vertical: 'middle', horizontal: 'center' }
    row.getCell(2).value = sd[1]
    row.getCell(2).font = { name: FONT_FAMILY, size: 10, bold: true }
    row.getCell(3).value = sd[2]
    row.getCell(4).value = sd[3]
    row.getCell(5).value = sd[4]
    row.getCell(6).value = sd[5]

    for (let c = 1; c <= 6; c++) {
      const cell = row.getCell(c)
      cell.font = cell.font || { name: FONT_FAMILY, size: 10 }
      cell.border = thinBorder
      if (idx % 2 === 1) cell.fill = zebraFill
    }
    sabRowIdx++
  })
}
