import React from 'react'
import { ImzaciSatiri } from '../types'

interface SignatureBlockProps {
  signers: ImzaciSatiri[]
}

export const SignatureBlock: React.FC<SignatureBlockProps> = ({ signers }) => {
  // İmzacılar onay/yetkili durumuna göre sağa veya eşit sütunlara dağıtılır
  const onaylayanlar = signers.filter((s) => s.imzaTipi === 'Onay')
  const hazirlayanVeKontrol = signers.filter((s) => s.imzaTipi !== 'Onay')

  return (
    <div className="w-full mt-8 pt-4 border-t border-slate-300">
      {/* Paraf ve Hazırlayan/Kontrol Edenler */}
      {hazirlayanVeKontrol.length > 0 && (
        <div className="mb-6">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
            İnceleyen &amp; Paraflayanlar
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {hazirlayanVeKontrol.map((s) => (
              <div
                key={s.id}
                className="border border-dashed border-slate-300 rounded p-2 text-center bg-slate-50/50"
              >
                <div className="text-[10px] font-bold text-slate-700">{s.adSoyad || 'İsimsiz'}</div>
                <div className="text-[9px] text-slate-500">{s.unvan || 'Unvan'}</div>
                <div className="text-[9px] font-semibold text-blue-800 mt-0.5">[{s.imzaTipi}]</div>
                <div className="h-8 border-b border-dotted border-slate-300 mt-1 mb-1 flex items-end justify-center">
                  <span className="text-[8px] text-slate-400 italic">
                    {s.parafVar ? 'Paraf / Islak İmza' : 'Görüş'}
                  </span>
                </div>
                {s.tarihVar && <div className="text-[8px] text-slate-400">.../.../202...</div>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Onay Makamı (Sağa Hizalı Klasik Resmî Yazı İmzası) */}
      {onaylayanlar.length > 0 && (
        <div className="flex justify-end mt-4">
          <div className="space-y-4">
            {onaylayanlar.map((s) => (
              <div key={s.id} className="min-w-[180px] text-center">
                <div className="text-[10px] font-bold text-slate-800 tracking-wide uppercase">
                  ( O N A Y )
                </div>
                <div className="h-10 my-1 flex items-center justify-center">
                  <span className="text-[9px] text-slate-400 border border-slate-200 border-dashed px-3 py-1 rounded">
                    Mühür / Islak İmza Alanı
                  </span>
                </div>
                <div className="text-[11px] font-bold text-slate-900">
                  {s.adSoyad || 'Adı Soyadı'}
                </div>
                <div className="text-[10px] text-slate-600 font-medium">
                  {s.unvan || 'Harcama Yetkilisi'}
                </div>
                {s.tarihVar && (
                  <div className="text-[9px] text-slate-400 mt-0.5">Tarih: .../.../202...</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
