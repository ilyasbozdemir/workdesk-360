import React, { useState, useRef } from 'react'
import { Sliders, UploadCloud, Loader2, RefreshCw, Download } from 'lucide-react'
import { SourceImg, ConvertedImgData, formatBytes } from './types'

export function ImageCompressorSection(): React.JSX.Element {
  const [sourceImg, setSourceImg] = useState<SourceImg | null>(null)
  const [targetFormat, setTargetFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>(
    'image/jpeg'
  )
  const [imgQuality, setImgQuality] = useState(85)
  const [resizePercent, setResizePercent] = useState(100)
  const [convertedImgData, setConvertedImgData] = useState<ConvertedImgData | null>(null)
  const [isProcessingImg, setIsProcessingImg] = useState(false)

  const singleImgInputRef = useRef<HTMLInputElement>(null)

  const handleSingleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      const img = new Image()
      img.onload = () => {
        setSourceImg({
          name: file.name,
          size: file.size,
          dataUrl,
          width: img.width,
          height: img.height,
          type: file.type
        })
        setConvertedImgData(null)
      }
      img.src = dataUrl
    }
    reader.readAsDataURL(file)
  }

  const handleProcessImage = () => {
    if (!sourceImg) return
    setIsProcessingImg(true)

    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const scale = resizePercent / 100
      const newWidth = Math.round(img.width * scale)
      const newHeight = Math.round(img.height * scale)

      canvas.width = newWidth
      canvas.height = newHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        setIsProcessingImg(false)
        return
      }

      // Fill white background for JPEG if transparency
      if (targetFormat === 'image/jpeg') {
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, newWidth, newHeight)
      }

      ctx.drawImage(img, 0, 0, newWidth, newHeight)

      const qualityRatio = imgQuality / 100
      const outputDataUrl = canvas.toDataURL(targetFormat, qualityRatio)

      // Estimate byte size from dataUrl
      const base64Str = outputDataUrl.split(',')[1] || ''
      const approxBytes = Math.round((base64Str.length * 3) / 4)

      setConvertedImgData({
        dataUrl: outputDataUrl,
        size: approxBytes,
        width: newWidth,
        height: newHeight
      })
      setIsProcessingImg(false)
    }
    img.src = sourceImg.dataUrl
  }

  const handleSaveConvertedImage = async () => {
    if (!convertedImgData || !sourceImg || !window.electron?.ipcRenderer) return
    const ext =
      targetFormat === 'image/jpeg' ? 'jpg' : targetFormat === 'image/png' ? 'png' : 'webp'
    const cleanBaseName = sourceImg.name.substring(0, sourceImg.name.lastIndexOf('.')) || 'gorsel'
    const defaultName = `${cleanBaseName}_donusturuldu.${ext}`

    await window.electron.ipcRenderer.invoke('belge:save-base64-file', {
      dataBase64: convertedImgData.dataUrl,
      defaultFilename: defaultName,
      filterName: `${ext.toUpperCase()} Görseli`,
      extensions: [ext]
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
      {/* Sol Kolon: Giriş & Ayarlar */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-800 dark:text-white">
              Görsel Dönüştürücü & Sıkıştırıcı
            </h2>
          </div>

          <input
            type="file"
            ref={singleImgInputRef}
            accept="image/*"
            onChange={handleSingleImageSelect}
            className="hidden"
          />

          <div
            onClick={() => singleImgInputRef.current?.click()}
            className="border-2 border-dashed border-indigo-300 dark:border-indigo-900/60 hover:border-indigo-500 rounded-2xl p-6 text-center bg-indigo-50/30 dark:bg-indigo-950/20 cursor-pointer transition-all hover:scale-[1.01]"
          >
            <UploadCloud className="w-8 h-8 text-indigo-500 mx-auto mb-2" />
            <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
              {sourceImg ? sourceImg.name : 'Dönüştürülecek Görseli Seçin'}
            </p>
            <p className="text-[11px] text-slate-500 mt-1">
              {sourceImg
                ? `${sourceImg.width}x${sourceImg.height} px • ${formatBytes(sourceImg.size)}`
                : 'PNG, JPG, WEBP veya BMP formatları'}
            </p>
          </div>

          {sourceImg && (
            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              {/* Format Seçimi */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Hedef Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setTargetFormat('image/jpeg')}
                    className={`py-1.5 rounded-xl font-bold cursor-pointer ${
                      targetFormat === 'image/jpeg'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    JPG / JPEG
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFormat('image/png')}
                    className={`py-1.5 rounded-xl font-bold cursor-pointer ${
                      targetFormat === 'image/png'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    PNG
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetFormat('image/webp')}
                    className={`py-1.5 rounded-xl font-bold cursor-pointer ${
                      targetFormat === 'image/webp'
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    WEBP (Hafif)
                  </button>
                </div>
              </div>

              {/* Kalite Ayarı */}
              {targetFormat !== 'image/png' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[11px] font-medium text-slate-500">
                      Sıkıştırma Kalitesi: <strong>%{imgQuality}</strong>
                    </label>
                    <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold">
                      {imgQuality < 60
                        ? 'Yüksek Sıkıştırma (En Küçük Dosya)'
                        : imgQuality < 85
                          ? 'Dengeli (EKAP İdeal)'
                          : 'Maksimum Kalite'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="100"
                    value={imgQuality}
                    onChange={(e) => setImgQuality(parseInt(e.target.value, 10))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                </div>
              )}

              {/* Ölçekleme / Boyutlandırma */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-[11px] font-medium text-slate-500">
                    Çözünürlük Ölçeği: <strong>%{resizePercent}</strong> (
                    {Math.round((sourceImg.width * resizePercent) / 100)}x
                    {Math.round((sourceImg.height * resizePercent) / 100)} px)
                  </label>
                </div>
                <input
                  type="range"
                  min="25"
                  max="100"
                  step="5"
                  value={resizePercent}
                  onChange={(e) => setResizePercent(parseInt(e.target.value, 10))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
              </div>

              <button
                type="button"
                disabled={isProcessingImg}
                onClick={handleProcessImage}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                {isProcessingImg ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
                <span>Dönüştür ve Boyutu Hesapla</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Sağ Kolon: Karşılaştırma & İndirme */}
      <div className="lg:col-span-6 space-y-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-sm space-y-4 min-h-[400px] flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Dönüştürülen Çıktı & Boyut Kazancı
            </h3>
            {convertedImgData && (
              <button
                type="button"
                onClick={handleSaveConvertedImage}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Görseli Kaydet</span>
              </button>
            )}
          </div>

          {convertedImgData && sourceImg ? (
            <div className="space-y-4 flex-1 flex flex-col">
              {/* Karşılaştırma İstatistikleri */}
              <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Orijinal Dosya</span>
                  <strong className="text-slate-700 dark:text-slate-300">
                    {formatBytes(sourceImg.size)}
                  </strong>
                  <div className="text-[10px] text-slate-500">
                    {sourceImg.width}x{sourceImg.height} px
                  </div>
                </div>

                <div>
                  <span className="text-emerald-500 block text-[10px]">Yeni Sıkıştırılmış</span>
                  <strong className="text-emerald-600 dark:text-emerald-400">
                    {formatBytes(convertedImgData.size)}
                  </strong>
                  <div className="text-[10px] text-slate-500">
                    {convertedImgData.width}x{convertedImgData.height} px (
                    {Math.round((1 - convertedImgData.size / sourceImg.size) * 100)}% Kazanç)
                  </div>
                </div>
              </div>

              {/* Görsel Önizleme */}
              <div className="flex-1 bg-slate-100 dark:bg-slate-950 rounded-2xl p-3 flex items-center justify-center overflow-hidden max-h-[300px]">
                <img
                  src={convertedImgData.dataUrl}
                  alt="Dönüştürülmüş"
                  className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
                />
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 dark:text-slate-500 space-y-2">
              <Sliders className="w-10 h-10 opacity-30" />
              <p className="text-xs font-semibold">Görsel dönüştürme bekleniyor</p>
              <p className="text-[11px] max-w-xs">
                Sol kısımdan bir görsel yükleyip hedef formatı ve sıkıştırmayı seçin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
