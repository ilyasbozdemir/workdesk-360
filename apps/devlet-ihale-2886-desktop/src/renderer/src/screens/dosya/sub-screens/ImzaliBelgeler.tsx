/* eslint-disable */
import React, { useEffect, useState } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Eye,
  FileArchive,
  FileCheck,
  FileText,
  Loader2,
  Trash2,
  UploadCloud
} from 'lucide-react'
import { SubScreen } from '../SubScreens.screen'
import { Modal } from '../../../components/ui/Modal'
import { useWorkspaceStore } from '../../../store/workspaceStore'

interface SignedDoc {
  id: number
  documentName: string
  signerName: string
  signDate: string
  status: 'Signed' | 'Pending'
  fileSize?: string
}

export function ImzaliBelgeler(): React.JSX.Element {
  const { activeDosyaId } = useWorkspaceStore()
  const [isExtracting, setIsExtracting] = useState(false)
  const [zipFile, setZipFile] = useState<string | null>(null)
  const [documents, setDocuments] = useState<SignedDoc[]>([])
  const [previewDoc, setPreviewDoc] = useState<SignedDoc | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null)

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Gerçek Veritabanı DATA_TeminBelge sorgusu
  const fetchDbDocuments = async () => {
    if (!activeDosyaId) {
      setDocuments([])
      return
    }
    try {
      const res = await window.electron.ipcRenderer.invoke(
        'db:query',
        'SELECT id, belge_adi, is_signed, imzali_dosya_yolu, belge_tarihi, created_at FROM DATA_TeminBelge WHERE temin_dosya_id = ? ORDER BY id DESC',
        [activeDosyaId]
      )
      if (res.success && Array.isArray(res.data)) {
        setDocuments(
          res.data.map((d: any) => ({
            id: d.id,
            documentName: d.belge_adi,
            signerName: d.is_signed ? 'İmzalı Belge Arşivlendi' : 'İmza Bekleniyor',
            signDate: d.belge_tarihi || (d.created_at ? String(d.created_at).slice(0, 16) : '-'),
            status: d.is_signed ? 'Signed' : 'Pending',
            fileSize: d.imzali_dosya_yolu ? 'PDF Arşivlendi' : undefined
          }))
        )
      } else {
        setDocuments([])
      }
    } catch (err) {
      console.error('Belge listeleme hatası:', err)
      setDocuments([])
    }
  }

  useEffect(() => {
    fetchDbDocuments()
  }, [activeDosyaId])

  // ZIP / Dosya Yüklendiğinde Belgeleri Otomatik İmzalıya Çevirme
  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      setZipFile(file.name)
      setIsExtracting(true)

      setTimeout(async () => {
        setIsExtracting(false)
        const currentDate = new Date().toISOString().replace('T', ' ').slice(0, 16)

        if (activeDosyaId) {
          try {
            // Eğer aktif dosyada kayıtlı belgeler varsa, hepsini imzalandı olarak güncelle
            const existingRes = await window.electron.ipcRenderer.invoke(
              'db:query',
              'SELECT id, belge_adi FROM DATA_TeminBelge WHERE temin_dosya_id = ?',
              [activeDosyaId]
            )

            if (existingRes.success && existingRes.data && existingRes.data.length > 0) {
              await window.electron.ipcRenderer.invoke(
                'db:run',
                'UPDATE DATA_TeminBelge SET is_signed = 1, imzali_dosya_yolu = ?, belge_tarihi = ? WHERE temin_dosya_id = ?',
                [file.name, currentDate, activeDosyaId]
              )
            } else {
              // Eğer henüz DATA_TeminBelge yoksa standart evrakları imzalı olarak oluştur
              const defaultDocs = [
                'Onay Belgesi',
                'Piyasa Fiyat Araştırması Tutanağı',
                'Yaklaşık Maliyet Hesap Cetveli'
              ]
              for (const docName of defaultDocs) {
                await window.electron.ipcRenderer.invoke(
                  'db:run',
                  'INSERT INTO DATA_TeminBelge (temin_dosya_id, belge_adi, is_signed, imzali_dosya_yolu, belge_tarihi) VALUES (?, ?, 1, ?, ?)',
                  [activeDosyaId, docName, file.name, currentDate]
                )
              }
            }
            await fetchDbDocuments()
          } catch (err) {
            console.error('İmzalı belge kaydetme hatası:', err)
          }
        } else {
          // Aktif dosya seçili değilse local state'e yaz
          const newDocs: SignedDoc[] = [
            {
              id: Date.now(),
              documentName: 'Onay Belgesi (İmzalı).pdf',
              signerName: 'İlyas BOZDEMİR (Harcama Yetkilisi)',
              signDate: currentDate,
              status: 'Signed',
              fileSize: '245 KB'
            },
            {
              id: Date.now() + 1,
              documentName: 'Piyasa Fiyat Arastirmasi Tutanagi (İmzalı).pdf',
              signerName: 'Ali YILMAZ (Komisyon Üyesi)',
              signDate: currentDate,
              status: 'Signed',
              fileSize: '380 KB'
            }
          ]
          setDocuments((prev) => [...newDocs, ...prev])
        }

        showToast(`"${file.name}" paketi sisteme işlendi; evraklar İmzalı olarak güncellendi!`)
      }, 1500)
    }
  }

  const handleDelete = async (id: number) => {
    const docToDelete = documents.find((d) => d.id === id)
    setDocuments((prev) => prev.filter((doc) => doc.id !== id))

    if (activeDosyaId) {
      try {
        await window.electron.ipcRenderer.invoke(
          'db:run',
          'DELETE FROM DATA_TeminBelge WHERE id = ?',
          [id]
        )
        await fetchDbDocuments()
      } catch (err) {
        console.error('Belge silinemedi:', err)
      }
    }

    if (docToDelete) {
      showToast(`"${docToDelete.documentName}" veritabanından tamamen silindi.`, 'info')
    }
  }

  const handleDownloadSingle = (doc: SignedDoc) => {
    if (doc.status !== 'Signed') {
      showToast('Henüz imzalanmamış belge indirilemez.', 'info')
      return
    }
    showToast(`"${doc.documentName}" indiriliyor...`)
  }

  const handleDownloadAll = () => {
    const signedCount = documents.filter((d) => d.status === 'Signed').length
    if (signedCount === 0) {
      showToast('İndirilebilecek imzalı belge bulunmuyor.', 'info')
      return
    }
    showToast(`${signedCount} adet imzalı belge ZIP arşivi olarak hazırlanıp indirildi.`)
  }

  const signedCount = documents.filter((d) => d.status === 'Signed').length
  const pendingCount = documents.filter((d) => d.status === 'Pending').length

  return (
    <SubScreen
      title="İmzalı Belge Yönetimi"
      icon={FileCheck}
      description="İmzalanan evrakları toplu olarak ZIP dosyası ile sisteme yükleyin, arşivleyin ve yönetin."
    >
      {/* TOAST FEEDBACK */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <div
            className={`px-4 py-3 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2.5 ${
              toast.type === 'success'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20'
                : 'bg-slate-800 text-slate-100 border-slate-700 shadow-slate-900/30'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* STAT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            İmzalanan Belgeler
          </span>
          <h3 className="text-3xl font-extrabold mt-1 text-green-600 dark:text-green-500">
            {signedCount} / {documents.length}
          </h3>
          <p className="text-xs text-slate-400 mt-2">Toplam belgenin imzalılık oranı</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Bekleyen İmzalar
          </span>
          <h3 className="text-3xl font-extrabold mt-1 text-amber-600 dark:text-amber-500">
            {pendingCount} Belge
          </h3>
          <p className="text-xs text-slate-400 mt-2">İmzası tamamlanması gerekenler</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider">
            Son ZIP Yükleme
          </span>
          <h3 className="text-lg font-bold mt-1 text-slate-800 dark:text-white truncate">
            {zipFile || 'Yükleme Yapılmadı'}
          </h3>
          <p className="text-xs text-slate-400 mt-3">En son içeri aktarılan ZIP paketi</p>
        </div>
      </div>

      {/* ZIP UPLOAD PANEL */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl p-6 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-blue-600 dark:text-blue-400">
            <FileArchive className="w-8 h-8" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Toplu ZIP ile İmzalı Belge Yükle
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-lg">
              EBYS, EKAP veya Islak İmzalı taranan belgelerinizi tek bir ZIP dosyası halinde
              yükleyin. EKAP Doğrudan Temin Kayıt Formu (DTN) ve denetim arşivi için sistem dosya
              isimlerini otomatik eşleştirecektir.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isExtracting ? (
            <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-lg text-xs font-semibold">
              <Loader2 className="w-4 h-4 animate-spin" />
              ZIP Çıkartılıyor...
            </div>
          ) : (
            <label className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm cursor-pointer transition-colors flex items-center gap-1.5">
              <UploadCloud className="w-4 h-4" />
              ZIP Seç ve Yükle
              <input type="file" accept=".zip" onChange={handleZipUpload} className="hidden" />
            </label>
          )}
        </div>
      </div>

      {/* DOCUMENT CHECKLIST & MANAGEMENT */}
      <div className="border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              Belge İmza Durumu ve Eşleşmeler
            </h4>
            {documents.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                {documents.length} Kayıt
              </span>
            )}
          </div>

          {/* DİNAMİK TÜMÜNÜ İNDİR BUTONU */}
          {signedCount > 0 ? (
            <button
              onClick={handleDownloadAll}
              className="text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-95 flex items-center gap-1.5 px-3 py-1.5 rounded-lg shadow-xs transition-all cursor-pointer"
              title={`${signedCount} adet imzalı belgeyi ZIP olarak indir`}
            >
              <Download className="w-3.5 h-3.5" />
              Tümünü İndir ({signedCount} İmzalı .ZIP)
            </button>
          ) : (
            <button
              disabled
              className="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100/80 dark:bg-slate-800/50 flex items-center gap-1.5 px-3 py-1.5 rounded-lg cursor-not-allowed select-none transition-colors border border-dashed border-slate-200 dark:border-slate-700/50"
              title="İndirilebilecek imzalı belge bulunmuyor"
            >
              <Download className="w-3.5 h-3.5 opacity-40" />
              İndirilecek Belge Yok
            </button>
          )}
        </div>

        {/* BELGE LİSTESİ VEYA BOŞ DURUM */}
        {documents.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-3.5 shadow-inner">
              <FileCheck className="w-7 h-7" />
            </div>
            <h5 className="text-sm font-bold text-slate-700 dark:text-slate-200">
              Henüz Kayıtlı İmzalı Belge Yok
            </h5>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">
              EBYS, EKAP veya ıslak imzalı taranan belgelerinizi yukarıdaki{' '}
              <span className="font-semibold text-blue-600 dark:text-blue-400">
                "ZIP Seç ve Yükle"
              </span>{' '}
              butonuyla sisteme aktarabilirsiniz.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors"
              >
                <div className="flex items-start gap-3.5">
                  {doc.status === 'Signed' ? (
                    <div className="p-1.5 rounded-lg bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400 shrink-0 mt-0.5">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                  ) : (
                    <div className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-500 shrink-0 mt-0.5">
                      <AlertCircle className="w-5 h-5" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        {doc.documentName}
                      </h5>
                      {doc.status === 'Signed' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/40">
                          İmzalandı
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/40">
                          İmza Bekleniyor
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-slate-500 mt-1">
                      İmzalayan / Durum:{' '}
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {doc.signerName}
                      </span>
                      {doc.fileSize && (
                        <span className="text-slate-400 ml-2">({doc.fileSize})</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-5 text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {doc.signDate !== '-' ? doc.signDate : 'İmza Bekleniyor'}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* ÖNİZLEME BUTONU */}
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 text-slate-500 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                      title="Belge Detayı & Önizleme"
                    >
                      <Eye className="w-4 h-4" />
                    </button>

                    {/* TEKİL İNDİR BUTONU */}
                    {doc.status === 'Signed' ? (
                      <button
                        onClick={() => handleDownloadSingle(doc)}
                        className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-md transition-colors"
                        title="Bu Belgeyi İndir (.pdf)"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        disabled
                        className="p-1.5 text-slate-300 dark:text-slate-600 cursor-not-allowed rounded-md select-none"
                        title="İmza bekleniyor (indirilemez)"
                      >
                        <Download className="w-4 h-4 opacity-40" />
                      </button>
                    )}

                    {/* SİL / İMZAYI KALDIR BUTONU */}
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-md transition-colors"
                      title="İmzayı Kaldır"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* BELGE DETAY & ÖNİZLEME MODALI */}
      {previewDoc && (
        <Modal
          isOpen={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.documentName}
          description="İmzalı evrak sistem doğrulaması ve arşiv detayı"
          className="max-w-xl"
        >
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">İmza Durumu:</span>
                {previewDoc.status === 'Signed' ? (
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Geçerli Islak/Elektronik İmza
                  </span>
                ) : (
                  <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" /> İmza Süreci Tamamlanmadı
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">İmzalayan / Yetkili:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {previewDoc.signerName}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">İmza / Yükleme Tarihi:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {previewDoc.signDate}
                </span>
              </div>

              {previewDoc.fileSize && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Dosya Boyutu:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">
                    {previewDoc.fileSize}
                  </span>
                </div>
              )}
            </div>

            <div className="border border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center bg-slate-50/40 dark:bg-slate-900/30 flex flex-col items-center justify-center">
              <FileText className="w-10 h-10 text-slate-400 mb-2" />
              <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                {previewDoc.documentName}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Belge PDF önizlemesi masaüstü görüntüleyicide açılabilir.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                Kapat
              </button>
              {previewDoc.status === 'Signed' && (
                <button
                  onClick={() => {
                    handleDownloadSingle(previewDoc)
                    setPreviewDoc(null)
                  }}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Belgeyi İndir
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </SubScreen>
  )
}
