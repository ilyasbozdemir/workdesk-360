import React from 'react'
import { BookOpen, ExternalLink, Scale, Sparkles } from 'lucide-react'

export function TakipIsAkisiYonergesi(): React.JSX.Element {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 flex-wrap gap-2">
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          Doğrudan Temin İş Akışı & Mevzuat Yönergesi
        </h3>
        <span className="text-[10px] px-2 py-0.5 bg-blue-50 dark:bg-blue-955/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 rounded-full font-bold uppercase tracking-wider">
          Mevzuat No: 40666 / RG: 32245
        </span>
      </div>

      {/* Resmî Gazete Tebliğ Bağlantı Kartı */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50/80 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900/40 border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Scale size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-slate-900 dark:text-slate-100">
                Doğrudan Temin Yöntemiyle Yapılacak Alımlara İlişkin Tebliğ
              </span>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold shrink-0">
                RG: 11.07.2023 / 32245
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
              4734 sayılı Kanunun 22 nci maddesi kapsamındaki doğrudan temin süreçleri, onay belgesi, DTN alımı, teslim tesellüm ve sipariş usullerini belirleyen yürürlükteki resmî tebliğ metni.
            </p>
          </div>
        </div>

        <a
          href="https://www.lexpera.com.tr/resmi-gazete/metin/dogrudan-temin-yontemiyle-yapilacak-alimlara-iliskin-teblig-32245"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shadow-blue-500/20 shrink-0 cursor-pointer active:scale-95"
          title="Lexpera Resmî Gazete Tebliğ Metnini Yeni Sekmede Aç"
        >
          <span>Lexpera Resmî Gazete Metni</span>
          <ExternalLink size={13} />
        </a>
      </div>

      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed space-y-3">
        <p>
          Sistemimizdeki tüm şablonlar, dosyaya girdiğiniz veriler ile
          <strong className="text-slate-800 dark:text-slate-200">
            {' '}
            tamamen dinamik ve otomatik{' '}
          </strong>
          olarak doldurulur. Süreç boyunca yaptığınız her giriş anında evraklara yansır.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-2">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex gap-3">
            <span className="text-base select-none">💡</span>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Esnek & Dinamik Şablonlar
              </h4>
              <p className="text-[10.5px] text-slate-500 leading-normal">
                Şablonların yerleşimleri ve içerikleri mevzuata uygun şekilde dinamik olarak
                bağlanmıştır.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex gap-3">
            <span className="text-base select-none">🚀</span>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Süreç Nasıl Başlar? (1. Aşama)
              </h4>
              <p className="text-[10.5px] text-slate-500 leading-normal">
                İhtiyaç listesini girerek süreci başlatırsınız. Bu adıma göre Lüzum Müzekkeresi ve
                Harcama Talimatı gibi başlangıç belgeleri üretilir.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex gap-3">
            <span className="text-base select-none">📊</span>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Piyasa Fiyat Araştırması (2. Aşama)
              </h4>
              <p className="text-[10.5px] text-slate-500 leading-normal">
                Firma tekliflerini girdiğinizde, komisyonlar ve yaklaşık maliyet hesaplamaları
                otomatik olarak dolup cetvel haline getirilir.
              </p>
            </div>
          </div>

          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800/60 rounded-2xl flex gap-3">
            <span className="text-base select-none">🏁</span>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                Sözleşme & Süreç Sonu (3/4. Aşama)
              </h4>
              <p className="text-[10.5px] text-slate-500 leading-normal">
                Kazanan firmayı atar, sözleşme basar ve son aşamada Muayene Kabul Tutanağı ile
                süreci kapatıp imzaya çıkarırsınız.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
