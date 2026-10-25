import React from 'react'
import { ChevronRight, Construction, FileText, Settings, ShieldAlert, Sparkles } from 'lucide-react'

export default function HakedisScreen(): React.JSX.Element {
  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 overflow-y-auto custom-scrollbar animate-in fade-in duration-500">
      <div className="flex-none p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
            <Construction className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-850 dark:text-slate-100 flex items-center gap-2">
              Hakediş & Süreç Yönetimi
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-400 uppercase tracking-widest">
                Beta / Yakında
              </span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm font-medium">
              Yapım işleri, hizmet ve mal alımları için hakediş dosyaları, yeşil defter, icmaller ve
              raporlama modülü.
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 max-w-4xl w-full mx-auto p-6 space-y-8">
        {/* Banner */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 dark:from-blue-750 dark:to-indigo-850 rounded-2xl p-6 text-white shadow-md border border-blue-500/20">
          <div className="absolute right-0 bottom-0 opacity-10 translate-x-10 translate-y-10">
            <Construction className="w-72 h-72" />
          </div>
          <div className="relative z-10 max-w-xl space-y-3">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5" /> Modül Geliştirme Sürecinde
            </div>
            <h2 className="text-lg font-bold">
              Hakediş Süreçlerinizi Uçtan Uca Dijitalleştiriyoruz
            </h2>
            <p className="text-xs text-white/80 leading-relaxed font-normal">
              Kamu İhale Mevzuatına tam uyumlu; yeşil defter girişi, hakediş raporları, fiyat farkı
              hesaplamaları ve kapak evraklarının otomatik hazırlanacağı yeni nesil hakediş modülü
              çok yakında yayında olacaktır.
            </p>
          </div>
        </div>

        {/* Neden Gerekli Bilgilendirme Kutusu */}
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/50 rounded-2xl p-5 space-y-2.5">
          <h3 className="text-xs font-bold text-amber-850 dark:text-amber-400 flex items-center gap-2">
            💡 Neden Hakediş Modülü? (Hizmet ve Yapım İşleri İçin Önemli)
          </h3>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-normal">
            Doğrudan temin süreçlerinde <strong>Mal Alımları</strong> genellikle tek seferde teslim
            edilip kapatılırken; zamana yayılan <strong>Hizmet Alımları</strong> (temizlik, veri
            girişi, güvenlik vb.) ve <strong>Yapım / Bakım Onarım İşleri</strong> periyodik olarak
            ara ödemeler yani <strong>Hakediş</strong> gerektirir.
          </p>
          <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed font-normal">
            Bu modül, doğrudan temin limitleri dahilinde yaptığınız sürekli hizmet ve küçük ölçekli
            yapım işlerinizin metrajlarını, yeşil defter girdilerini ve ara ödeme süreçlerini yasal
            kesintileriyle birlikte hatasız yönetebilmeniz için geliştirilmektedir.
          </p>
        </div>

        {/* Feature Cards Grid */}
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-555 pl-1">
            Geliştirilen Temel Özellikler
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1 */}
            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-650 dark:text-slate-450">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Hazırlanıyor
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Yeşil Defter & Metraj Cetveli
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-normal">
                  Yapılan iş kalemlerinin metraj cetvellerini dinamik olarak girerek yeşil deftere
                  otomatik işleme.
                </p>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-slate-955 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-650 dark:text-slate-450">
                  <Settings className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Hazırlanıyor
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Fiyat Farkı Hesaplamaları
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-normal">
                  Mevzuata ve güncel endekslere göre fiyat farkı hesaplamalarının saniyeler içinde
                  hatasız yapılması.
                </p>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-650 dark:text-slate-450">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  Hazırlanıyor
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Hakediş İcmalleri & Raporlar
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-normal">
                  Hakediş kapak raporu, dizi pusulası, gerçekleştirme raporu ve ödeme emri
                  belgelerinin birleştirilmesi.
                </p>
              </div>
            </div>

            {/* Card 4 */}
            <div className="bg-white dark:bg-slate-955 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
              <div className="flex justify-between items-start">
                <div className="p-2 bg-slate-100 dark:bg-slate-900 rounded-xl text-slate-650 dark:text-slate-450">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  Planlandı
                </span>
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Mevzuat Kontrol Mekanizması
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal font-normal">
                  Yasal kesintilerin (Gelir vergisi, Damga vergisi, SGK vb.) otomatik ve hatasız
                  kontrolü.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer/Contact */}
        <div className="p-4 bg-slate-100 dark:bg-slate-955/40 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500 dark:text-slate-450 leading-relaxed flex items-center justify-between">
          <span>
            💡 Bu modülle ilgili talepleriniz veya öncelik verilmesini istediğiniz evrak türleri
            varsa bizimle iletişime geçebilirsiniz.
          </span>
          <button className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-bold hover:underline shrink-0">
            Destek Al <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
