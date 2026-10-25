import React from 'react'
import { FileText, Calendar, Building2, AlertCircle } from 'lucide-react'
import { BELGE_TURU_SECENEKLERI } from '../mock-data'
import { IslakImzaBelgeBilgileri } from '../types'

interface DocumentInfoFormProps {
  bilgiler: IslakImzaBelgeBilgileri
  onChange: (updated: Partial<IslakImzaBelgeBilgileri>) => void
}

export const DocumentInfoForm: React.FC<DocumentInfoFormProps> = ({ bilgiler, onChange }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
        <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
          Belge &amp; Üst Bilgi Tanımları
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Belge Türü */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Belge Türü
          </label>
          <select
            value={bilgiler.belgeTuru}
            onChange={(e) => onChange({ belgeTuru: e.target.value })}
            className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
            {BELGE_TURU_SECENEKLERI.map((tur) => (
              <option key={tur} value={tur}>
                {tur}
              </option>
            ))}
          </select>
        </div>

        {/* Belge Sayısı / Numarası (Salt Okunur Örnek) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Belge Sayısı (Sistem Kodu)
          </label>
          <input
            type="text"
            readOnly
            value={bilgiler.belgeSayisi}
            className="w-full text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-500 dark:text-slate-400 cursor-not-allowed"
          />
        </div>

        {/* Konu */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Konu
          </label>
          <input
            type="text"
            value={bilgiler.konu}
            onChange={(e) => onChange({ konu: e.target.value })}
            placeholder="Belge konusu..."
            className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Muhatap */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-500" />
            Muhatap Birim / Kurum
          </label>
          <input
            type="text"
            value={bilgiler.muhatap}
            onChange={(e) => {
              const val = e.target.value
              onChange({
                muhatap: val,
                hitap: val ? `Sayın ${val}` : ''
              })
            }}
            placeholder="Örn: Destek Hizmetleri Dairesi"
            className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Otomatik Hitap Gösterimi */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Otomatik Resmî Hitap
          </label>
          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/50 rounded-xl px-3 py-2">
            {bilgiler.hitap || 'Hitap bekleniyor...'}
          </div>
        </div>

        {/* Tarih, Aciliyet, Ek Sayısı */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            Evrak Tarihi
          </label>
          <input
            type="date"
            value={bilgiler.tarih}
            onChange={(e) => onChange({ tarih: e.target.value })}
            className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Aciliyet
            </label>
            <select
              value={bilgiler.aciliyet}
              onChange={(e) => onChange({ aciliyet: e.target.value as any })}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="Normal">Normal</option>
              <option value="Acele">Acele</option>
              <option value="Günlüdür">Günlüdür</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Ek Sayısı
            </label>
            <input
              type="number"
              min={0}
              value={bilgiler.ekSayisi}
              onChange={(e) => onChange({ ekSayisi: Number(e.target.value) || 0 })}
              className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Belge Gövde Metni */}
        <div className="md:col-span-2">
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Belge Açıklama &amp; Gövde Metni
          </label>
          <textarea
            rows={3}
            value={bilgiler.icerikGovde}
            onChange={(e) => onChange({ icerikGovde: e.target.value })}
            className="w-full text-xs font-medium bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 leading-relaxed resize-none"
          />
        </div>
      </div>
    </div>
  )
}
