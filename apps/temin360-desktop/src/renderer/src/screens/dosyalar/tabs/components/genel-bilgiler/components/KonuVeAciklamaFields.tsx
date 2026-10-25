import React from 'react'
import { Copy, FileText, Loader2, Sparkles } from 'lucide-react'
import { YeniDosyaTabProps } from '../../../../types'

export const KonuVeAciklamaFields: React.FC<YeniDosyaTabProps> = (props) => {
  const {
    formData,
    setFormData,
    isDescLoading,
    showKonuSuggestions,
    setShowKonuSuggestions,
    exactMatchCount,
    matchedSuggestions,
    handleAiDescGenerate,
    handleCopyKonuToAciklama,
    openTextGenerator
  } = props

  return (
    <>
      <div className="md:col-span-2 relative">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-450">
            İhale / Dosya Konusu (İşin Adı) *
          </label>
          <button
            type="button"
            onClick={() =>
              openTextGenerator?.(
                'konu',
                'Konuyu AI ile Üret',
                'İhale Konusu',
                'Verilen metin veya alım işlemine göre en uygun, resmi ve kısa ihale konusunu (İşin Adı) üret. Başka hiçbir açıklama yazma. KESİNLİKLE metnin içerisine veya sonuna "Doğrudan Temin", "Doğrudan Temini" veya "Doğrudan Temin İşi" gibi ifadeler EKLEME. (Örn: "Bez Bayrak ve Sopalı Bayrak Alımı", "Kırtasiye Malzemesi Alımı" şeklinde bitir).'
              )
            }
            className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded border-none"
          >
            <Sparkles size={11} /> AI ile Üret
          </button>
        </div>
        <input
          type="text"
          required
          value={formData.konu || ''}
          onChange={(e) => {
            setFormData({ ...formData, konu: e.target.value })
            setShowKonuSuggestions?.(true)
          }}
          onFocus={() => setShowKonuSuggestions?.(true)}
          onBlur={() => {
            setTimeout(() => setShowKonuSuggestions?.(false), 200)
          }}
          placeholder="Alımın konusunu resmi dilde açıklayıcı şekilde girin (Örn: Fen İşleri Kırtasiye Malzemesi Alımı)"
          className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-850 dark:text-slate-200 font-semibold"
        />
        {(exactMatchCount ?? 0) > 0 && (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-bold mt-1.5 flex items-center gap-1 animate-in fade-in duration-200">
            ⚠️ Bu isimde daha önce {exactMatchCount} adet dosya açılmış. Kaydedildiğinde otomatik
            olarak &quot;({(exactMatchCount ?? 0) + 1})&quot; son eki eklenecektir.
          </p>
        )}
        {showKonuSuggestions && (matchedSuggestions ?? []).length > 0 && (
          <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3.5 py-1.5 bg-slate-50 dark:bg-slate-955/50 text-[10px] font-bold text-slate-400 border-b border-slate-100 dark:border-slate-800">
              {formData.konu ? 'Önceki İhale Konuları' : 'Sık Kullanılan İhale Konuları'}
            </div>
            <ul className="max-h-48 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800/50">
              {(matchedSuggestions ?? []).map((suggestion, index) => (
                <li key={index}>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        konu: suggestion
                      }))
                      setShowKonuSuggestions?.(false)
                    }}
                    className="w-full text-left px-3.5 py-2 hover:bg-blue-50 dark:hover:bg-blue-900/10 text-xs text-slate-700 dark:text-slate-300 font-semibold transition-colors flex items-center gap-2 cursor-pointer border-none bg-transparent"
                  >
                    <FileText className="text-slate-400 w-3.5 h-3.5" />
                    <span>{suggestion}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-bold text-slate-600 dark:text-slate-455">
            İşin Açıklaması / Kapsamı{' '}
            <span className="text-[10px] font-normal text-slate-400 dark:text-slate-500">
              (Markdown Desteklenir)
            </span>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAiDescGenerate}
              disabled={isDescLoading}
              title="İşin adına göre yapay zeka ile profesyonel açıklama metni oluştur"
              className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded disabled:opacity-50"
            >
              {isDescLoading ? (
                <Loader2 size={11} className="animate-spin" />
              ) : (
                <Sparkles size={11} />
              )}
              {isDescLoading ? 'Üretiliyor...' : 'AI ile Üret'}
            </button>
            <button
              type="button"
              onClick={handleCopyKonuToAciklama}
              className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer bg-blue-50 dark:bg-blue-900/10 px-2 py-1 rounded"
            >
              <Copy size={11} />
              İşin Adını Kopyala
            </button>
          </div>
        </div>
        <textarea
          rows={3}
          value={formData.isin_aciklamasi || ''}
          onChange={(e) =>
            setFormData({
              ...formData,
              isin_aciklamasi: e.target.value
            })
          }
          placeholder="İşin detaylı açıklaması veya şartnamedeki kapsam açıklaması..."
          className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-955 border border-slate-200 dark:border-slate-800 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-slate-800 dark:text-white leading-normal resize-none"
        />
      </div>
    </>
  )
}
