import React, { useEffect, useState } from 'react'
import {
  Calculator,
  Receipt,
  Info,
  ShieldCheck,
  Lock,
  Building2,
  FolderOpen
} from 'lucide-react'
import { formatCurrency } from '@renderer/utils/formatters'
import { useWorkspaceStore } from '@renderer/store/workspaceStore'
import {
  fetchCanonicalDossierPricing,
  isDogrudanTeminDosyasi
} from '@renderer/services/dossier/dossierPriceSyncService'
import { useAppEventListener } from '@renderer/utils/appEvents'

export const TaxDeductionsPage: React.FC = () => {
  const { activeDosyaId } = useWorkspaceStore()

  const [activeDosyaInfo, setActiveDosyaInfo] = useState<{
    id: number
    teminNo: string
    konu: string
    yuklenici: string
    isDogrudanTemin: boolean
    sozlesmeYapilacakMi: boolean
  } | null>(null)

  const [manualProcessType, setManualProcessType] = useState<'dogrudan_temin' | 'ihale'>(
    'dogrudan_temin'
  )
  const [brutTutar, setBrutTutar] = useState<number>(150000)
  const [kdvOrani, setKdvOrani] = useState<number>(20)
  const [tevkifatOrani, setTevkifatOrani] = useState<number>(0) // 0 = Tevkifat Yok
  // 488 S.K. Ekli (1) Sayılı Tablo IV/1-a: Hakediş / Fatura / Ödeme Emri Damga Vergisi (Binde 9,48)
  const [odemeDamgaVergisiUygula, setOdemeDamgaVergisiUygula] = useState<boolean>(true)
  // 488 S.K. Ekli (1) Sayılı Tablo I/A-1: Sözleşme Damga Vergisi (Yalnızca İhale/Sözleşmeli dosyalarda)
  const [sozlesmeVarMi, setSozlesmeVarMi] = useState<boolean>(false)
  // 488 S.K. Ekli (1) Sayılı Tablo II/2: İhale Karar Pulu (Yalnızca İhale Komisyonu Kararlarında)
  const [kararPuluHesaplansinMi, setKararPuluHesaplansinMi] = useState<boolean>(false)

  const loadActiveDossierFinancials = async () => {
    if (!activeDosyaId || !window.electron?.ipcRenderer) {
      setActiveDosyaInfo(null)
      setSozlesmeVarMi(false)
      setKararPuluHesaplansinMi(false)
      return
    }

    try {
      const [dosyaRes, canonical] = await Promise.all([
        window.electron.ipcRenderer.invoke(
          'db:query',
          'SELECT id, temin_no, konu, kdv, yaklasik_maliyet, net_odenen, ihale_usulu, ihale_sekli, tedarik_sekli, sozlesme_yapilacak_mi FROM DATA_TeminDosyasi WHERE id = ?',
          [activeDosyaId]
        ),
        fetchCanonicalDossierPricing(activeDosyaId)
      ])

      if (dosyaRes?.success && dosyaRes.data?.length > 0) {
        const d = dosyaRes.data[0]
        const isDt = isDogrudanTeminDosyasi(d)
        const hasContract = Boolean(d.sozlesme_yapilacak_mi)
        const matrah =
          canonical?.kazananTeklifToplami ||
          canonical?.toplamYaklasikMaliyet ||
          Number(d.yaklasik_maliyet) ||
          0
        const kdv = canonical?.kdvOrani ?? (Number.isFinite(Number(d.kdv)) ? Number(d.kdv) : 20)

        setActiveDosyaInfo({
          id: Number(d.id),
          teminNo: d.temin_no || `DT-${d.id}`,
          konu: d.konu || 'Doğrudan Temin Dosyası',
          yuklenici: canonical?.kazananFirma?.unvan || 'Belirlenmedi',
          isDogrudanTemin: isDt,
          sozlesmeYapilacakMi: hasContract
        })

        setBrutTutar(Number(matrah.toFixed(2)))
        setKdvOrani(kdv)
        setOdemeDamgaVergisiUygula(true)
        // Sözleşme damga vergisi doğrudan dosyanın sozlesme_yapilacak_mi durumuna bağlanır
        setSozlesmeVarMi(hasContract)
        setKararPuluHesaplansinMi(!isDt)
      } else {
        setActiveDosyaInfo(null)
      }
    } catch (err) {
      console.warn('Aktif dosya mali bilgileri yüklenemedi:', err)
      setActiveDosyaInfo(null)
    }
  }

  useEffect(() => {
    void loadActiveDossierFinancials()
  }, [activeDosyaId])

  useAppEventListener(['bids:changed', 'items:changed', 'dossier:updated'], () => {
    void loadActiveDossierFinancials()
  })

  const isDogrudanTemin = activeDosyaInfo
    ? activeDosyaInfo.isDogrudanTemin
    : manualProcessType === 'dogrudan_temin'

  // Hesaplamalar (KDV hariç matrah üzerinden)
  const kdvTutari = Number(((brutTutar * kdvOrani) / 100).toFixed(2))
  const tevkifEdilenKdv = Number(((kdvTutari * tevkifatOrani) / 10).toFixed(2))
  const yukleniciyeOdenenKdv = Number((kdvTutari - tevkifEdilenKdv).toFixed(2))

  // 1) Ödeme Emri / Fatura Damga Vergisi (488 S.K. IV/1-a - Binde 9,48)
  const damgaVergisiOrani = 0.00948
  const odemeDamgaVergisi = odemeDamgaVergisiUygula
    ? Number((brutTutar * damgaVergisiOrani).toFixed(2))
    : 0

  // 2) Sözleşme Damga Vergisi (488 S.K. I/A-1 - Binde 9,48) — Dosyanın sözleşme durumuna (sozlesme_yapilacak_mi) doğrudan bağlıdır
  const effectiveSozlesmeVar = activeDosyaInfo
    ? activeDosyaInfo.sozlesmeYapilacakMi && sozlesmeVarMi
    : sozlesmeVarMi
  const sozlesmeDamgaVergisi = effectiveSozlesmeVar
    ? Number((brutTutar * damgaVergisiOrani).toFixed(2))
    : 0

  // 3) İhale Karar Pulu (488 S.K. II/2 - Binde 5,69) — Doğrudan Teminde uygulanmaz
  const kararPuluOrani = 0.00569
  const effectiveKararPuluVar = !isDogrudanTemin && kararPuluHesaplansinMi
  const kararPulu = effectiveKararPuluVar
    ? Number((brutTutar * kararPuluOrani).toFixed(2))
    : 0

  const toplamDamgaVergisi = Number((odemeDamgaVergisi + sozlesmeDamgaVergisi).toFixed(2))
  const toplamKesinti = Number((toplamDamgaVergisi + kararPulu + tevkifEdilenKdv).toFixed(2))
  const toplamAlacakliyaOdenecek = Number(
    (brutTutar + yukleniciyeOdenenKdv - toplamDamgaVergisi - kararPulu).toFixed(2)
  )

  return (
    <div className="space-y-6">
      {/* Üst Bilgi Kartı */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <Calculator size={24} />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              {isDogrudanTemin
                ? 'Doğrudan Temin Damga Vergisi ve KDV Tevkifatı Hesaplama Motoru'
                : 'Vergi, Karar Pulu ve KDV Tevkifatı Hesaplama Motoru'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              488 Sayılı Damga Vergisi Kanunu ve KDV Genel Uygulama Tebliği uyarınca dosya türüne duyarlı yasal tahakkuk kesintileri.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs flex-wrap">
          <span className="px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 font-bold border border-purple-200/50">
            Ödeme Emri / Fatura DV: ‰ 9,48
          </span>
          {(activeDosyaInfo ? activeDosyaInfo.sozlesmeYapilacakMi : sozlesmeVarMi) && (
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200/50">
              Sözleşme DV: ‰ 9,48
            </span>
          )}
          {!isDogrudanTemin && (
            <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-bold border border-blue-200/50">
              İhale Karar Pulu: ‰ 5,69
            </span>
          )}
        </div>
      </div>

      {/* Aktif Dosya Bağlamı Bilgilendirme Bandı */}
      {activeDosyaInfo ? (
        <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3 min-w-0">
            <FolderOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-bold px-2 py-0.5 rounded bg-blue-600 text-white text-[10px]">
                  {activeDosyaInfo.teminNo}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
                  {activeDosyaInfo.konu}
                </span>
              </div>
              <div className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-slate-400" />
                  Yüklenici: <strong>{activeDosyaInfo.yuklenici}</strong>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 font-bold text-blue-700 dark:text-blue-300 text-[11px]"
              title="Dosya türü ve sözleşme durumu sistemden otomatik belirlenmiştir"
            >
              <Lock className="w-3 h-3" />
              {activeDosyaInfo.isDogrudanTemin
                ? `Usul: 4734 Md. 22 Doğrudan Temin (${activeDosyaInfo.sozlesmeYapilacakMi ? 'Sözleşmeli' : 'Sözleşmesiz'})`
                : 'Usul: 4734 İhale Süreci'}
            </span>
          </div>
        </div>
      ) : (
        <div className="p-3.5 rounded-2xl bg-slate-100/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <span className="text-slate-600 dark:text-slate-400 font-medium flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-500" />
            Serbest Hesaplama Modu (Aktif dosya seçildiğinde dosya türü sistem tarafından otomatik kilitlenir)
          </span>
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => {
                setManualProcessType('dogrudan_temin')
                setSozlesmeVarMi(false)
                setKararPuluHesaplansinMi(false)
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                manualProcessType === 'dogrudan_temin'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              Doğrudan Temin (4734 Md. 22)
            </button>
            <button
              type="button"
              onClick={() => {
                setManualProcessType('ihale')
                setSozlesmeVarMi(true)
                setKararPuluHesaplansinMi(true)
              }}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                manualProcessType === 'ihale'
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              İhale Süreci (Md. 19/20/21)
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sol Kolon: Parametre Giriş Formu */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt size={16} className="text-purple-500" />
            Tahakkuk & Matrah Parametreleri
          </h3>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Fatura / Hakediş Tutarı (KDV Hariç Matrah)
            </label>
            <div className="relative">
              <input
                type="number"
                value={brutTutar}
                onChange={(e) => setBrutTutar(Number(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 text-sm font-bold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 dark:text-slate-100"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                ₺
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                KDV Oranı (%)
              </label>
              <select
                value={kdvOrani}
                onChange={(e) => setKdvOrani(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value={20}>%20 (Standart)</option>
                <option value={10}>%10 (İndirimli)</option>
                <option value={1}>%1 (Temel Gıda)</option>
                <option value={0}>%0 (KDV Muaf)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                KDV Tevkifat Oranı
              </label>
              <select
                value={tevkifatOrani}
                onChange={(e) => setTevkifatOrani(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
              >
                <option value={0}>Tevkifat Yok (0/10)</option>
                <option value={2}>2/10 (Temizlik, Bakım)</option>
                <option value={3}>3/10 (Özel Güvenlik)</option>
                <option value={4}>4/10 (Yapım İşleri)</option>
                <option value={5}>5/10 (Danışmanlık, Denetim)</option>
                <option value={7}>7/10 (Yemek, Organizasyon)</option>
                <option value={9}>9/10 (Servis Taşımacılığı)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* 1. Ödeme Emri / Fatura Damga Vergisi (Hem Doğrudan Temin hem İhale için geçerli) */}
            <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-800/40">
              <input
                type="checkbox"
                checked={odemeDamgaVergisiUygula}
                onChange={(e) => setOdemeDamgaVergisiUygula(e.target.checked)}
                className="w-4 h-4 text-purple-600 rounded mt-0.5"
              />
              <div>
                <span className="text-xs text-slate-800 dark:text-slate-200 font-bold block">
                  Ödeme Emri / Fatura Damga Vergisi Kesintisi (Binde 9,48)
                </span>
                <span className="text-[10.5px] text-slate-500 dark:text-slate-400">
                  488 S.K. Ekli (1) Sayılı Tablo IV/1-a uyarınca resmî daire ödemelerinden KDV hariç matrah üzerinden kesilir.
                </span>
              </div>
            </label>

            {/* 2. Sözleşme Damga Vergisi — Dosyanın sözleşme durumuna (sozlesme_yapilacak_mi) doğrudan bağlıdır */}
            {activeDosyaInfo ? (
              activeDosyaInfo.sozlesmeYapilacakMi ? (
                <label className="flex items-start gap-2.5 cursor-pointer p-2.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/70 dark:border-amber-800/40">
                  <input
                    type="checkbox"
                    checked={sozlesmeVarMi}
                    onChange={(e) => setSozlesmeVarMi(e.target.checked)}
                    className="w-4 h-4 text-amber-600 rounded mt-0.5"
                  />
                  <div>
                    <span className="text-xs text-amber-900 dark:text-amber-200 font-bold block">
                      Sözleşme Damga Vergisi Kesintisi (488 S.K. ‰ 9,48 — Sözleşmeli Dosya)
                    </span>
                    <span className="text-[10.5px] text-amber-800/80 dark:text-amber-300/80">
                      Dosyada sözleşme düzenlendiği için (488 S.K. Tablo I/A-1) KDV hariç sözleşme bedeli üzerinden binde 9,48 sözleşme damga vergisi otomatik bağlıdır.
                    </span>
                  </div>
                </label>
              ) : (
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>
                    <strong>Sözleşme Damga Vergisi (‰ 9,48):</strong> Dosyada sözleşme bulunmadığı için (Sipariş Usulü) tahsil edilmez.
                  </span>
                  <span className="font-bold text-slate-500 shrink-0 ml-2">0,00 ₺ (Sözleşme Yok)</span>
                </div>
              )
            ) : (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sozlesmeVarMi}
                  onChange={(e) => setSozlesmeVarMi(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  Sözleşme Damga Vergisi Kesintisi Yap (Binde 9,48 — Sözleşmeli Alım)
                </span>
              </label>
            )}

            {/* 3. İhale Karar Pulu — Yalnızca İhale dosyalarında geçerlidir */}
            {isDogrudanTemin ? (
              <div className="p-2.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-800/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  <strong>İhale Karar Pulu (‰ 5,69):</strong> Doğrudan temin (4734 Md. 22) bir ihale usulü olmadığından karar pulu kesilmez.
                </span>
              </div>
            ) : (
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kararPuluHesaplansinMi}
                  onChange={(e) => setKararPuluHesaplansinMi(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                  İhale Komisyonu Karar Pulu Kesintisi Yap (Binde 5,69)
                </span>
              </label>
            )}
          </div>
        </div>

        {/* Sağ Kolon: Tahakkuk Cetveli Özeti */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Resmî Tahakkuk & Kesinti Cetveli</span>
              <span className="text-xs font-normal text-slate-400">
                {isDogrudanTemin ? 'Doğrudan Temin 5018 ÖEB Cetveli' : '5018 İhale ÖEB Ek Cetveli'}
              </span>
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Brüt Tutar (KDV Hariç Matrah):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">{formatCurrency(brutTutar)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Hesaplanan KDV (%{kdvOrani}):</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{formatCurrency(kdvTutari)}</span>
              </div>

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Fatura Genel Toplamı (KDV Dahil Brüt):</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {formatCurrency(brutTutar + kdvTutari)}
                </span>
              </div>

              {tevkifatOrani > 0 && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 bg-purple-50/50 dark:bg-purple-950/20 px-2 rounded-lg text-purple-900 dark:text-purple-300">
                  <span>Tevkif Edilen KDV ({tevkifatOrani}/10 - Vergi Dairesine):</span>
                  <span className="font-bold text-rose-600 dark:text-rose-400">-{formatCurrency(tevkifEdilenKdv)}</span>
                </div>
              )}

              {odemeDamgaVergisiUygula && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 px-2 text-slate-700 dark:text-slate-300">
                  <span>Ödeme Emri / Fatura Damga Vergisi (‰ 9,48):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(odemeDamgaVergisi)}</span>
                </div>
              )}

              {effectiveSozlesmeVar && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 px-2 text-slate-700 dark:text-slate-300">
                  <span>Sözleşme Damga Vergisi (‰ 9,48):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(sozlesmeDamgaVergisi)}</span>
                </div>
              )}

              {effectiveKararPuluVar && (
                <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 px-2 text-slate-700 dark:text-slate-300">
                  <span>İhale Komisyonu Karar Pulu (‰ 5,69):</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">-{formatCurrency(kararPulu)}</span>
                </div>
              )}

              <div className="flex justify-between py-2 border-b border-slate-100 dark:border-slate-800 font-bold text-rose-600 dark:text-rose-400">
                <span>Toplam Yasal Kesintiler:</span>
                <span>-{formatCurrency(toplamKesinti)}</span>
              </div>
            </div>
          </div>

          {/* Net Tutar Vurgusu */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-sky-500/10 border border-emerald-500/20 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                Hak Sahibine Ödenecek Net Tutar
              </div>
              <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                {formatCurrency(toplamAlacakliyaOdenecek)}
              </div>
            </div>
            <div className="text-right text-[10px] text-slate-500">
              5018 Sayılı Kanun Uyarınca<br />ÖEB Düzenlemeye Esas
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
