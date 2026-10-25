import React, { useState, useRef } from 'react'
import {
  Image as ImageIcon,
  UploadCloud,
  MoveUp,
  MoveDown,
  Trash2,
  Loader2,
  FileCheck2,
  CheckCircle2
} from 'lucide-react'
import { ImageItem, StatusMessage, formatBytes } from './types'

export function ImagesToPdfSection(): React.JSX.Element {
  const [imagesList, setImagesList] = useState<ImageItem[]>([])
  const [imagesFit, setImagesFit] = useState<'contain' | 'cover' | 'fill'>('contain')
  const [imagesMargin, setImagesMargin] = useState<'0mm' | '10mm' | '15mm'>('0mm')
  const [pdfTitle, setPdfTitle] = useState('Birlestirilmis_Gorseller')
  const [isGeneratingImgPdf, setIsGeneratingImgPdf] = useState(false)
  const [imgPdfStatus, setImgPdfStatus] = useState<StatusMessage | null>(null)

  const imgInputRef = useRef<HTMLInputElement>(null)

  const handleImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        const img = new Image()
        img.onload = () => {
          const isLandscape = img.width > img.height
          setImagesList((prev) => [
            ...prev,
            {
              id: Math.random().toString(36).substring(2, 9),
              name: file.name,
              size: file.size,
              dataUrl,
              width: img.width,
              height: img.height,
              orientation: isLandscape ? 'landscape' : 'portrait'
            }
          ])
        }
        img.src = dataUrl
      }
      reader.readAsDataURL(file)
    })
  }

  const moveImage = (index: number, direction: 'up' | 'down') => {
    setImagesList((prev) => {
      const newList = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= newList.length) return prev
      const temp = newList[index]
      newList[index] = newList[targetIndex]
      newList[targetIndex] = temp
      return newList
    })
  }

  const removeImage = (id: string) => {
    setImagesList((prev) => prev.filter((item) => item.id !== id))
  }

  const toggleImageOrientation = (id: string) => {
    setImagesList((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, orientation: item.orientation === 'portrait' ? 'landscape' : 'portrait' }
          : item
      )
    )
  }

  const handleGenerateImagesPdf = async () => {
    if (imagesList.length === 0 || !window.electron?.ipcRenderer) return
    setIsGeneratingImgPdf(true)
    setImgPdfStatus(null)

    try {
      const res = await window.electron.ipcRenderer.invoke('belge:convert-images-to-pdf', {
        images: imagesList.map((img) => ({
          name: img.name,
          dataUrl: img.dataUrl,
          orientation: img.orientation
        })),
        fit: imagesFit,
        margins: imagesMargin,
        title: pdfTitle,
        saveImmediately: true
      })

      if (res?.success) {
        setImgPdfStatus({
          type: 'success',
          text: `🎉 ${imagesList.length} görselden oluşan A4 PDF başarıyla oluşturuldu ve kaydedildi: ${
            res.filePath || ''
          }`
        })
      } else if (res?.error && res.error !== 'Kaydetme iptal edildi') {
        setImgPdfStatus({ type: 'error', text: res.error })
      }
    } catch (err: unknown) {
      setImgPdfStatus({
        type: 'error',
        text: err instanceof Error ? err.message : 'PDF oluşturma hatası'
      })
    } finally {
      setIsGeneratingImgPdf(false)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-emerald-600" />
            Görsellerden Çok Sayfalı A4 PDF Oluşturma
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Taranmış evrakları, fatura veya tutanak fotoğraflarını sıralayarak tek bir resmî PDF
            dosyası haline getirin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="file"
            ref={imgInputRef}
            multiple
            accept="image/png,image/jpeg,image/webp,image/jpg"
            onChange={handleImagesSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imgInputRef.current?.click()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Görsel(ler) Ekle</span>
          </button>

          {imagesList.length > 0 && (
            <button
              type="button"
              onClick={() => setImagesList([])}
              className="px-3 py-2 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 text-red-600 rounded-xl text-xs font-semibold cursor-pointer"
            >
              Listeyi Temizle
            </button>
          )}
        </div>
      </div>

      {/* PDF Sayfa Ayarları */}
      <div className="p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            PDF Doküman Adı
          </label>
          <input
            type="text"
            value={pdfTitle}
            onChange={(e) => setPdfTitle(e.target.value)}
            placeholder="Evraklar_Birlestirilmis"
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium"
          />
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Görsel Sayfa Yerleşimi
          </label>
          <select
            value={imagesFit}
            onChange={(e) => setImagesFit(e.target.value as 'contain' | 'cover' | 'fill')}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium"
          >
            <option value="contain">Sayfaya Sığdır (Oranları Koru - Önerilen)</option>
            <option value="cover">Sayfayı Tam Kapla (Doldur)</option>
            <option value="fill">Uzat & Yay</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">
            Sayfa Kenar Boşluğu
          </label>
          <select
            value={imagesMargin}
            onChange={(e) => setImagesMargin(e.target.value as '0mm' | '10mm' | '15mm')}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 text-xs font-medium"
          >
            <option value="0mm">0 mm (Kenarlıksız Tam Sayfa)</option>
            <option value="10mm">10 mm (İnce Kenarlık)</option>
            <option value="15mm">15 mm (Standart Kenarlık)</option>
          </select>
        </div>
      </div>

      {/* Görsel Listesi */}
      {imagesList.length === 0 ? (
        <div
          onClick={() => imgInputRef.current?.click()}
          className="border-2 border-dashed border-emerald-300 dark:border-emerald-900/60 hover:border-emerald-500 rounded-3xl p-12 text-center bg-emerald-50/20 dark:bg-emerald-950/10 cursor-pointer transition-all"
        >
          <ImageIcon className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
            PDF Yapmak İstediğiniz Görselleri Yükleyin
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
            Birden fazla PNG, JPG veya WEBP görseli seçebilir, sırasını değiştirebilir ve her sayfa
            için Dikey/Yatay yönü özelleştirebilirsiniz.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-400 px-1">
            <span>Eklenen Görseller ({imagesList.length} Sayfa)</span>
            <span>Sıralama ve Sayfa Yönü</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {imagesList.map((img, idx) => (
              <div
                key={img.id}
                className="relative group bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-3 flex flex-col gap-2 shadow-xs"
              >
                <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-slate-900/80 text-white font-bold text-[10px] backdrop-blur-xs">
                  Sayfa #{idx + 1}
                </div>

                <div className="w-full h-36 bg-slate-200/50 dark:bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>

                <div
                  className="text-[11px] truncate font-semibold text-slate-700 dark:text-slate-300"
                  title={img.name}
                >
                  {img.name}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>{formatBytes(img.size)}</span>
                  <span>
                    {img.width}x{img.height} px
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => toggleImageOrientation(img.id)}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer transition-colors ${
                      img.orientation === 'landscape'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300'
                    }`}
                    title="Sayfa Yönünü Değiştir"
                  >
                    {img.orientation === 'landscape' ? 'Yatay A4' : 'Dikey A4'}
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveImage(idx, 'up')}
                      className="p-1 rounded bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Öne Taşı"
                    >
                      <MoveUp size={12} />
                    </button>
                    <button
                      type="button"
                      disabled={idx === imagesList.length - 1}
                      onClick={() => moveImage(idx, 'down')}
                      className="p-1 rounded bg-slate-200/60 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-300 disabled:opacity-30 cursor-pointer"
                      title="Arkaya Taşı"
                    >
                      <MoveDown size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeImage(img.id)}
                      className="p-1 rounded bg-red-100 dark:bg-red-950/40 hover:bg-red-200 text-red-600 cursor-pointer ml-1"
                      title="Sil"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* PDF Üretim Butonu */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Toplam <strong>{imagesList.length}</strong> sayfalık A4 dokümanı hazırlanacak.
            </div>

            <button
              type="button"
              disabled={isGeneratingImgPdf}
              onClick={handleGenerateImagesPdf}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer flex items-center gap-2 disabled:opacity-50"
            >
              {isGeneratingImgPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>PDF Üretiliyor...</span>
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4" />
                  <span>Birleştirilmiş PDF Olarak Kaydet</span>
                </>
              )}
            </button>
          </div>

          {imgPdfStatus && (
            <div
              className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                imgPdfStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-red-50 dark:bg-red-950/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
              <span>{imgPdfStatus.text}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
