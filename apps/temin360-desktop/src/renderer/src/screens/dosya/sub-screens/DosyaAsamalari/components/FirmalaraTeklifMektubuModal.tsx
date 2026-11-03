import React, { useState, useEffect, useMemo } from 'react'
import {
  Mail,
  FileSpreadsheet,
  FileText,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Building2,
  Database,
  Radio,
  Layers,
  Sparkles,
  Info,
  X,
  ChevronRight
} from 'lucide-react'
import { Modal } from '@renderer/components/ui/Modal'
import { Button } from '@renderer/components/ui/Button'
import { Badge } from '@renderer/components/ui/Badge'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import { cn } from '@renderer/utils/cn'

export interface FirmalaraTeklifMektubuModalProps {
  isOpen: boolean
  onClose: () => void
  invitedFirms: any[]
  liveItems: any[]
  dosyaKonu?: string
  dosyaNo?: string
  onOpenSablon?: (sablonKey: string, firmData?: any, overrideCtx?: any) => void
}

export function FirmalaraTeklifMektubuModal({
  isOpen,
  onClose,
  invitedFirms = [],
  liveItems = [],
  dosyaKonu = '',
  dosyaNo = '',
  onOpenSablon
}: FirmalaraTeklifMektubuModalProps): React.JSX.Element {
  const { activeDosyaId } = useWorkspaceStore()

  // Veri Kaynağı: 'live' (Canlı / Form Verisi) vs 'saved' (Kayıtlı Veritabanı)
  const [dataSource, setDataSource] = useState<'live' | 'saved'>('live')
  // Belge Tipi: 'mektup' | 'cetvel' | 'both'
  const [docType, setDocType] = useState<'mektup' | 'cetvel' | 'both'>('mektup')
  // Seçili firmaların ID listesi (temin_firma_id veya id)
  const [selectedFirmIds, setSelectedFirmIds] = useState<number[]>([])
  // İşlem durumu
  const [isProcessing, setIsProcessing] = useState(false)
  const [processStatus, setProcessStatus] = useState<string | null>(null)

  // Kayıtlı veritabanı verisi
  const [savedData, setSavedData] = useState<{
    items: any[]
    firms: any[]
    dosya: any
  }>({
    items: [],
    firms: [],
    dosya: null
  })

  // Modal açıldığında tüm davet edilen firmaları varsayılan seç
  useEffect(() => {
    if (isOpen) {
      const allIds = invitedFirms.map((f) => f.id || f.temin_firma_id).filter(Boolean)
      setSelectedFirmIds(allIds)
      loadSavedData()
    }
  }, [isOpen, invitedFirms])

  const loadSavedData = async () => {
    if (!activeDosyaId) return
    try {
      const [dosyaRes, kalemRes, firmaRes] = await Promise.all([
        window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT * FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1',
          [activeDosyaId]
        ),
        window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT * FROM DATA_TeminKalem WHERE temin_dosya_id = ? ORDER BY sira_no ASC, id ASC',
          [activeDosyaId]
        ),
        window.electron.ipcRenderer.invoke(
          'db:query',
          `SELECT df.*, f.firma_kodu, f.adres, f.telefon, f.email, f.il, f.ilce
           FROM DATA_TeminFirma df
           LEFT JOIN TANIM_Firma f ON df.firma_id = f.id
           WHERE df.temin_dosya_id = ?
           ORDER BY df.id ASC`,
          [activeDosyaId]
        )
      ])

      setSavedData({
        dosya: dosyaRes.success ? dosyaRes.data?.[0] : null,
        items: kalemRes.success ? kalemRes.data || [] : [],
        firms: firmaRes.success ? firmaRes.data || [] : []
      })
    } catch (err) {
      console.error('Kayıtlı veri yükleme hatası:', err)
    }
  }

  // Aktif kullanılacak kalemler ve firmalar
  const activeItems = useMemo(() => {
    if (dataSource === 'live') {
      return liveItems
    }
    return savedData.items.length > 0 ? savedData.items : liveItems
  }, [dataSource, liveItems, savedData.items])

  const activeFirms = useMemo(() => {
    if (dataSource === 'live') {
      return invitedFirms
    }
    return savedData.firms.length > 0 ? savedData.firms : invitedFirms
  }, [dataSource, invitedFirms, savedData.firms])

  const toggleSelectAll = () => {
    if (selectedFirmIds.length === activeFirms.length) {
      setSelectedFirmIds([])
    } else {
      setSelectedFirmIds(activeFirms.map((f) => f.id || f.temin_firma_id).filter(Boolean))
    }
  }

  const toggleFirmSelect = (id: number) => {
    setSelectedFirmIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    )
  }

  // HTML Teklif Mektubu ve Cetveli Derleyicisi
  const buildFirmDocumentHtml = (firma: any, type: 'mektup' | 'cetvel' | 'both'): string => {
    const today = new Date().toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })

    const firmaUnvan = firma.unvan || firma.firma_unvan || 'İLGİLİ FİRMA'
    const firmaVergi = firma.vergi_no ? `(VKN: ${firma.vergi_no})` : ''
    const firmaAdres = firma.adres || `${firma.ilce || ''} ${firma.il || ''}`.trim() || '—'
    const dNo = dosyaNo || savedData.dosya?.temin_no || '—'
    const dKonu = dosyaKonu || savedData.dosya?.konu || 'Doğrudan Temin Alımı'

    const kalemRows = activeItems
      .map(
        (k, idx) => `
        <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11pt;">
          <td style="padding: 8px 10px; text-align: center; font-weight: bold; width: 40px;">${idx + 1}</td>
          <td style="padding: 8px 10px; text-align: left;">
            <div style="font-weight: 600; color: #1e293b;">${k.kalem_adi || k.malzeme_adi || k.aciklama || 'Kalem'}</div>
            ${k.aciklama && k.aciklama !== k.kalem_adi ? `<div style="font-size: 9.5pt; color: #64748b;">${k.aciklama}</div>` : ''}
          </td>
          <td style="padding: 8px 10px; text-align: center; width: 70px; font-weight: 600;">${k.miktar || 1}</td>
          <td style="padding: 8px 10px; text-align: center; width: 80px;">${k.birim || 'Adet'}</td>
          <td style="padding: 8px 10px; text-align: right; width: 110px; border-left: 1px dashed #cbd5e1; color: #94a3b8;">
            ${type === 'mektup' ? '—' : '............ TL'}
          </td>
          <td style="padding: 8px 10px; text-align: right; width: 120px; border-left: 1px dashed #cbd5e1; color: #94a3b8;">
            ${type === 'mektup' ? '—' : '............ TL'}
          </td>
        </tr>
      `
      )
      .join('')

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8" />
        <title>Teklif İsteme Mektubu - ${firmaUnvan}</title>
        <style>
          @page { size: A4 portrait; margin: 20mm 15mm 20mm 15mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.4; margin: 0; padding: 20px; }
          .header { text-align: center; margin-bottom: 25px; font-weight: bold; }
          .inst-name { font-size: 13pt; text-transform: uppercase; margin-bottom: 4px; }
          .sub-inst { font-size: 11pt; margin-bottom: 12px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 10.5pt; }
          .firm-box { border: 1px solid #000; padding: 12px; border-radius: 4px; margin-bottom: 20px; }
          .firm-title { font-weight: bold; font-size: 12pt; text-transform: uppercase; margin-bottom: 4px; }
          .body-text { text-align: justify; text-indent: 28px; margin-bottom: 16px; font-size: 11.5pt; line-height: 1.5; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
          th { border: 1px solid #000; padding: 8px; background-color: #f1f5f9; font-size: 10.5pt; font-weight: bold; text-align: center; }
          td { border: 1px solid #000; }
          .sign-area { margin-top: 40px; display: flex; justify-content: flex-end; text-align: center; }
          .signer { min-width: 220px; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <!-- Başlık -->
        <div class="header">
          <div class="inst-name">T.C.</div>
          <div class="inst-name">${savedData.dosya?.idare_adi || 'KAMU KURUMU'}</div>
          <div class="sub-inst">Destek Hizmetleri / Satınalma Birimi</div>
        </div>

        <div class="meta-row">
          <div><strong>Sayı :</strong> ${dNo}</div>
          <div><strong>Tarih:</strong> ${today}</div>
        </div>

        <!-- Firma Kutusu -->
        <div class="firm-box">
          <div class="firm-title">SAYIN: ${firmaUnvan}</div>
          <div>${firmaAdres}</div>
          ${firmaVergi ? `<div style="font-size: 10pt; color: #334155;">${firmaVergi}</div>` : ''}
        </div>

        <div style="font-weight: bold; margin-bottom: 12px; text-decoration: underline;">
          KONU: Fiyat Araştırması ve Teklif İsteme Mektubu (${dKonu})
        </div>

        <div class="body-text">
          Kurumumuzun ihtiyacı olan ve aşağıda cinsi, özellikleri ve miktarları belirtilen alım; 
          4734 sayılı Kamu İhale Kanunu'nun 22 nci maddesi uyarınca Doğrudan Temin Usulü ile temin edilecektir.
        </div>

        <div class="body-text">
          Söz konusu alıma ilişkin KDV hariç birim ve toplam teklif fiyatınızın kaşeli ve imzalı olarak 
          en geç <strong>${today}</strong> mesai bitimine kadar İdaremize ulaştırılmasını rica ederiz.
        </div>

        <!-- Kalem Tablosu -->
        <table>
          <thead>
            <tr>
              <th style="width: 35px;">S.No</th>
              <th>Mal / Hizmet / Yapım İşinin Adı ve Açıklaması</th>
              <th style="width: 65px;">Miktar</th>
              <th style="width: 75px;">Birim</th>
              <th style="width: 105px;">Teklif Birim Fiyat (KDV Hariç)</th>
              <th style="width: 115px;">Toplam Tutar (KDV Hariç)</th>
            </tr>
          </thead>
          <tbody>
            ${kalemRows}
          </tbody>
        </table>

        <!-- İmza Alanı -->
        <div class="sign-area">
          <div class="signer">
            <div style="font-weight: bold;">Satınalma / Piyasa Fiyat Araştırma Görevlisi</div>
            <div style="height: 50px;"></div>
            <div>İmza / Kaşe</div>
          </div>
        </div>

        ${
          type === 'both'
            ? `
          <div class="page-break"></div>
          <!-- 2. Sayfa: Birim Fiyat Teklif Cetveli (İstekli Dolduracak) -->
          <div class="header" style="margin-top: 20px;">
            <div class="inst-name">BİRİM FİYAT TEKLİF CETVELİ</div>
            <div class="sub-inst">(İstekli Tarafından Doldurulacaktır)</div>
          </div>

          <div style="margin-bottom: 15px; font-size: 10.5pt;">
            <strong>İşin Adı:</strong> ${dKonu}<br />
            <strong>Teklif Veren İstekli:</strong> ${firmaUnvan}
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 35px;">S.No</th>
                <th>İş Kaleminin Adı</th>
                <th style="width: 65px;">Miktar</th>
                <th style="width: 75px;">Birim</th>
                <th style="width: 105px;">Birim Fiyatı (TL)</th>
                <th style="width: 115px;">Tutarı (TL)</th>
              </tr>
            </thead>
            <tbody>
              ${kalemRows}
            </tbody>
            <tfoot>
              <tr style="font-weight: bold; background-color: #f8fafc;">
                <td colspan="5" style="text-align: right; padding: 8px;">TOPLAM TEKLİF TUTARI (KDV Hariç):</td>
                <td style="padding: 8px; text-align: right;">............... TL</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 35px; display: flex; justify-content: space-between;">
            <div style="font-size: 9.5pt; width: 60%; color: #475569;">
              * Teklif edilen fiyatlar Türk Lirası cinsinden ve KDV hariç olarak rakam ve yazı ile yazılacaktır.<br />
              * Birim fiyat teklif cetveli eksiksiz doldurularak yetkili kişi tarafından imzalanıp kaşelenmelidir.
            </div>
            <div style="text-align: center; min-width: 200px;">
              <div style="font-weight: bold;">İstekli Yetkilisi / Firma Kaşesi</div>
              <div style="height: 45px;"></div>
              <div>İmza / Tarih</div>
            </div>
          </div>
        `
            : ''
        }
      </body>
      </html>
    `
  }

  // Tekil Yazdırma
  const handlePrintSingle = async (firma: any) => {
    try {
      setIsProcessing(true)
      setProcessStatus(`${firma.unvan} için belge hazırlanıyor...`)
      const html = buildFirmDocumentHtml(firma, docType)
      await window.electron.ipcRenderer.invoke('print-html', html, { silent: false })
    } catch (err: any) {
      alert('Yazdırma sırasında hata oluştu: ' + (err.message || err))
    } finally {
      setIsProcessing(false)
      setProcessStatus(null)
    }
  }

  // Tekil PDF İndirme
  const handleExportPdfSingle = async (firma: any) => {
    try {
      setIsProcessing(true)
      setProcessStatus(`${firma.unvan} için PDF üretiliyor...`)
      const html = buildFirmDocumentHtml(firma, docType)
      const cleanUnvan = (firma.unvan || 'Firma').replace(/[^a-zA-Z0-9çğıöşüÇĞİÖŞÜ_-]/g, '_')
      const fileName = `Teklif_Isteme_Mektubu_${cleanUnvan}`
      await window.electron.ipcRenderer.invoke('export-pdf', html, null, fileName)
    } catch (err: any) {
      alert('PDF üretimi sırasında hata oluştu: ' + (err.message || err))
    } finally {
      setIsProcessing(false)
      setProcessStatus(null)
    }
  }

  // Seçili Tüm Firmalara Toplu Yazdırma
  const handleBatchPrint = async () => {
    const selectedFirms = activeFirms.filter((f) =>
      selectedFirmIds.includes(f.id || f.temin_firma_id)
    )
    if (selectedFirms.length === 0) {
      alert('Lütfen en az bir firma seçiniz.')
      return
    }

    try {
      setIsProcessing(true)
      for (let i = 0; i < selectedFirms.length; i++) {
        const firma = selectedFirms[i]
        setProcessStatus(
          `Yazdırılıyor (${i + 1}/${selectedFirms.length}): ${firma.unvan || firma.firma_unvan}...`
        )
        const html = buildFirmDocumentHtml(firma, docType)
        await window.electron.ipcRenderer.invoke('print-html', html, { silent: false })
      }
    } catch (err: any) {
      alert('Toplu yazdırma sırasında hata oluştu: ' + (err.message || err))
    } finally {
      setIsProcessing(false)
      setProcessStatus(null)
    }
  }

  // Seçili Tüm Firmalara Toplu PDF İndirme (Birleşik Tek PDF veya Seri PDF)
  const handleBatchExportPdf = async () => {
    const selectedFirms = activeFirms.filter((f) =>
      selectedFirmIds.includes(f.id || f.temin_firma_id)
    )
    if (selectedFirms.length === 0) {
      alert('Lütfen en az bir firma seçiniz.')
      return
    }

    try {
      setIsProcessing(true)
      setProcessStatus(`Seçili ${selectedFirms.length} firma için toplu PDF hazırlanıyor...`)

      // Tüm seçili firmaların HTML'lerini aralarına page-break koyarak birleştir
      const combinedBodies = selectedFirms
        .map((firma) => {
          return `<div class="firm-page-container" style="page-break-after: always; padding: 10px 0;">
            ${buildFirmDocumentHtml(firma, docType).replace(/<!DOCTYPE html>[\s\S]*?<body[^>]*>/i, '').replace(/<\/body>[\s\S]*?<\/html>/i, '')}
          </div>`
        })
        .join('\n')

      const finalCombinedHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <title>Toplu Teklif İsteme Mektupları (${selectedFirms.length} Firma)</title>
          <style>
            @page { size: A4 portrait; margin: 20mm 15mm 20mm 15mm; }
            body { font-family: 'Times New Roman', Times, serif; font-size: 11pt; color: #000; line-height: 1.4; margin: 0; }
            .header { text-align: center; margin-bottom: 25px; font-weight: bold; }
            .inst-name { font-size: 13pt; text-transform: uppercase; margin-bottom: 4px; }
            .sub-inst { font-size: 11pt; margin-bottom: 12px; }
            .meta-row { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 10.5pt; }
            .firm-box { border: 1px solid #000; padding: 12px; border-radius: 4px; margin-bottom: 20px; }
            .firm-title { font-weight: bold; font-size: 12pt; text-transform: uppercase; margin-bottom: 4px; }
            .body-text { text-align: justify; text-indent: 28px; margin-bottom: 16px; font-size: 11.5pt; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
            th { border: 1px solid #000; padding: 8px; background-color: #f1f5f9; font-size: 10.5pt; font-weight: bold; text-align: center; }
            td { border: 1px solid #000; }
            .sign-area { margin-top: 40px; display: flex; justify-content: flex-end; text-align: center; }
            .signer { min-width: 220px; }
            .page-break { page-break-before: always; }
          </style>
        </head>
        <body>
          ${combinedBodies}
        </body>
        </html>
      `

      const fileName = `Toplu_Teklif_Isteme_Mektuplari_${selectedFirms.length}_Firma`
      await window.electron.ipcRenderer.invoke('export-pdf', finalCombinedHtml, null, fileName)
    } catch (err: any) {
      alert('Toplu PDF üretimi sırasında hata oluştu: ' + (err.message || err))
    } finally {
      setIsProcessing(false)
      setProcessStatus(null)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className="max-w-4xl p-0 overflow-hidden rounded-3xl"
    >
      <div className="flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 text-white flex items-start justify-between relative overflow-hidden">
          <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-md shrink-0">
              <Mail className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white uppercase tracking-wider">
                  Doğrudan Temin • 4734 Md. 22
                </span>
                <span className="text-xs font-semibold text-white/80">
                  {activeFirms.length} İstekli Firma • {activeItems.length} Kalem
                </span>
              </div>
              <h2 className="text-xl font-black mt-1 text-white flex items-center gap-2">
                Firmalara Teklif Mektubu & Cetvel Çıkarma
              </h2>
              <p className="text-xs text-white/80 mt-1 max-w-xl">
                Davet edilen istekli firmalara gönderilecek resmi Teklif İsteme Mektuplarını ve boş
                Birim Fiyat Teklif Cetvellerini tek tıkla toplu olarak yazdırın veya PDF olarak kaydedin.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ayarlar ve Kontrol Barı */}
        <div className="p-4 px-6 bg-slate-50 dark:bg-slate-900/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
          {/* Veri Kaynağı Seçimi (Canlı vs Kayıtlı) */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Veri Kaynağı:</span>
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDataSource('live')}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                  dataSource === 'live'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
                title="Formdaki kaydedilmemiş güncel kalem ve firmalar kullanılır"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Canlı Form Verisi</span>
              </button>

              <button
                type="button"
                onClick={() => setDataSource('saved')}
                className={cn(
                  'px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer',
                  dataSource === 'saved'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                )}
                title="Veritabanındaki son kayıtlı dosya verileri kullanılır"
              >
                <Database className="w-3.5 h-3.5 text-blue-500" />
                <span>Kayıtlı Veritabanı</span>
              </button>
            </div>
          </div>

          {/* Belge Türü Seçimi */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Belge Türü:</span>
            <div className="flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-300/60 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setDocType('mektup')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  docType === 'mektup'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                Teklif İsteme Mektubu
              </button>
              <button
                type="button"
                onClick={() => setDocType('cetvel')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  docType === 'cetvel'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                Birim Fiyat Cetveli
              </button>
              <button
                type="button"
                onClick={() => setDocType('both')}
                className={cn(
                  'px-2.5 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer',
                  docType === 'both'
                    ? 'bg-white dark:bg-slate-900 text-violet-700 dark:text-violet-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400'
                )}
              >
                Mektup + Cetvel (Paket)
              </button>
            </div>
          </div>
        </div>

        {/* Firma Listesi */}
        <div className="p-6 overflow-y-auto max-h-[46vh] space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs font-semibold">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="select-all-firms"
                checked={selectedFirmIds.length === activeFirms.length && activeFirms.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 rounded text-violet-600 focus:ring-violet-500 cursor-pointer"
              />
              <label
                htmlFor="select-all-firms"
                className="text-slate-700 dark:text-slate-300 font-bold cursor-pointer"
              >
                Tüm Firmaları Seç ({selectedFirmIds.length} / {activeFirms.length} seçildi)
              </label>
            </div>

            <span className="text-slate-400">
              Yazdırılacak Kalem Sayısı: <strong>{activeItems.length}</strong>
            </span>
          </div>

          {activeFirms.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              <Building2 className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
              Davet edilen firma bulunamadı. Lütfen önce dosyaya istekli firmaları ekleyiniz.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {activeFirms.map((firma) => {
                const fId = firma.id || firma.temin_firma_id
                const isSelected = selectedFirmIds.includes(fId)
                const unvan = firma.unvan || firma.firma_unvan || 'İsimsiz Firma'
                const vkn = firma.vergi_no ? `VKN: ${firma.vergi_no}` : ''
                const tel = firma.telefon || ''

                return (
                  <div
                    key={fId}
                    className={cn(
                      'p-3.5 rounded-2xl border transition-all flex items-start justify-between gap-3',
                      isSelected
                        ? 'bg-violet-50/50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-900/60 shadow-2xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75'
                    )}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleFirmSelect(fId)}
                        className="w-4 h-4 mt-1 rounded text-violet-600 focus:ring-violet-500 cursor-pointer shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {firma.firma_kodu && (
                            <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                              {firma.firma_kodu}
                            </span>
                          )}
                          <h4 className="font-bold text-xs text-slate-800 dark:text-slate-100 truncate">
                            {unvan}
                          </h4>
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
                          {vkn && <span>{vkn}</span>}
                          {tel && <span>• {tel}</span>}
                        </div>
                      </div>
                    </div>

                    {/* Hızlı Aksiyon Butonları */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handlePrintSingle(firma)}
                        title="Bu Firma İçin Yazdır"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleExportPdfSingle(firma)}
                        title="Bu Firma İçin PDF İndir"
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer & Toplu Aksiyonlar */}
        <div className="p-4 px-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {processStatus ? (
              <span className="text-violet-600 font-bold animate-pulse">{processStatus}</span>
            ) : (
              <span>
                Toplam <strong>{selectedFirmIds.length}</strong> firma mektubu oluşturulacak.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={onClose} disabled={isProcessing}>
              Kapat
            </Button>

            <Button
              variant="outline"
              onClick={handleBatchPrint}
              disabled={isProcessing || selectedFirmIds.length === 0}
              className="gap-2 border-slate-300 dark:border-slate-700 font-bold"
            >
              <Printer className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              <span>Seçilenleri Yazdır</span>
            </Button>

            <Button
              onClick={handleBatchExportPdf}
              disabled={isProcessing || selectedFirmIds.length === 0}
              className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-violet-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Toplu PDF İndir ({selectedFirmIds.length})</span>
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

