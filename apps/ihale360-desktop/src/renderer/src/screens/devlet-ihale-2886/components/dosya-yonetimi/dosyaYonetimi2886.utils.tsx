import React from 'react'

export const formatMoney = (val: number): string =>
  val ? val.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'

export const getTurBadge = (tur: string): React.JSX.Element => {
  switch (tur) {
    case 'satis':
      return (
        <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 font-bold text-[10px]">
          TAŞINMAZ / MENKUL SATIŞ
        </span>
      )
    case 'kiralama':
      return (
        <span className="px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200 font-bold text-[10px]">
          KİRALAMA İHALESİ
        </span>
      )
    case 'irtifak_hakki':
    case 'irtifak':
      return (
        <span className="px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-800 dark:text-indigo-200 font-bold text-[10px]">
          SINIRLI AYNİ HAK / İRTİFAK
        </span>
      )
    case 'trampa':
      return (
        <span className="px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 font-bold text-[10px]">
          TRAMPA (TAKAS)
        </span>
      )
    default:
      return (
        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-bold text-[10px]">
          {tur}
        </span>
      )
  }
}

export const getUsulLabel = (usul: string): string => {
  if (usul === 'acik_teklif_45') return '2886 / Md. 45 (Açık Teklif)'
  if (usul === 'kapali_teklif_36') return '2886 / Md. 36 (Kapalı Teklif)'
  if (usul === 'pazarlik_51') return '2886 / Md. 51 (Pazarlık Usulü)'
  return usul || 'Md. 45 Açık Teklif'
}
