import React from 'react'
import {
  Sparkles,
  Clock,
  Activity,
  Layers,
  RotateCcw,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar
} from 'lucide-react'
import { Link } from '@tanstack/react-router'
import { useNewFeaturesStore } from '../../../store/newFeaturesStore'
import { NewFeatureBadge } from '../../../components/ui/NewFeatureBadge'
import { Button } from '../../../components/ui/Button'
import { cn } from '../../../utils/cn'

export const NewFeaturesTab: React.FC = () => {
  const {
    globalDaysActive,
    setGlobalDaysActive,
    showPulsingAnimation,
    setShowPulsingAnimation,
    showVersionTag,
    setShowVersionTag,
    features,
    dismissedIds,
    dismissFeature,
    resetFeature,
    resetAllFeatures,
    getFeatureStatus
  } = useNewFeaturesStore()

  // Aktif yeni olanlar
  const stats = React.useMemo(() => {
    let activeCount = 0
    let expiredCount = 0
    let dismissedCount = 0

    features.forEach((f) => {
      const status = getFeatureStatus(f.id)
      if (dismissedIds.includes(f.id)) {
        dismissedCount++
      } else if (status.isNew) {
        activeCount++
      } else {
        expiredCount++
      }
    })

    return {
      total: features.length,
      activeCount,
      expiredCount,
      dismissedCount
    }
  }, [features, dismissedIds, getFeatureStatus])

  const durationOptions = [
    { label: 'Kapalı (0 Gün)', value: 0 },
    { label: '7 Gün', value: 7 },
    { label: '14 Gün (2 Hafta)', value: 14 },
    { label: '30 Gün (Önerilen)', value: 30 },
    { label: '60 Gün (2 Ay)', value: 60 },
    { label: 'Sürekli Açık (Sınırsız)', value: 999 }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-10">
      {/* ── 1. ÜST BİLGİ VE AÇIKLAMA BAŞLIĞI ── */}
      <div className="bg-linear-to-r from-emerald-500/10 via-teal-500/5 to-transparent border border-emerald-500/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Yeni Ekranlar & Sürüm Rozetleri</span>
              <NewFeatureBadge routeOrId="ayarlar-new" feature={{ id: 'ayarlar-new', title: 'Yeni Özellik Yöneticisi', version: 'v1.0.0-rc.9', releaseDate: '2026-10-27', description: '', category: 'ekran', route: '' }} size="xs" />
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Sisteme yeni eklenen ekranlar, menüler ve modüller için yanıp sönen canlı nabız (ping/pulse) animasyonunu,
              hangi sürümden geldiğini ve kaç gün boyunca rozetli gösterileceğini buradan yönetebilirsiniz.
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={resetAllFeatures}
          className="shrink-0 gap-1.5 text-xs font-semibold rounded-xl border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          title="Tüm ayarları ve gizlenen rozetleri varsayılana sıfırlar"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Varsayılana Sıfırla</span>
        </Button>
      </div>

      {/* ── 2. KPI ÖZET KARTLARI ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Aktif Yeni Ekran</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.activeCount}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
            Menüde rozet yanıp sönüyor
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Gösterim Süresi</span>
            <Clock className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {globalDaysActive >= 999 ? 'Sınırsız' : globalDaysActive === 0 ? 'Kapalı' : `${globalDaysActive} Gün`}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Süre bitince otomatik söner
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Canlı Animasyon</span>
            <Activity className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {showPulsingAnimation ? 'Aktif' : 'Sabit'}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Göz alıcı yumuşak nabız
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Toplam Kayıt</span>
            <Layers className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {stats.total}
          </div>
          <div className="text-[11px] text-slate-500 font-medium mt-0.5">
            Tanımlı sürüm özellikleri
          </div>
        </div>
      </div>

      {/* ── 3. GENEL AYARLAR KONTROLLERİ ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-2xs space-y-5">
        <h3 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-blue-500" />
          <span>Rozet Görünüm & Davranış Tercihleri</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gösterim Gün Süresi */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>Yeni Rozeti Gösterim Süresi</span>
            </label>
            <select
              value={globalDaysActive}
              onChange={(e) => setGlobalDaysActive(Number(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              {durationOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Yeni eklenen bir ekranın sürüm çıkış tarihinden itibaren kaç gün boyunca rozetli kalacağını belirler.
            </p>
          </div>

          {/* Yanıp Sönen Nabız Animasyonu */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" />
              <span>Yanıp Sönen Canlı Animasyon (Ping / Glow)</span>
            </label>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowPulsingAnimation(!showPulsingAnimation)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                  showPulsingAnimation ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                    showPulsingAnimation ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {showPulsingAnimation ? 'Animasyon Açık' : 'Sabit Rozet'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Açık olduğunda 'YENİ' rozetinin yanında dikkat çekici yumuşak yeşil nabız noktası parlar.
            </p>
          </div>

          {/* Sürüm Etiketini Rozette Göster */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-slate-500" />
              <span>Sürüm Kodu Etiketi (Örn: v1.0.0-rc.9)</span>
            </label>
            <div className="flex items-center gap-3 pt-1">
              <button
                type="button"
                onClick={() => setShowVersionTag(!showVersionTag)}
                className={cn(
                  'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden',
                  showVersionTag ? 'bg-emerald-600' : 'bg-slate-300 dark:bg-slate-700'
                )}
              >
                <span
                  className={cn(
                    'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out',
                    showVersionTag ? 'translate-x-5' : 'translate-x-0'
                  )}
                />
              </button>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {showVersionTag ? 'Sürüm Gösteriliyor' : 'Yalnızca "YENİ"'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Rozetin içine hangi sürümle geldiği minik bir etiketle entegre edilir.
            </p>
          </div>
        </div>

        {/* Canlı Önizleme Bandı */}
        <div className="bg-slate-50 dark:bg-slate-950/60 border border-slate-200/80 dark:border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-600 dark:text-slate-400">Canlı Önizleme:</span>
            <NewFeatureBadge
              feature={{
                id: 'preview',
                title: 'Örnek Yeni Ekran',
                version: 'v1.0.0-rc.9',
                releaseDate: '2026-10-27',
                description: 'Önizleme',
                category: 'ekran',
                route: ''
              }}
              size="sm"
            />
          </div>
          <span className="text-[11px] text-slate-400">
            Fareyle rozet üzerine gelerek sürüm ve kalan gün bilgisi ipucunu test edebilirsiniz.
          </span>
        </div>
      </div>

      {/* ── 4. YENİ EKRANLAR VE SÜRÜM MATRİSİ TABLOSU ── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-2xs">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-500" />
              <span>Sistemdeki Yeni Ekranlar & Sürüm Bilgisi Matrisi</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hangi ekranın hangi sürümle geldiği, yayın tarihi ve aktif gösterim durumu aşağıda listelenmiştir.
            </p>
          </div>
          <div className="text-xs font-mono font-bold text-slate-400">
            {features.length} Ekran / Modül
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-200 dark:border-slate-800">
                <th className="py-3 px-4">Ekran & Özellik Adı</th>
                <th className="py-3 px-3">Kategori</th>
                <th className="py-3 px-3">Geliş Sürümü</th>
                <th className="py-3 px-3">Eklenme Tarihi</th>
                <th className="py-3 px-3">Kalan Süre</th>
                <th className="py-3 px-3">Rozet Durumu</th>
                <th className="py-3 px-4 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {features.map((item) => {
                const status = getFeatureStatus(item.id)
                const isDismissed = dismissedIds.includes(item.id)
                const remaining = status.remainingDays

                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Ekran Adı */}
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {item.title}
                      </div>
                      <div className="text-[11px] text-slate-400 line-clamp-1">
                        {item.description}
                      </div>
                    </td>

                    {/* Kategori */}
                    <td className="py-3 px-3">
                      <span className="inline-block uppercase tracking-wider text-[9.5px] font-extrabold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.category}
                      </span>
                    </td>

                    {/* Sürüm */}
                    <td className="py-3 px-3">
                      <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 px-2 py-0.5 rounded-md text-[11px]">
                        {item.version}
                      </span>
                    </td>

                    {/* Tarih */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px]">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{item.releaseDate}</span>
                      </div>
                    </td>

                    {/* Kalan Gün */}
                    <td className="py-3 px-3">
                      {isDismissed ? (
                        <span className="text-[11px] text-slate-400 italic">Gizlendi</span>
                      ) : status.isNew ? (
                        <div className="space-y-1">
                          <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                            {remaining >= 999 ? 'Sınırsız' : `${remaining} gün kaldı`}
                          </span>
                          <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{
                                width: `${Math.min(100, Math.max(5, (remaining / (item.daysActive || 30)) * 100))}%`
                              }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-semibold">Süresi Doldu</span>
                      )}
                    </td>

                    {/* Rozet Önizleme */}
                    <td className="py-3 px-3">
                      {isDismissed ? (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <EyeOff className="w-3.5 h-3.5" /> Kapalı
                        </span>
                      ) : status.isNew ? (
                        <NewFeatureBadge feature={item} size="xs" />
                      ) : (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-slate-400" /> Tamamlandı
                        </span>
                      )}
                    </td>

                    {/* İşlemler */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {item.route && (
                          <Link to={item.route}>
                            <button
                              type="button"
                              className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/60 dark:text-blue-400 transition-colors cursor-pointer"
                              title="Ekranı Aç / Test Et"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </Link>
                        )}

                        {isDismissed ? (
                          <button
                            type="button"
                            onClick={() => resetFeature(item.id)}
                            className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 dark:text-emerald-400 transition-colors cursor-pointer"
                            title="Rozeti Yeniden Göster"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => dismissFeature(item.id)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                            title="Bu Rozeti Gizle"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
