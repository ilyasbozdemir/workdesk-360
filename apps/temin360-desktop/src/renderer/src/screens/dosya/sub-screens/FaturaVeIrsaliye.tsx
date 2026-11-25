import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  CreditCard,
  Upload,
  Trash2,
  Edit2,
  Plus,
  Search,
  TrendingUp,
  AlertCircle,
  X,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  ExternalLink,
  Loader2,
  Download
} from 'lucide-react'
import { SubScreen } from '../SubScreens.screen'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'

export interface InvoiceFile {
  id: number
  fileName: string
  filePath: string
  fileType: 'fatura' | 'irsaliye'
  amount: number
  date: string
  status: 'Approved' | 'Pending'
  paymentStatus: 'odendi' | 'bekliyor'
  yevmiyeNo: string
  aciklama: string
  fileSize?: number
  mimeType?: string
}

interface PreviewState {
  isOpen: boolean
  file: InvoiceFile | null
  loading: boolean
  dataUrl?: string
  error?: string
}

export function FaturaVeIrsaliye(): React.JSX.Element {
  const activeDosyaId = useWorkspaceStore((s) => s.activeDosyaId)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'fatura' | 'irsaliye'>('all')
  const [editingFile, setEditingFile] = useState<InvoiceFile | null>(null)
  const [files, setFiles] = useState<InvoiceFile[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Preview Modal State
  const [preview, setPreview] = useState<PreviewState>({
    isOpen: false,
    file: null,
    loading: false
  })

  // Veritabanından ve aktif dosyadan kayıtları yükle
  const loadFiles = useCallback(async () => {
    if (!activeDosyaId) {
      setFiles([])
      return
    }

    try {
      setIsLoading(true)
      const rows = (await window.electron.ipcRenderer.invoke(
        'db:query',
        `SELECT id, temin_dosya_id, belge_adi, sablon_kodu, dosya_yolu, belge_tarihi, durum, veri_json, is_signed, created_at
         FROM DATA_TeminBelge 
         WHERE temin_dosya_id = ? 
           AND (sablon_kodu IN ('fatura', 'irsaliye') OR veri_json LIKE '%"fileType"%')
         ORDER BY id DESC`,
        [activeDosyaId]
      )) as any[]

      const parsedFiles: InvoiceFile[] = (rows || []).map((row) => {
        let meta: any = {}
        try {
          if (row.veri_json) {
            meta = JSON.parse(row.veri_json)
          }
        } catch {
          meta = {}
        }

        const isIrsaliye =
          meta.fileType === 'irsaliye' ||
          row.sablon_kodu === 'irsaliye' ||
          (row.belge_adi && row.belge_adi.toLowerCase().includes('irsaliye'))

        return {
          id: row.id,
          fileName: row.belge_adi || 'Adsiz_Belge.pdf',
          filePath: row.dosya_yolu || '',
          fileType: isIrsaliye ? 'irsaliye' : 'fatura',
          amount: typeof meta.amount === 'number' ? meta.amount : parseFloat(meta.amount) || 0,
          date:
            row.belge_tarihi ||
            (row.created_at ? row.created_at.split(' ')[0] : new Date().toISOString().split('T')[0]),
          status: row.durum === 'Approved' ? 'Approved' : 'Pending',
          paymentStatus: meta.paymentStatus === 'odendi' ? 'odendi' : 'bekliyor',
          yevmiyeNo: meta.yevmiyeNo || '',
          aciklama: meta.aciklama || '',
          fileSize: meta.fileSize,
          mimeType: meta.mimeType || 'application/pdf'
        }
      })

      setFiles(parsedFiles)
    } catch (err) {
      console.error('[FaturaVeIrsaliye] Belgeler yüklenirken hata:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeDosyaId])

  useEffect(() => {
    loadFiles()
  }, [loadFiles])

  // Dosya Yükleme (ZIP içine paketleme ve DB kaydı)
  const handleUploadFile = async (fileObj: File): Promise<void> => {
    if (!activeDosyaId) {
      alert('Lütfen önce bir doğrudan temin dosyası seçiniz.')
      return
    }

    try {
      setIsUploading(true)
      const isIrsaliye = fileObj.name.toLowerCase().includes('irsaliye')
      let relativePath = ''

      // 1. Electron ortamında doğrudan path varsa veya Buffer ile yükleme
      const maybeElectronFile = fileObj as any
      if (maybeElectronFile.path && typeof maybeElectronFile.path === 'string') {
        const uploadRes = await window.electron.ipcRenderer.invoke(
          'workspace:upload-file',
          maybeElectronFile.path
        )
        if (!uploadRes.success) {
          throw new Error(uploadRes.error || 'Dosya arşivlenemedi.')
        }
        relativePath = uploadRes.relativePath
      } else {
        // Tarayıcı / Drop ortamında ArrayBuffer okuyup Base64 ile gönder
        const arrayBuffer = await fileObj.arrayBuffer()
        const bytes = new Uint8Array(arrayBuffer)
        let binary = ''
        const chunkSize = 8192
        for (let i = 0; i < bytes.byteLength; i += chunkSize) {
          binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)))
        }
        const base64Data = btoa(binary)

        const uploadRes = await window.electron.ipcRenderer.invoke('workspace:upload-file-buffer', {
          fileName: fileObj.name,
          bufferBase64: base64Data
        })
        if (!uploadRes.success) {
          throw new Error(uploadRes.error || 'Dosya arşive yüklenemedi.')
        }
        relativePath = uploadRes.relativePath
      }

      // 2. DATA_TeminBelge tablosuna bağla
      const initialMeta = {
        fileType: isIrsaliye ? 'irsaliye' : 'fatura',
        amount: isIrsaliye ? 0 : 0,
        paymentStatus: 'bekliyor',
        yevmiyeNo: '',
        aciklama: `${isIrsaliye ? 'Malzeme teslim irsaliyesi' : 'Fatura belgesi'} eklendi.`,
        fileSize: fileObj.size,
        mimeType: fileObj.type || 'application/pdf'
      }

      await window.electron.ipcRenderer.invoke(
        'db:query',
        `INSERT INTO DATA_TeminBelge (
          temin_dosya_id, dosya_id, belge_adi, sablon_kodu, dosya_yolu, 
          belge_tarihi, durum, veri_json, is_signed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          activeDosyaId,
          activeDosyaId,
          fileObj.name,
          isIrsaliye ? 'irsaliye' : 'fatura',
          relativePath,
          new Date().toISOString().split('T')[0],
          'Pending',
          JSON.stringify(initialMeta),
          0
        ]
      )

      await loadFiles()
    } catch (err: any) {
      console.error('[FaturaVeIrsaliye] Dosya yükleme hatası:', err)
      alert(`Dosya yüklenirken hata oluştu: ${err.message || String(err)}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent): void => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = async (e: React.DragEvent): Promise<void> => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadFile(e.dataTransfer.files[0])
    }
  }

  // Belge Önizleme (ZIP paketinden çözerek Base64 Data URL ile açma)
  const handleOpenPreview = async (file: InvoiceFile): Promise<void> => {
    if (!file.filePath) {
      alert('Bu belgeye ait fiziksel dosya yolu bulunamadı.')
      return
    }

    setPreview({
      isOpen: true,
      file,
      loading: true,
      error: undefined
    })

    try {
      const res = await window.electron.ipcRenderer.invoke(
        'workspace:read-attachment-base64',
        file.filePath
      )

      if (res.success && res.data?.base64) {
        const mime = res.data.mimeType || file.mimeType || 'application/pdf'
        const dataUrl = `data:${mime};base64,${res.data.base64}`
        setPreview({
          isOpen: true,
          file,
          loading: false,
          dataUrl
        })
      } else {
        throw new Error(res.error || 'Dosya arşivden okunamadı.')
      }
    } catch (err: any) {
      console.error('[FaturaVeIrsaliye] Önizleme yükleme hatası:', err)
      setPreview({
        isOpen: true,
        file,
        loading: false,
        error: `Belge önizlemesi yüklenemedi: ${err.message || String(err)}`
      })
    }
  }

  // Harici Programla Aç (Adobe Reader / varsayılan görüntüleyici)
  const handleOpenExternal = async (filePath: string): Promise<void> => {
    try {
      await window.electron.ipcRenderer.invoke('workspace:open-file', filePath)
    } catch (err: any) {
      alert(`Dosya açılamadı: ${err.message || String(err)}`)
    }
  }

  // Belge Silme
  const handleDelete = async (file: InvoiceFile): Promise<void> => {
    if (!confirm(`"${file.fileName}" belgesini silmek istediğinize emin misiniz?`)) return

    try {
      await window.electron.ipcRenderer.invoke(
        'db:query',
        'DELETE FROM DATA_TeminBelge WHERE id = ?',
        [file.id]
      )

      if (file.filePath) {
        await window.electron.ipcRenderer.invoke('workspace:delete-attachment', file.filePath)
      }

      await loadFiles()
    } catch (err: any) {
      console.error('[FaturaVeIrsaliye] Silme hatası:', err)
      alert(`Belge silinemedi: ${err.message || String(err)}`)
    }
  }

  // Ödeme Durumunu Değiştir
  const togglePaymentStatus = async (file: InvoiceFile): Promise<void> => {
    const nextStatus = file.paymentStatus === 'odendi' ? 'bekliyor' : 'odendi'
    try {
      const currentMeta = {
        fileType: file.fileType,
        amount: file.amount,
        paymentStatus: nextStatus,
        yevmiyeNo: file.yevmiyeNo,
        aciklama: file.aciklama,
        fileSize: file.fileSize,
        mimeType: file.mimeType
      }

      await window.electron.ipcRenderer.invoke(
        'db:query',
        'UPDATE DATA_TeminBelge SET veri_json = ? WHERE id = ?',
        [JSON.stringify(currentMeta), file.id]
      )

      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, paymentStatus: nextStatus } : f))
      )
    } catch (err: any) {
      console.error('[FaturaVeIrsaliye] Ödeme durumu güncelleme hatası:', err)
    }
  }

  // Detay Düzenleme Kaydet
  const handleSaveChanges = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!editingFile) return

    try {
      const meta = {
        fileType: editingFile.fileType,
        amount: editingFile.amount,
        paymentStatus: editingFile.paymentStatus,
        yevmiyeNo: editingFile.yevmiyeNo,
        aciklama: editingFile.aciklama,
        fileSize: editingFile.fileSize,
        mimeType: editingFile.mimeType
      }

      await window.electron.ipcRenderer.invoke(
        'db:query',
        'UPDATE DATA_TeminBelge SET veri_json = ?, belge_tarihi = ? WHERE id = ?',
        [JSON.stringify(meta), editingFile.date, editingFile.id]
      )

      await loadFiles()
      setEditingFile(null)
    } catch (err: any) {
      console.error('[FaturaVeIrsaliye] Güncelleme hatası:', err)
      alert(`Değişiklikler kaydedilemedi: ${err.message || String(err)}`)
    }
  }

  const filteredFiles = files.filter((f) => {
    const matchesSearch =
      f.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.aciklama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.yevmiyeNo.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = filterType === 'all' || f.fileType === filterType
    return matchesSearch && matchesType
  })

  const totalInvoiced = files
    .filter((f) => f.fileType === 'fatura')
    .reduce((sum, f) => sum + f.amount, 0)

  const paidInvoiced = files
    .filter((f) => f.fileType === 'fatura' && f.paymentStatus === 'odendi')
    .reduce((sum, f) => sum + f.amount, 0)

  return (
    <SubScreen
      title="Fatura ve İrsaliye Yönetimi"
      icon={CreditCard}
      description="Doğrudan temin dosyasına ait fatura, irsaliye, e-arşiv faturaları yükleyin, ZIP arşivinde saklayın ve yönetin."
    >
      <div className="flex flex-col gap-6 animate-in fade-in duration-300">
        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-linear-to-br from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800 rounded-2xl p-5 text-white shadow-md flex flex-col justify-between">
            <div>
              <span className="text-blue-100 text-xs font-semibold uppercase tracking-wider">
                Toplam Fatura Tutarı
              </span>
              <h3 className="text-2xl font-black mt-1">
                ₺{totalInvoiced.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-blue-100 mt-4">
              <TrendingUp className="w-4 h-4" />
              <span>{files.filter((f) => f.fileType === 'fatura').length} Fatura Kayıtlı</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Ödenen Tutar
              </span>
              <h3 className="text-2xl font-black mt-1 text-emerald-600 dark:text-emerald-400">
                ₺{paidInvoiced.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>
                {files.filter((f) => f.fileType === 'fatura' && f.paymentStatus === 'odendi').length}{' '}
                Fatura ödendi
              </span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                Ödeme Bekleyen
              </span>
              <h3 className="text-2xl font-black mt-1 text-amber-600 dark:text-amber-500">
                {
                  files.filter((f) => f.fileType === 'fatura' && f.paymentStatus === 'bekliyor')
                    .length
                }{' '}
                Fatura
              </h3>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1">
              <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
              <span>Havale / Muhasebe beklemede</span>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
            <div>
              <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
                İrsaliye ve Belgeler
              </span>
              <h3 className="text-2xl font-black mt-1 text-slate-800 dark:text-white">
                {files.filter((f) => f.fileType === 'irsaliye').length} Adet
              </h3>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span>Fiziksel teslimat belgeleri</span>
            </div>
          </div>
        </div>

        {/* UPLOADER */}
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center flex flex-col items-center justify-center transition-all ${
            dragActive
              ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-955/10'
              : 'border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-4">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Belge .temin ZIP arşivine yükleniyor ve şifreleniyor...
              </p>
            </div>
          ) : (
            <>
              <Upload className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-3" />
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                Fatura veya İrsaliye PDF / Görselini buraya sürükleyin
              </p>
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                Yüklenen dosyalar doğrudan <span className="font-mono text-blue-600 font-bold">.temin</span> arşiv paketi içindeki <span className="font-mono font-bold">attachments/</span> klasöründe güvenle saklanır.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,image/*"
                className="hidden"
                onChange={async (e) => {
                  if (e.target.files && e.target.files[0]) {
                    await handleUploadFile(e.target.files[0])
                    e.target.value = ''
                  }
                }}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Belge Seç ve Yükle
              </button>
            </>
          )}
        </div>

        {/* FILTER & SEARCH */}
        <div className="flex flex-col sm:flex-row items-center gap-4 justify-between">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'all'
                  ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Tümü ({files.length})
            </button>
            <button
              onClick={() => setFilterType('fatura')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'fatura'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              Faturalar ({files.filter((f) => f.fileType === 'fatura').length})
            </button>
            <button
              onClick={() => setFilterType('irsaliye')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                filterType === 'irsaliye'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'
              }`}
            >
              İrsaliyeler ({files.filter((f) => f.fileType === 'irsaliye').length})
            </button>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Dosya adı, yevmiye veya açıklama ile ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* TABLE */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800">
                  <th className="p-4">Tip</th>
                  <th className="p-4">Dosya Adı &amp; Açıklama</th>
                  <th className="p-4">Tutar</th>
                  <th className="p-4">Yevmiye No</th>
                  <th className="p-4">Tarih</th>
                  <th className="p-4">Ödeme Durumu</th>
                  <th className="p-4 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-slate-400">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        <span>Arşivdeki belgeler yükleniyor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredFiles.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-slate-400 dark:text-slate-600">
                      {files.length === 0
                        ? 'Bu dosyaya ait henüz bir fatura veya irsaliye yüklenmemiş.'
                        : 'Aramanızla eşleşen belge bulunamadı.'}
                    </td>
                  </tr>
                ) : (
                  filteredFiles.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="p-4">
                        {file.fileType === 'fatura' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                            Fatura
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
                            İrsaliye
                          </span>
                        )}
                      </td>
                      <td className="p-4 max-w-xs">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenPreview(file)}
                            className="font-bold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 truncate text-left cursor-pointer transition-colors"
                            title="Önizlemek için tıklayın"
                          >
                            {file.fileName}
                          </button>
                          <button
                            onClick={() => handleOpenPreview(file)}
                            className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors cursor-pointer"
                            title="Önizle"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {file.aciklama && (
                          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                            {file.aciklama}
                          </div>
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {file.fileType === 'fatura'
                          ? `₺${file.amount.toLocaleString('tr-TR', {
                              minimumFractionDigits: 2
                            })}`
                          : '-'}
                      </td>
                      <td className="p-4 font-mono text-slate-600 dark:text-slate-400">
                        {file.yevmiyeNo || '-'}
                      </td>
                      <td className="p-4 text-slate-500">{file.date}</td>
                      <td className="p-4">
                        <button
                          onClick={() => togglePaymentStatus(file)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold border transition-all hover:scale-105 active:scale-95 cursor-pointer ${
                            file.paymentStatus === 'odendi'
                              ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950/20 dark:text-green-400 dark:border-green-800'
                              : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-955/10 dark:text-amber-400 dark:border-amber-900/20'
                          }`}
                          title="Ödeme durumunu değiştirmek için tıklayın"
                        >
                          {file.paymentStatus === 'odendi' ? (
                            <>
                              <CheckCircle className="w-3 h-3 text-green-600 dark:text-green-400" />
                              Ödendi
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                              Bekliyor
                            </>
                          )}
                        </button>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenPreview(file)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
                            title="Belgeyi Önizle"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenExternal(file.filePath)}
                            className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Sistem Varsayılan Uygulamasında Aç"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setEditingFile(file)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                            title="Detayları Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(file)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                            title="Belgeyi Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PREVIEW MODAL */}
        {preview.isOpen && preview.file && (
          <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl max-h-[92vh] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">
                      {preview.file.fileName}
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {preview.file.fileType === 'fatura' ? 'Fatura Aslı' : 'Teslimat İrsaliyesi'} • {preview.file.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenExternal(preview.file!.filePath)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    title="Acrobat veya sistem görüntüleyicisinde aç"
                  >
                    <ExternalLink className="w-3.5 h-3.5" /> Harici Uygulamada Aç
                  </button>
                  <button
                    onClick={() => setPreview({ isOpen: false, file: null, loading: false })}
                    className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-4 flex-1 overflow-auto flex items-center justify-center bg-slate-100/50 dark:bg-slate-950/50 min-h-[450px]">
                {preview.loading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                      .temin ZIP paketinden belge çözümleniyor...
                    </span>
                  </div>
                ) : preview.error ? (
                  <div className="flex flex-col items-center gap-2 text-center p-6 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-900/30">
                    <AlertCircle className="w-8 h-8 text-red-500" />
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">{preview.error}</p>
                    <button
                      onClick={() => handleOpenExternal(preview.file!.filePath)}
                      className="mt-2 text-xs font-bold text-blue-600 underline cursor-pointer"
                    >
                      Harici görüntüleyici ile açmayı dene
                    </button>
                  </div>
                ) : preview.dataUrl ? (
                  preview.file.mimeType?.startsWith('image/') ||
                  preview.file.fileName.toLowerCase().endsWith('.png') ||
                  preview.file.fileName.toLowerCase().endsWith('.jpg') ||
                  preview.file.fileName.toLowerCase().endsWith('.jpeg') ? (
                    <img
                      src={preview.dataUrl}
                      alt={preview.file.fileName}
                      className="max-w-full max-h-[70vh] object-contain rounded-xl shadow-md border border-slate-200 dark:border-slate-800"
                    />
                  ) : (
                    <iframe
                      src={preview.dataUrl}
                      title={preview.file.fileName}
                      className="w-full h-[70vh] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm bg-white"
                    />
                  )
                ) : null}
              </div>
            </div>
          </div>
        )}

        {/* EDIT MODAL */}
        {editingFile && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Belge Detaylarını Düzenle
                </h3>
                <button
                  onClick={() => setEditingFile(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                  title="Kapat"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveChanges} className="p-5 flex flex-col gap-4 text-xs">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Dosya Adı
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingFile.fileName}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 text-slate-500 rounded-lg cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {editingFile.fileType === 'fatura' && (
                    <div>
                      <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                        Tutar (₺)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editingFile.amount}
                        onChange={(e) =>
                          setEditingFile({ ...editingFile, amount: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Yevmiye No
                    </label>
                    <input
                      type="text"
                      placeholder="Örn: Y-2026-0811"
                      value={editingFile.yevmiyeNo}
                      onChange={(e) => setEditingFile({ ...editingFile, yevmiyeNo: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Tarih
                    </label>
                    <input
                      type="date"
                      value={editingFile.date}
                      onChange={(e) => setEditingFile({ ...editingFile, date: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                      Ödeme Durumu
                    </label>
                    <select
                      value={editingFile.paymentStatus}
                      onChange={(e) =>
                        setEditingFile({
                          ...editingFile,
                          paymentStatus: e.target.value as 'odendi' | 'bekliyor'
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="bekliyor">Ödeme Bekliyor</option>
                      <option value="odendi">Ödendi</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Açıklama / Not
                  </label>
                  <textarea
                    rows={3}
                    placeholder="İlgili ödemeye dair detaylar veya notlar..."
                    value={editingFile.aciklama}
                    onChange={(e) => setEditingFile({ ...editingFile, aciklama: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 mt-2">
                  <button
                    type="button"
                    onClick={() => setEditingFile(null)}
                    className="px-4 py-2 text-slate-600 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 rounded-lg font-semibold transition-colors cursor-pointer"
                  >
                    Vazgeç
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-sm transition-colors cursor-pointer"
                  >
                    Değişiklikleri Kaydet
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </SubScreen>
  )
}
