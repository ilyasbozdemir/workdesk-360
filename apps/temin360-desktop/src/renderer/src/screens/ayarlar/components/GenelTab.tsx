import React from 'react'
import {
  Archive,
  Clock,
  ShieldCheck,
  Laptop,
  User,
  PanelLeft,
  LayoutDashboard,
  LayoutGrid
} from 'lucide-react'
import { useSettingsStore } from '../../../store/settingsStore'

interface GenelTabProps {
  disableDocumentGuidance: boolean
  setDisableDocumentGuidance: (val: boolean) => void
  unifiedStepperMode: boolean
  setUnifiedStepperMode: (val: boolean) => void
  trashRetentionDays?: number
  setTrashRetentionDays?: (val: number) => void
  useDesktopUserAsDefault?: boolean
  setUseDesktopUserAsDefault?: (val: boolean) => void
  alwaysShowQuickMenu?: boolean
  setAlwaysShowQuickMenu?: (val: boolean) => void
  pcInfo?: {
    hostname?: string
    osUsername?: string
    platform?: string
    osType?: string
    userDomain?: string
    suggestedDisplayName?: string
  } | null
}

export const GenelTab: React.FC<GenelTabProps> = ({
  disableDocumentGuidance,
  setDisableDocumentGuidance,
  unifiedStepperMode,
  setUnifiedStepperMode,
  trashRetentionDays = 30,
  setTrashRetentionDays,
  useDesktopUserAsDefault,
  setUseDesktopUserAsDefault,
  alwaysShowQuickMenu = true,
  setAlwaysShowQuickMenu,
  pcInfo
}) => {
  const { layoutMode, setLayoutMode } = useSettingsStore()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
        <div>
          <h2 className="text-lg font-bold text-slate-850 dark:text-slate-100">
            Genel Sistem Ayarları
          </h2>
          <p className="text-xs text-slate-500">
            Uygulamanın genel davranışını, masaüstü kullanıcı tercihini, çöp kutusu saklama politikasını ve arayüz düzenini belirleyin.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Arayüz Düzeni: Gelişmiş Ekran vs Basit Ekran */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-emerald-500" />
                Çalışma Alanı &amp; Arayüz Düzeni (Gelişmiş vs Basit Ekran)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                WorkDesk 360 arayüzünü kullanım alışkanlığınıza göre ayarlayın. Gelişmiş ekran çoklu sekmeler,
                detaylı mali modüller ve yan paneller sunarken; basit ekran sade, tek sayfada odaklanmış ve klasik bir yönetim paneli deneyimi sağlar.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shrink-0">
              {layoutMode === 'simple' ? 'Basit Ekran Aktif' : 'Gelişmiş Ekran Aktif'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            <button
              type="button"
              onClick={() => setLayoutMode('advanced')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                layoutMode !== 'simple'
                  ? 'bg-blue-50/80 border-blue-500 text-blue-900 dark:bg-blue-950/30 dark:border-blue-400 dark:text-blue-200 shadow-sm ring-1 ring-blue-500/20'
                  : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700/60 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    layoutMode !== 'simple'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold">Gelişmiş Ekran (Masaüstü Çoklu Sekme)</div>
                  <div className="text-[11px] opacity-75">Genişletilmiş profesyonel çalışma alanı</div>
                </div>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Çoklu çalışma alanı sekmeleri, gelişmiş mali yönetim panelleri, rotasyonlu diyaloglar ve tam fonksiyonlu masaüstü deneyimi.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setLayoutMode('simple')}
              className={`p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                layoutMode === 'simple'
                  ? 'bg-emerald-50/80 border-emerald-500 text-emerald-900 dark:bg-emerald-950/30 dark:border-emerald-400 dark:text-emerald-200 shadow-sm ring-1 ring-emerald-500/20'
                  : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700/60 dark:text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                    layoutMode === 'simple'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold">Basit Ekran (Klasik &amp; Sade Yönetim)</div>
                  <div className="text-[11px] opacity-75">Hızlı, net ve odaklı arayüz</div>
                </div>
              </div>
              <p className="text-[11px] opacity-80 leading-relaxed">
                Klasik sol navigasyon menüsü, üstte aktif dosya seçicisi, net A4 belge önizleme ve sadeleştirilmiş sekmesiz panel düzeni.
              </p>
            </button>
          </div>
        </div>
        {/* Masaüstü ve Cihaz Kullanıcı Entegrasyonu */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Laptop className="w-4 h-4 text-blue-500" />
                Masaüstü & Cihaz Kullanıcı Entegrasyonu
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                Uygulama açılışında ve kilit ekranında, bu bilgisayarın işletim sistemi kullanıcı adının
                otomatik olarak algılanıp varsayılan olarak önerilmesini belirleyin.
              </p>
            </div>
            {pcInfo?.osUsername && (
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shrink-0">
                <User className="w-3.5 h-3.5" />
                {pcInfo.osUsername}
              </div>
            )}
          </div>

          {pcInfo?.hostname && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Cihaz Adı (Hostname):</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  {pcInfo.hostname}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">İşletim Sistemi Kullanıcısı:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  {pcInfo.osUsername || 'Bilinmiyor'}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Platform / Sistem:</span>
                <span className="font-semibold text-slate-700 dark:text-slate-300 font-mono">
                  {pcInfo.platform} ({pcInfo.osType || 'Yerel'})
                </span>
              </div>
            </div>
          )}

          <label className="flex items-center gap-3 p-3.5 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-all">
            <input
              type="checkbox"
              checked={Boolean(useDesktopUserAsDefault)}
              onChange={(e) => setUseDesktopUserAsDefault?.(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Giriş ve Kilit Ekranında Masaüstü Kullanıcısını Varsayılan Yap
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Etkinleştirildiğinde, uygulama çalışma dosyası açılışında kullanıcı adı otomatik olarak bu bilgisayarın oturumuyla doldurulur.
              </span>
            </div>
          </label>
        </div>

        {/* Sol Hızlı Erişim Menüsü & Kullanıcı Profili Görünürlüğü */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <PanelLeft className="w-4 h-4 text-purple-500" />
                Sol Hızlı Erişim Menüsü &amp; Kullanıcı Profili Görünürlüğü
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                Kullanıcı Profili, Belge Rota Yönetimi, Kurum, Birim, Personel ve İhtiyaç Raporları
                kısayollarının yer aldığı sol hızlı erişim çubuğunun aktif bir dosya seçili değilken de
                her zaman görünür olup olmayacağını belirleyin.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shrink-0">
              {alwaysShowQuickMenu ? 'Her Zaman Görünür' : 'Sadece Aktif Dosyada'}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3.5 bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/70 dark:border-slate-800/70 rounded-xl cursor-pointer hover:bg-slate-100/60 dark:hover:bg-slate-800/30 transition-all">
            <input
              type="checkbox"
              checked={Boolean(alwaysShowQuickMenu)}
              onChange={(e) => setAlwaysShowQuickMenu?.(e.target.checked)}
              className="rounded border-slate-300 dark:border-slate-700 text-purple-600 focus:ring-purple-500 w-4 h-4 cursor-pointer"
            />
            <div>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                Aktif Dosya Seçili Olmadan da Sol Hızlı Menüyü ve Kullanıcı Profilini Göster (Önerilen)
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                Açık olduğunda, herhangi bir doğrudan temin dosyası seçmeden de sol hızlı menüden Kullanıcı Profili, Belge Rota Yönetimi, Personel ve Birim ekranlarına doğrudan erişebilirsiniz.
              </span>
            </div>
          </label>
        </div>
        {/* Çöp Kutusu ve Soft Delete Saklama Süresi */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <label className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Archive className="w-4 h-4 text-amber-500" />
                Çöp Kutusu & Silinen Dosyaları Saklama Süresi (Soft Delete Retention)
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
                Doğrudan temin dosyaları veya modüller kaldırıldığında hemen yok edilmez; Çöp
                Kutusu&apos;nda güvenle bekletilir. Bu süre zarfında dilediğiniz an tek tıkla geri
                yükleyebilirsiniz. Süre dolduğunda kalıcı olarak temizlenir.
              </p>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 shrink-0">
              <Clock className="w-3.5 h-3.5" />
              {trashRetentionDays} Gün Saklanır
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
            {[7, 15, 30, 60, 90].map((days) => {
              const isSelected = trashRetentionDays === days
              return (
                <button
                  key={days}
                  type="button"
                  onClick={() => setTrashRetentionDays && setTrashRetentionDays(days)}
                  className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50 border-amber-500 text-amber-900 dark:bg-amber-950/30 dark:border-amber-400 dark:text-amber-200 shadow-sm ring-1 ring-amber-500/20'
                      : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-700 dark:bg-slate-800/50 dark:border-slate-700/60 dark:text-slate-300'
                  }`}
                >
                  <div className="text-base font-extrabold">{days} Gün</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {days === 30
                      ? 'Standart (Önerilen)'
                      : days < 30
                        ? 'Kısa Süreli'
                        : 'Genişletilmiş'}
                  </div>
                </button>
              )
            })}
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>
              Süre dolmadan önce <strong>Bildirimler</strong> panelinde hatırlatıcı bildirim
              gösterilir.
            </span>
          </div>
        </div>

        {/* Belge Çıkarma & Yönlendirme Modu */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-350 mb-2">
            Belge Çıkarma & Yönlendirme Modu
          </label>
          <p className="text-xs text-slate-500 mb-4">
            Diyalog adımlarında (Hazırlık, Teklifler, Sipariş, Kabul) belgeleri yazdırma ve işlem
            yapma butonlarının gösterilip gösterilmeyeceğini belirleyin.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-all">
              <input
                type="radio"
                name="documentGuidanceMode"
                checked={disableDocumentGuidance}
                onChange={() => setDisableDocumentGuidance(true)}
                className="mt-0.5 rounded-full border-slate-300 dark:border-slate-700 bg-slate-55 dark:bg-slate-950 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  Serbest Belge Çıkarma Modu (Varsayılan)
                </span>
                <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">
                  {
                    'Dosya adımlarındaki "Belgeleri Yazdır" kılavuz butonunu gizler. Bunun yerine "İşlemler" menüsünü ve serbest belge çıkarma seçeneklerini gösterir.'
                  }
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-all">
              <input
                type="radio"
                name="documentGuidanceMode"
                checked={!disableDocumentGuidance}
                onChange={() => setDisableDocumentGuidance(false)}
                className="mt-0.5 rounded-full border-slate-300 dark:border-slate-700 bg-slate-55 dark:bg-slate-950 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  Kılavuzlu Belge Çıkarma Modu
                </span>
                <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">
                  {
                    'Her diyalog adımında "Belgeleri Yazdır" butonunu ön plana çıkararak sırayla çıkarılması gereken evrakları adım adım yönlendirir.'
                  }
                </span>
              </div>
            </label>
          </div>
        </div>

        {/* Görünüm Modu (Stepper vs Ayrı Sekmeler) */}
        <div>
          <label className="block text-sm font-bold text-slate-700 dark:text-slate-350 mb-2">
            Doğrudan Temin Süreç Görünüm Modu
          </label>
          <p className="text-xs text-slate-500 mb-4">
            Doğrudan temin aşamalarının (Hazırlık, Teklifler, Sipariş, Kabul vb.) tek bir ekran
            üzerinde mi yoksa ayrı sekmeler halinde mi gösterileceğini belirleyin.
          </p>

          <div className="space-y-3">
            <label className="flex items-start gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-all">
              <input
                type="radio"
                name="unifiedStepperMode"
                checked={unifiedStepperMode}
                onChange={() => setUnifiedStepperMode(true)}
                className="mt-0.5 rounded-full border-slate-300 dark:border-slate-700 bg-slate-55 dark:bg-slate-950 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  Tek Ekran (Stepper) Görünümü (Varsayılan)
                </span>
                <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">
                  Tüm aşamaları sol taraftaki menü yardımıyla tek bir ekrandan sayfa değiştirmeden
                  yönetin.
                </span>
              </div>
            </label>

            <label className="flex items-start gap-3 p-4 bg-slate-50/50 dark:bg-slate-900/20 border border-slate-205 dark:border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-100/30 dark:hover:bg-slate-800/20 transition-all">
              <input
                type="radio"
                name="unifiedStepperMode"
                checked={!unifiedStepperMode}
                onChange={() => setUnifiedStepperMode(false)}
                className="mt-0.5 rounded-full border-slate-300 dark:border-slate-700 bg-slate-55 dark:bg-slate-950 text-blue-600 focus:ring-blue-500 accent-blue-600 cursor-pointer"
              />
              <div>
                <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 block">
                  Ayrı Sekmeler Görünümü
                </span>
                <span className="text-[11px] text-slate-500 block mt-1 leading-relaxed">
                  Aşamalara tıklandığında tam sayfa olarak ayrı bir sekmeye (sayfaya) yönlendirilir.
                </span>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  )
}
