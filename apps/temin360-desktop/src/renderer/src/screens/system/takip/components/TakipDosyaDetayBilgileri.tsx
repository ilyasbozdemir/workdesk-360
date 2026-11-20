import React, { useState } from 'react'
import {
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Edit,
  ExternalLink,
  FileSpreadsheet,
  Lock,
  Percent,
  Receipt,
  RefreshCw,
  Scale,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  User,
  UserCheck,
  Users
} from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { useQueryClient } from '@tanstack/react-query'
import { groupUniqueCommissioners } from '../../../../utils/commissionGrouping'
import { applyInstitutionalTemplateToDossier } from '../../../../services/commission/commissionSeedService'
import { fetchCanonicalDossierPricing } from '../../../../services/dossier/dossierPriceSyncService'
import { emitAppEvent } from '../../../../utils/appEvents'
import { formatMoney } from '../../../../components/layout/temin-selector/teminSelector.utils'
import { APP_ROUTES } from '../../../../constants/routeConstants'

interface TakipDosyaDetayBilgileriProps {
  activeDosya: any
  komisyonlar: any[]
  onEditClick: () => void
}

export function TakipDosyaDetayBilgileri({
  activeDosya,
  komisyonlar,
  onEditClick
}: TakipDosyaDetayBilgileriProps): React.JSX.Element {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const d = activeDosya || {}
  const { uniqueCommissioners, uniqueCount, totalAssignmentCount } =
    groupUniqueCommissioners(komisyonlar)

  const [isSyncing, setIsSyncing] = useState(false)
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null)

  const isSozlesmeli = Boolean(d.sozlesme_yapilacak_mi)
  const isKismiTeklif = Boolean(d.kismi_teklif_verilecek_mi)

  const handleSyncCommissions = async () => {
    if (!d.id) return
    setIsSyncing(true)
    setSyncFeedback(null)
    try {
      const res = await applyInstitutionalTemplateToDossier(d.id)
      if (res.success) {
        setSyncFeedback(`✅ Kurumsal kadro (${res.count || 0} üye) başarıyla eşitlendi.`)
        await queryClient.invalidateQueries({ queryKey: ['takip_komisyonlar'] })
        setTimeout(() => setSyncFeedback(null), 3500)
      } else {
        setSyncFeedback(`⚠️ Eşitleme: ${res.error || 'İşlem tamamlanamadı'}`)
      }
    } catch (err: any) {
      setSyncFeedback(`❌ Hata: ${err.message}`)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleChangeHesaplamaEsasi = async (newEsas: string) => {
    if (!d.id || !(window as any).electron?.ipcRenderer) return
    try {
      await (window as any).electron.ipcRenderer.invoke(
        'db:run',
        'UPDATE DATA_TeminDosyasi SET hesaplama_esasi = ? WHERE id = ?',
        [newEsas, d.id]
      )
      await fetchCanonicalDossierPricing(d.id)
      await queryClient.invalidateQueries({ queryKey: ['takip_dosya'] })
      await queryClient.invalidateQueries({ queryKey: ['dosyalar'] })
      emitAppEvent('dossier:updated', { dosyaId: d.id })
    } catch (err) {
      console.error('Hesaplama esası güncellenemedi:', err)
    }
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6 animate-in fade-in duration-200">
      {/* BAŞLIK & İDARİ BİLGİLENDİRME BARI */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-slate-850 dark:text-slate-100">
                Dosya Şartname ve İdari Bilgileri
              </h3>
              <span className="inline-flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800/60">
                <CheckCircle2 size={10} className="text-emerald-500" />
                Resmî Dosya Künyesi · Canlı Veri
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              4734 Sayılı Kamu İhale Kanunu, 5018 Sayılı Bütçe Kanunu ve Doğrudan Temin Tebliği mevzuat parametreleri.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`text-xs px-3 py-1 rounded-xl font-bold border ${
              isSozlesmeli
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-800/60'
                : 'bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800/60'
            }`}
          >
            {isSozlesmeli ? 'Sözleşmeli Alım (‰ 9,48 DV)' : 'Sipariş Usulü (Sözleşmesiz)'}
          </span>

          <button
            onClick={onEditClick}
            type="button"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="Dosya Formunu Düzenle"
          >
            <Edit size={13} />
            <span>Formu Düzenle</span>
          </button>
        </div>
      </div>

      {/* 1. TEMEL ALIM VE İHALE PARAMETRELERİ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Scale size={14} className="text-blue-500" />
            <span>1. Temel Alım ve Şartname Parametreleri</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">KİK & Usul Esasları</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Alım Türü
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 uppercase mt-0.5 block">
              {d.tur ? `${d.tur} Alımı` : 'Mal Alımı'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              İhale / Temin Usulü
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
              {d.ihale_sekli || d.temin_usulu || '4734 Sayılı KİK Md. 22/d'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Teklif / Sözleşme Türü
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
              {d.teklif_sozlesme_turu || 'Birim Fiyat Teklifi'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Bütçe Yılı
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
              {d.butce_yili || '2026'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Genel KDV Oranı
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
              %{d.kdv ?? '20'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Sözleşme Düzenleme
            </span>
            <span
              className={`text-xs font-bold mt-0.5 block ${
                isSozlesmeli
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
            >
              {isSozlesmeli ? 'Sözleşme Yapılacak' : 'Sözleşme Yok (Sipariş)'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Fiyat Farkı Kararnamesi
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate block">
              {d.fiyat_farki_dayanagi || 'Fiyat Farkı Verilmeyecektir'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Kısmi Teklif Kabulü
            </span>
            <span className="text-xs font-bold text-slate-800 dark:text-slate-100 mt-0.5 block">
              {isKismiTeklif ? 'Kısmi Teklif Verilebilir' : 'Tüm Kalemler İçin Tek Teklif'}
            </span>
          </div>

          {/* YAKLAŞIK MALİYET & HESAPLAMA ESASI */}
          <div className="p-3 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider block">
                Yaklaşık Maliyet
              </span>
              <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-xs font-mono font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5 block">
              {d.yaklasik_maliyet ? `₺${formatMoney(d.yaklasik_maliyet)}` : 'Belirlenmedi'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold uppercase tracking-wider block">
                Hesaplama Esası
              </span>
              <Calculator className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </div>
            <select
              value={d.hesaplama_esasi || 'Ortalama fiyat esasına göre'}
              onChange={(e) => handleChangeHesaplamaEsasi(e.target.value)}
              className="w-full text-[11px] font-bold px-2 py-1 rounded-lg bg-white dark:bg-slate-900 border border-amber-300/80 dark:border-amber-700 text-slate-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber-500"
              title="Yaklaşık Maliyet ve Teklif Hesaplama Esasını Değiştir"
            >
              <option value="En Düşük fiyat esasına göre">⚙️ En Düşük Fiyat Esası</option>
              <option value="Ortalama fiyat esasına göre">⚙️ Ortalama Fiyat Esası</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2. İDARİ BİRİM VE GÖREVLİ PERSONELLER */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <Building2 size={14} className="text-indigo-500" />
            <span>2. İdari Birim ve İmza Yetkilileri</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">Hiyerarşik Görevliler</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Building2 size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Talep Eden Harcama Birimi
              </span>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate block">
                {d.birim_adi || d.harcama_birimi || 'Birim Belirtilmedi'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
              <UserCheck size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Harcama Yetkilisi (Onaylayan)
              </span>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate block">
                {d.onaylayan_ad || '-'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Gerçekleştirme Görevlisi
              </span>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate block">
                {d.sunan_ad || '-'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <User size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                Dosyayı Hazırlayan Personel
              </span>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate block">
                {d.hazirlayan_ad || '-'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <Briefcase size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                İrtibat / İletişim Yetkilisi
              </span>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate block">
                {d.irtibat_ad || '-'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
              <Receipt size={18} />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">
                İhtiyaç / Teslim Yeri
              </span>
              <span className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate block">
                {d.ihtiyac_yeri || d.teslim_yeri || 'Kurum Ambarı / Birim'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. BÜTÇE VE MUHASEBE TERTİBİ */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
            <CreditCard size={14} className="text-emerald-500" />
            <span>3. Bütçe ve Muhasebe Tertibi (5018 Analitik Kodlar)</span>
          </h4>
          <span className="text-[11px] text-slate-400 font-medium">Ödenek & Muhasebe</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Harcama Birimi
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate block">
              {d.harcama_birimi || d.birim_kodu || '-'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Muhasebe Birimi
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate block">
              {d.muhasebe_birimi || 'Mali Hizmetler'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Bütçe Kodu
            </span>
            <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 mt-0.5 truncate block">
              {d.butce_kodu || '03.2.1.01'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Fonksiyonel Kod
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate block">
              {d.fonksiyonel_kod || '-'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Finansman Kodu
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate block">
              {d.finansman_kodu || '-'}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
              Ekonomik Kod
            </span>
            <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-100 mt-0.5 truncate block">
              {d.ekonomik_kod || '03.2'}
            </span>
          </div>
        </div>
      </div>

      {/* 4. GÖREVLİ KOMİSYON PERSONELLERİ (TEKİL KİŞİ BAZLI GRUPLAMA) */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Users size={16} className="text-amber-500" />
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              4. Görevli Komisyon Personelleri
            </h4>
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60">
              {uniqueCount} Tekil Personel
              {totalAssignmentCount !== uniqueCount ? ` · ${totalAssignmentCount} Görevlendirme` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleSyncCommissions}
              disabled={isSyncing}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-2xs cursor-pointer border-0"
              title="Kurumsal şablon komisyon kadrosunu bu dosyaya aktar ve eşitle"
            >
              <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
              <span>{isSyncing ? "Eşitleniyor..." : "Şablondan Eşitle"}</span>
            </button>

            <button
              onClick={() => navigate({ to: APP_ROUTES.KOMISYONLAR as any })}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 cursor-pointer"
              title="Komisyon Yönetimi Masasını Aç"
            >
              <ExternalLink size={12} />
              <span>Komisyon Masası</span>
            </button>
          </div>
        </div>

        {syncFeedback && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100 text-xs font-semibold animate-in fade-in">
            {syncFeedback}
          </div>
        )}

        {uniqueCommissioners.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center bg-slate-50/50 dark:bg-slate-900/50 space-y-3">
            <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
            <div className="space-y-1">
              <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Bu dosyaya henüz komisyon üyesi atanmamış
              </div>
              <div className="text-xs text-slate-400 max-w-md mx-auto">
                Piyasa Fiyat Araştırması ve Muayene Kabul aşamalarında görevli personelleri tek tıkla kurumsal şablondan aktarabilir veya Komisyon Masasından özelleştirebilirsiniz.
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={handleSyncCommissions}
                disabled={isSyncing}
                type="button"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
              >
                <Sparkles size={14} />
                <span>Kurumsal Şablonu Şimdi Ata</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {uniqueCommissioners.map((c) => {
              const initials = c.adSoyad
                .split(' ')
                .filter(Boolean)
                .slice(0, 2)
                .map((n) => n[0])
                .join('')
                .toUpperCase()

              return (
                <div
                  key={c.key}
                  className="p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-800 flex flex-col justify-between gap-3 hover:border-amber-300 dark:hover:border-amber-700/60 transition-all shadow-2xs"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                      {initials || 'U'}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-bold text-slate-850 dark:text-slate-100 truncate">
                          {c.adSoyad}
                        </span>
                        {c.assignments.length > 1 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 shrink-0">
                            {c.assignments.length} Görev
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block mt-0.5">
                        {c.unvan || 'Personel'} {c.birim ? `• ${c.birim}` : ''}
                      </span>
                    </div>
                  </div>

                  {/* Üstlendiği Komisyon Görevleri */}
                  <div className="space-y-1.5 pt-2 border-t border-slate-200/60 dark:border-slate-800/60">
                    {c.assignments.map((role) => {
                      const komTuru = (role.komisyonTuru || '').toLowerCase()
                      const isPiyasa =
                        komTuru.includes('piyasa') ||
                        komTuru.includes('fiyat') ||
                        komTuru.includes('yaklaşık')
                      const isMuayene =
                        komTuru.includes('muayene') ||
                        komTuru.includes('kabul')

                      return (
                        <div
                          key={`role_${role.id}_${role.komisyonTuru || 'kom'}_${role.gorev}`}
                          className="flex items-center justify-between gap-1 text-[10.5px]"
                        >
                          <span
                            className={`font-semibold truncate max-w-[170px] ${
                              isPiyasa
                                ? 'text-blue-700 dark:text-blue-300'
                                : isMuayene
                                  ? 'text-emerald-700 dark:text-emerald-300'
                                  : 'text-purple-700 dark:text-purple-300'
                            }`}
                            title={role.komisyonTuru}
                          >
                            {role.komisyonTuru}
                          </span>
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                            {role.gorev} ({role.asliYedek})
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
