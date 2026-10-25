import React from 'react'
import { QrCode, Printer, CheckCircle } from 'lucide-react'
import { SignatureBlock } from './signature-block'
import { ImzaciSatiri, IslakImzaBelgeBilgileri } from '../types'

interface A4PreviewProps {
  bilgiler: IslakImzaBelgeBilgileri
  signers: ImzaciSatiri[]
  onPrintPreview?: () => void
}

export const A4Preview: React.FC<A4PreviewProps> = ({ bilgiler, signers, onPrintPreview }) => {
  return (
    <div className="flex flex-col items-center">
      {/* A4 Kağıdı Efekti */}
      <div className="w-full max-w-[650px] min-h-[842px] bg-white text-slate-900 border border-slate-300 rounded-sm shadow-xl p-8 flex flex-col justify-between relative text-xs font-serif leading-relaxed select-text">
        {/* Antet / Üst Başlık */}
        <div>
          <div className="text-center space-y-1 mb-6 border-b border-slate-200 pb-4">
            <div className="font-bold text-[12px] uppercase tracking-wider text-slate-800">
              T.C.
            </div>
            <div className="font-bold text-[11px] uppercase text-slate-700">
              {bilgiler.muhatap || 'İLGİLİ KAMU KURUMU'}
            </div>
            <div className="text-[10px] text-slate-500 font-sans">
              Doğrudan Temin Satınalma ve İhale Servisi
            </div>
          </div>

          {/* Sayı, Konu, Tarih */}
          <div className="grid grid-cols-2 text-[11px] font-sans mb-6">
            <div className="space-y-1">
              <div>
                <span className="font-bold text-slate-600">Sayı: </span>
                <span className="font-mono">{bilgiler.belgeSayisi}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Konu: </span>
                <span>{bilgiler.konu}</span>
              </div>
              {bilgiler.ekSayisi > 0 && (
                <div>
                  <span className="font-bold text-slate-600">Ek: </span>
                  <span>{bilgiler.ekSayisi} Adet Belge</span>
                </div>
              )}
            </div>

            <div className="text-right space-y-1">
              <div>
                <span className="font-bold text-slate-600">Tarih: </span>
                <span>{bilgiler.tarih}</span>
              </div>
              {bilgiler.aciliyet !== 'Normal' && (
                <div className="text-rose-600 font-bold uppercase text-[10px]">
                  *** {bilgiler.aciliyet} ***
                </div>
              )}
            </div>
          </div>

          {/* Muhatap / Hitap */}
          <div className="my-6 text-center font-bold text-[12px]">
            {bilgiler.hitap || 'Sayın Makama'}
          </div>

          {/* Belge Gövdesi */}
          <div className="text-justify indent-6 space-y-3 font-serif text-[11.5px] leading-relaxed text-slate-850 min-h-[140px]">
            <p>{bilgiler.icerikGovde}</p>
            <p>
              4734 Sayılı Kamu İhale Kanununun 22/d maddesi gereğince yapılan alım kapsamında tanzim
              edilen evraklar incelenmiş olup, gereğini ve tensiplerinizi arz ederim.
            </p>
          </div>
        </div>

        {/* Alt Kısım: İmza Bloğu & Barkod/QR */}
        <div>
          <SignatureBlock signers={signers} />

          {/* Barkod / Doğrulama Altlığı (Placeholder) */}
          <div className="mt-8 pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-sans">
            <div className="flex items-center gap-1.5">
              <QrCode className="w-5 h-5 text-slate-500" />
              <div>
                <span className="font-semibold text-slate-600">Belge Doğrulama Kodu: </span>
                <span className="font-mono">DT-2026-X892-K99</span>
                <div className="text-[8px] text-slate-400">
                  Bu belge fiziki ıslak imza için sistem tarafından üretilmiştir.
                </div>
              </div>
            </div>
            <div className="text-right">Sayfa 1 / 1</div>
          </div>
        </div>
      </div>
    </div>
  )
}
