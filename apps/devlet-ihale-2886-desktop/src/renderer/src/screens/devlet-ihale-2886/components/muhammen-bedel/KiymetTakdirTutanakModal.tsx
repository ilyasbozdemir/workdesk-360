import React, { useState } from 'react'
import { FileCheck, Check, Copy } from 'lucide-react'
import {
  MuhammenBedelHesabi,
  IslemTuru2886,
  TasinmazBilgisi,
  KiymetTakdirKomisyonUyesi
} from '../../types/devletIhale2886.types'

interface KiymetTakdirTutanakModalProps {
  isOpen: boolean
  onClose: () => void
  hesap: MuhammenBedelHesabi
  islemTuru: IslemTuru2886
  tasinmaz: TasinmazBilgisi
  komisyonUyeleri: KiymetTakdirKomisyonUyesi[]
  formatMoney: (n: number) => string
}

export const KiymetTakdirTutanakModal: React.FC<KiymetTakdirTutanakModalProps> = ({
  isOpen,
  onClose,
  hesap,
  islemTuru,
  tasinmaz,
  komisyonUyeleri,
  formatMoney
}) => {
  const [copied, setCopied] = useState(false)

  if (!isOpen) return null

  const tutanakText = `T.C.
KIYMET TAKDİR KOMİSYONU KARARI
(2886 Sayılı Devlet İhale Kanunu Madde 9 Uyarınca)

Karar No     : ${hesap.kararNo || '2026/KTK-01'}
Karar Tarihi : ${hesap.kararTarihi || new Date().toLocaleDateString('tr-TR')}
İşlem Türü   : ${islemTuru.toUpperCase()}

1. TAŞINMAZ BİLGİLERİ:
- İli/İlçesi       : ${tasinmaz.il} / ${tasinmaz.ilce}
- Mahalle/Köy      : ${tasinmaz.mahalleKoy}
- Ada / Parsel     : ${tasinmaz.ada} / ${tasinmaz.parsel}
- Yüzölçümü        : ${tasinmaz.yuzolcumuM2} m²
- Cinsi / Niteliği : ${tasinmaz.cinsi}
- Hisse Durumu     : ${tasinmaz.hisseOrani}
- Adres            : ${tasinmaz.adres}

2. EMSAL ARAŞTIRMALARI VE DEĞERLEME:
Komisyonumuzca yapılan mahallinde inceleme, çevre rayiçleri ve resmi oda araştırmaları neticesinde ortalama birim m² bedeli ₺${formatMoney(hesap.birimFiyatM2)} olarak tespit edilmiştir.

3. TAKDİR EDİLEN MUHAMMEN BEDEL VE GEÇİCİ TEMİNAT:
- Takdir Edilen Muhammen Bedel : ₺${formatMoney(hesap.takdirEdilenMuhammenBedel)} (${tasinmaz.yuzolcumuM2} m² karşılığı)
- Geçici Teminat Oranı (%${hesap.geciciTeminatOrani}) : ₺${formatMoney(hesap.geciciTeminatTutari)}

4. KOMİSYON HEYETİ:
${komisyonUyeleri.map((u) => `- [${u.gorev === 'Baskan' ? 'BAŞKAN' : 'ÜYE'}] ${u.adSoyad} (${u.unvan})`).join('\n')}

Yukarıda vasıfları belirtilen taşınmazın 2886 sayılı Devlet İhale Kanunu kapsamında ihaleye çıkarılması için muhammen bedeli oybirliğiyle takdir ve imza altına alınmıştır.`

  const handleCopyTutanak = (): void => {
    navigator.clipboard.writeText(tutanakText)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-blue-600" />
            Kıymet Takdir Komisyon Karar Tutanağı Önizleme
          </h4>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto font-mono text-xs p-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 whitespace-pre-wrap leading-relaxed text-slate-800 dark:text-slate-200 select-all">
          {tutanakText}
        </div>

        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
          <button
            type="button"
            onClick={handleCopyTutanak}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Kopyalandı!' : 'Metni Kopyala'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  )
}
