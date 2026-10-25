import React from 'react'
import { FileImage, Globe, Image as ImageIcon, Trash2, Upload } from 'lucide-react'
import { cn } from '../../../utils/cn'
import type { Kalem } from '../malzemeler.hooks'

interface GorselUploadCardProps {
  formData: Partial<Kalem>
  setFormData: React.Dispatch<React.SetStateAction<Partial<Kalem>>>
  imageInputMode: 'upload' | 'url'
  setImageInputMode: (mode: 'upload' | 'url') => void
  customImageUrl: string
  setCustomImageUrl: (url: string) => void
  fileInputRef: React.RefObject<HTMLInputElement | null>
  handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleApplyImageUrl: () => void
  handleImageDrop: (e: React.DragEvent) => void
}

export const GorselUploadCard: React.FC<GorselUploadCardProps> = ({
  formData,
  setFormData,
  imageInputMode,
  setImageInputMode,
  customImageUrl,
  setCustomImageUrl,
  fileInputRef,
  handleImageUpload,
  handleApplyImageUrl,
  handleImageDrop
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <ImageIcon className="text-blue-600 dark:text-blue-400" size={18} />
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              Kalem Görseli / Fotoğraf
            </h3>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-[11px] font-semibold border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setImageInputMode('upload')}
              className={cn(
                'px-2 py-1 rounded-md transition-all flex items-center gap-1',
                imageInputMode === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              <Upload size={12} /> Dosya (Base64)
            </button>
            <button
              type="button"
              onClick={() => setImageInputMode('url')}
              className={cn(
                'px-2 py-1 rounded-md transition-all flex items-center gap-1',
                imageInputMode === 'url'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              )}
            >
              <Globe size={12} /> Web URL
            </button>
          </div>
        </div>

        <input
          type="file"
          ref={fileInputRef as any}
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />

        {formData.gorsel_url ? (
          <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 p-2 flex flex-col items-center">
            <img
              src={formData.gorsel_url}
              alt="Kalem Görseli"
              className="w-full h-44 object-contain rounded-lg"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src =
                  'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24"><text y="18" font-size="16">⚠️ Görsel Yüklenemedi</text></svg>'
              }}
            />
            {/* Badge */}
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-900/80 text-white backdrop-blur-xs shadow-xs border border-white/20">
                {formData.gorsel_url.startsWith('data:') ? (
                  <>
                    <FileImage size={10} /> Base64 Yerel
                  </>
                ) : (
                  <>
                    <Globe size={10} /> Harici URL
                  </>
                )}
              </span>
            </div>

            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 bg-white text-slate-800 rounded-lg hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <Upload size={14} /> Dosya Değiştir
              </button>
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, gorsel_url: null }))}
                className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-xs font-semibold flex items-center gap-1 shadow-xs"
              >
                <Trash2 size={14} /> Kaldır
              </button>
            </div>
          </div>
        ) : imageInputMode === 'upload' ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleImageDrop}
            className="h-44 border-2 border-dashed border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-600 rounded-xl flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-colors bg-slate-50/50 dark:bg-slate-800/20 group"
          >
            <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
              <Upload size={20} />
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Görsel Seçin veya Sürükleyin
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              PNG, JPG, WEBP (Base64 olarak veritabanında saklanır)
            </span>
          </div>
        ) : (
          <div className="h-44 border border-slate-200 dark:border-slate-700 rounded-xl flex flex-col justify-center p-4 bg-slate-50/50 dark:bg-slate-800/20 space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Görsel Web URL Adresi
              </label>
              <div className="flex gap-1.5">
                <input
                  type="url"
                  value={customImageUrl}
                  onChange={(e) => setCustomImageUrl(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyImageUrl()}
                  placeholder="https://example.com/resim.jpg"
                  className="flex-1 px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
                <button
                  type="button"
                  onClick={handleApplyImageUrl}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold transition-all shrink-0"
                >
                  Bağla
                </button>
              </div>
            </div>
            <p className="text-[10px] text-slate-400">
              Doğrudan web sitesinden veya kurumsal bulut deposundan görsel bağlantısı
              kullanabilirsiniz.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 leading-relaxed">
        💡 Kalem görseli hem yerel Base64 veri hem de harici Web URL formatında saklanabilir.
        Yaklaşık maliyet ve teklif fişlerinde otomatik kullanılır.
      </div>
    </div>
  )
}
