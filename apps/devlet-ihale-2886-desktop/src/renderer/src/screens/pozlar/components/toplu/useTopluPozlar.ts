import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { PozItem, usePozlarHooks } from '../../pozlar.hooks'
import { APP_ROUTES } from '../../../../constants/routeConstants'
import { TopluPozRow, TopluTabType } from './toplu.types'
import { DEFAULT_GITHUB_RAW_URL, ORNEK_GITHUB_JSON_DATA, createEmptyRow } from './toplu.constants'

export function useTopluPozlar() {
  const navigate = useNavigate()
  const { bulkAddPoz } = usePozlarHooks()

  // Aktif Mod / Sekme
  const [activeTab, setActiveTab] = useState<TopluTabType>('excel_grid')

  // Excel Grid Satırları
  const [rows, setRows] = useState<TopluPozRow[]>([
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow(),
    createEmptyRow()
  ])

  // GitHub Sync State
  const [githubUrl, setGithubUrl] = useState(DEFAULT_GITHUB_RAW_URL)
  const [isFetchingGithub, setIsFetchingGithub] = useState(false)
  const [githubFetchedData, setGithubFetchedData] = useState<any[] | null>(null)
  const [githubFetchError, setGithubFetchError] = useState<string | null>(null)

  // Metin Yapıştırma State
  const [pasteText, setPasteText] = useState('')

  // Durum
  const [isSaving, setIsSaving] = useState(false)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3500)
  }

  // Row Manipulation
  const handleAddRow = () => {
    setRows((prev) => [...prev, createEmptyRow()])
  }

  const handleAddMultipleRows = (count: number) => {
    const newItems = Array.from({ length: count }, () => createEmptyRow())
    setRows((prev) => [...prev, ...newItems])
  }

  const handleUpdateRow = (id: string, field: keyof TopluPozRow, value: any) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, [field]: value } : r)))
  }

  const handleDeleteRow = (id: string) => {
    if (rows.length <= 1) {
      setRows([createEmptyRow()])
      return
    }
    setRows((prev) => prev.filter((r) => r.id !== id))
  }

  const handleClearAll = () => {
    if (confirm('Tablodaki tüm satırları temizlemek istediğinize emin misiniz?')) {
      setRows([createEmptyRow(), createEmptyRow(), createEmptyRow()])
    }
  }

  // Excel Şablon İndirme
  const handleDownloadExcelTemplate = async () => {
    const templateData = [
      {
        'Poz No (*)': '15.110.1001',
        'Eski Poz No': '14.040/1',
        'İmalat / Poz Tanımı (*)':
          'Her cins zeminde el ile yapılan (geniş-dar) derin kazılarda derinlik zammı',
        'Birim (*)': 'm³',
        'Poz Tipi': 'Analiz',
        Kurum: 'ÇŞB',
        Fasikül: 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
        'Güncel Birim Fiyat (TL)': 425.5,
        'Fiyat Dönemi': '2026/1',
        'OKAS Kodu': '45112000',
        'Yapı Sınıfı': 'İnşaat İmalatları (Kaba & İnce İşler)',
        'KDV Oranı (%)': 20,
        'Teknik Şartname / Açıklama': 'Derin kazı zammı analiz formülü dahil.'
      },
      {
        'Poz No (*)': '15.150.1005',
        'Eski Poz No': '16.025/C',
        'İmalat / Poz Tanımı (*)': 'Basınç dayanım sınıfı C 25/30 olan hazır beton dökülmesi',
        'Birim (*)': 'm³',
        'Poz Tipi': 'Analiz',
        Kurum: 'ÇŞB',
        Fasikül: '15. İnşaat İmalatları Fasikülü',
        'Güncel Birim Fiyat (TL)': 2850.0,
        'Fiyat Dönemi': '2026/1',
        'OKAS Kodu': '45000000',
        'Yapı Sınıfı': 'İnşaat İmalatları (Kaba & İnce İşler)',
        'KDV Oranı (%)': 20,
        'Teknik Şartname / Açıklama': 'Mikser ve pompa ile döküm.'
      }
    ]

    const XLSX = await import('xlsx')
    const ws = XLSX.utils.json_to_sheet(templateData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Birim_Fiyat_Pozlari')
    XLSX.writeFile(wb, 'Toplu_Birim_Fiyat_Poz_Sablonu.xlsx')
    showToast('Excel şablon dosyası indirildi.')
  }

  // Excel Dosyası Yükleme
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const XLSX = await import('xlsx')
        const bstr = evt.target?.result
        const wb = XLSX.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data: any[] = XLSX.utils.sheet_to_json(ws)

        if (data.length === 0) {
          alert('Excel dosyasında veri bulunamadı.')
          return
        }

        const parsedRows: TopluPozRow[] = data.map((item) => {
          const poz_no =
            item['Poz No (*)'] || item['Poz No'] || item['poz_no'] || item['POZ NO'] || ''
          const eski_poz_no =
            item['Eski Poz No'] || item['eski_poz_no'] || item['ESKİ POZ NO'] || ''
          const kalem_adi =
            item['İmalat / Poz Tanımı (*)'] ||
            item['Tanım'] ||
            item['İmalat Tanımı'] ||
            item['kalem_adi'] ||
            item['poz_tanimi'] ||
            ''
          const birim = item['Birim (*)'] || item['Birim'] || item['birim'] || 'm³'
          const poz_tipi = item['Poz Tipi'] || item['poz_tipi'] || 'Analiz'
          const poz_kurumu = item['Kurum'] || item['poz_kurumu'] || item['Kategori'] || 'ÇŞB'
          const fasikul =
            item['Fasikül'] || item['fasikul'] || 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası'
          const birim_fiyat =
            item['Güncel Birim Fiyat (TL)'] ||
            item['Birim Fiyat'] ||
            item['Fiyat'] ||
            item['birim_fiyat'] ||
            0
          const fiyat_donemi =
            item['Fiyat Dönemi'] || item['fiyat_donemi'] || item['Dönem'] || '2026/1'
          const okas_kodu = item['OKAS Kodu'] || item['okas_kodu'] || '45000000'
          const yapi_sinifi = item['Yapı Sınıfı'] || item['yapi_sinifi'] || 'Genel Yapım İşleri'
          const kdv_orani = Number(item['KDV Oranı (%)'] || item['kdv_orani'] || 20)
          const ozelligi =
            item['Teknik Şartname / Açıklama'] || item['Açıklama'] || item['ozelligi'] || ''

          return {
            id: Math.random().toString(36).substring(2, 9),
            poz_no: String(poz_no).trim(),
            eski_poz_no: String(eski_poz_no).trim(),
            kalem_adi: String(kalem_adi).trim(),
            birim: String(birim).trim() || 'm³',
            poz_tipi: String(poz_tipi).trim() || 'Analiz',
            poz_kurumu: String(poz_kurumu).trim() || 'ÇŞB',
            fasikul: String(fasikul).trim(),
            birim_fiyat: Number(birim_fiyat) || 0,
            fiyat_donemi: String(fiyat_donemi).trim(),
            okas_kodu: String(okas_kodu).trim(),
            yapi_sinifi: String(yapi_sinifi).trim(),
            kdv_orani: isNaN(kdv_orani) ? 20 : kdv_orani,
            ozelligi: String(ozelligi).trim()
          }
        })

        setRows(parsedRows)
        showToast(`Excel dosyasından ${parsedRows.length} adet poz aktarıldı!`)
      } catch (err: any) {
        alert('Excel dosyası okunurken hata oluştu: ' + err.message)
      }
    }
    reader.readAsBinaryString(file)
  }

  // TSV / Metin / Clipboard Yapıştırma
  const handleParsePastedText = () => {
    if (!pasteText.trim()) return

    // JSON array kontrolü
    if (pasteText.trim().startsWith('[')) {
      try {
        const json = JSON.parse(pasteText.trim())
        if (Array.isArray(json)) {
          const parsedRows: TopluPozRow[] = json.map((item) => ({
            id: Math.random().toString(36).substring(2, 9),
            poz_no: item.poz_no || '',
            eski_poz_no: item.eski_poz_no || '',
            kalem_adi: item.kalem_adi || item.poz_tanimi || '',
            birim: item.birim || item.olcu_birimi || 'm³',
            poz_tipi: item.poz_tipi || 'Analiz',
            poz_kurumu: item.poz_kurumu || item.kategori || 'ÇŞB',
            fasikul: item.fasikul || 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
            birim_fiyat: Number(item.birim_fiyat) || 0,
            fiyat_donemi: item.fiyat_donemi || '2026/1',
            okas_kodu: item.okas_kodu || '45000000',
            yapi_sinifi: item.yapi_sinifi || 'Genel Yapım İşleri',
            kdv_orani: Number(item.kdv_orani) || 20,
            ozelligi: item.ozelligi || item.notlar || ''
          }))
          setRows(parsedRows)
          setActiveTab('excel_grid')
          showToast(`${parsedRows.length} adet JSON poz kaydı tabloya yüklendi!`)
          return
        }
      } catch {
        // Fallback TSV parser below
      }
    }

    // TSV / Tab-separated lines (Excel'den kopyalanan satırlar)
    const lines = pasteText.trim().split('\n')
    const parsedRows: TopluPozRow[] = lines.map((line) => {
      const parts = line.split('\t')
      return {
        id: Math.random().toString(36).substring(2, 9),
        poz_no: parts[0]?.trim() || '',
        eski_poz_no: parts[1]?.trim() || '',
        kalem_adi: parts[2]?.trim() || '',
        birim: parts[3]?.trim() || 'm³',
        birim_fiyat: Number(parts[4]?.trim().replace(',', '.')) || 0,
        fiyat_donemi: parts[5]?.trim() || '2026/1',
        poz_tipi: parts[6]?.trim() || 'Analiz',
        poz_kurumu: parts[7]?.trim() || 'ÇŞB',
        fasikul: parts[8]?.trim() || 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
        okas_kodu: parts[9]?.trim() || '45000000',
        yapi_sinifi: 'Genel Yapım İşleri',
        kdv_orani: 20,
        ozelligi: ''
      }
    })

    if (parsedRows.length > 0) {
      setRows(parsedRows)
      setActiveTab('excel_grid')
      showToast(`${parsedRows.length} satır Excel verisi tabloya yerleştirildi!`)
    }
  }

  // GitHub'dan Raw JSON Çekme
  const handleFetchFromGithub = async () => {
    if (!githubUrl.trim()) return

    setIsFetchingGithub(true)
    setGithubFetchError(null)
    try {
      const res = await fetch(githubUrl.trim(), { cache: 'no-store' })
      if (!res.ok) {
        throw new Error(`HTTP Hata ${res.status}: ${res.statusText}`)
      }
      const data = await res.json()
      if (!Array.isArray(data)) {
        throw new Error('GitHub verisi beklenen JSON dizi (array) formatında değil.')
      }

      setGithubFetchedData(data)
      showToast(`GitHub'dan ${data.length} adet poz kaydı başarıyla çekildi!`)
    } catch (err: any) {
      setGithubFetchError(err.message || 'GitHub bağlantısı kurulamadı.')
    } finally {
      setIsFetchingGithub(false)
    }
  }

  // GitHub Verilerini Tabloya Aktar
  const handleTransferGithubToGrid = () => {
    if (!githubFetchedData || githubFetchedData.length === 0) return

    const parsedRows: TopluPozRow[] = githubFetchedData.map((item) => ({
      id: Math.random().toString(36).substring(2, 9),
      poz_no: item.poz_no || '',
      eski_poz_no: item.eski_poz_no || '',
      kalem_adi: item.kalem_adi || item.poz_tanimi || '',
      birim: item.birim || item.olcu_birimi || 'm³',
      poz_tipi: item.poz_tipi || 'Analiz',
      poz_kurumu: item.poz_kurumu || item.kategori || 'ÇŞB',
      fasikul: item.fasikul || 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
      birim_fiyat: Number(item.birim_fiyat) || 0,
      fiyat_donemi: item.fiyat_donemi || '2026/1',
      okas_kodu: item.okas_kodu || '45000000',
      yapi_sinifi: item.yapi_sinifi || 'Genel Yapım İşleri',
      kdv_orani: Number(item.kdv_orani) || 20,
      ozelligi: item.ozelligi || item.notlar || ''
    }))

    setRows(parsedRows)
    setActiveTab('excel_grid')
    showToast(`GitHub'dan alınan ${parsedRows.length} poz düzenleme tablosuna aktarıldı.`)
  }

  // Örnek JSON Formatını Panoya Kopyala
  const handleCopyJsonTemplate = () => {
    const formatted = JSON.stringify(ORNEK_GITHUB_JSON_DATA, null, 2)
    navigator.clipboard.writeText(formatted)
    showToast('Örnek GitHub pozlar.json formatı panoya kopyalandı!')
  }

  // Toplu Kaydet (SQLite Veritabanına Yaz)
  const handleBulkSave = async () => {
    const validRows = rows.filter((r) => r.poz_no.trim() || r.kalem_adi.trim())

    if (validRows.length === 0) {
      alert('Kaydedilecek geçerli bir poz satırı bulunamadı.')
      return
    }

    setIsSaving(true)
    try {
      const payloadList: Omit<PozItem, 'id'>[] = validRows.map((r) => ({
        poz_no: r.poz_no.trim(),
        eski_poz_no: r.eski_poz_no.trim() || null,
        kalem_adi: r.kalem_adi.trim() || r.poz_no.trim(),
        poz_tanimi: r.ozelligi.trim() || r.kalem_adi.trim(),
        birim: r.birim.trim() || 'm³',
        olcu_birimi: r.birim.trim() || 'm³',
        poz_tipi: r.poz_tipi.trim() || 'Analiz',
        poz_kurumu: r.poz_kurumu.trim() || 'ÇŞB',
        kategori: r.poz_kurumu.trim() || 'ÇŞB',
        fasikul: r.fasikul.trim() || 'Çevre ve Şehircilik Bakanlığı 2019 ve Sonrası',
        birim_fiyat: Number(r.birim_fiyat) || 0,
        fiyat_donemi: r.fiyat_donemi.trim() || '2026/1',
        poz_yili: 2026,
        okas_kodu: r.okas_kodu.trim() || '45000000',
        yapi_sinifi: r.yapi_sinifi.trim() || 'Genel Yapım İşleri',
        kdv_orani: Number(r.kdv_orani) || 20,
        aktif_mi: 1,
        ozelligi: r.ozelligi.trim() || null,
        birim_fiyatlar: JSON.stringify([
          {
            donem: r.fiyat_donemi.trim() || '2026/1',
            fiyat: Number(r.birim_fiyat) || 0
          }
        ])
      }))

      const result = await bulkAddPoz(payloadList)
      showToast(`${result.successCount} adet poz sisteme başarıyla kaydedildi!`)

      setTimeout(() => {
        navigate({ to: APP_ROUTES.POZLAR })
      }, 700)
    } catch (err: any) {
      alert('Toplu kaydetme sırasında hata: ' + (err?.message || 'Bilinmeyen hata'))
    } finally {
      setIsSaving(false)
    }
  }

  const validRowCount = rows.filter((r) => r.poz_no.trim() || r.kalem_adi.trim()).length

  return {
    activeTab,
    setActiveTab,
    rows,
    githubUrl,
    setGithubUrl,
    isFetchingGithub,
    githubFetchedData,
    githubFetchError,
    pasteText,
    setPasteText,
    isSaving,
    toastMessage,
    validRowCount,
    handleAddRow,
    handleAddMultipleRows,
    handleUpdateRow,
    handleDeleteRow,
    handleClearAll,
    handleDownloadExcelTemplate,
    handleFileUpload,
    handleParsePastedText,
    handleFetchFromGithub,
    handleTransferGithubToGrid,
    handleCopyJsonTemplate,
    handleBulkSave,
    navigate
  }
}
