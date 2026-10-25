import React from 'react'
import {
  ArrowLeft,
  Briefcase,
  Building,
  Edit,
  FileText,
  Mail,
  Phone,
  QrCode,
  Shield,
  UserCheck
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Personel, Rol } from '../personel.hooks'
import { PersonelUnvanGecmisiCard } from './PersonelUnvanGecmisiCard'

interface PersonelDetailViewProps {
  viewingPersonel: Personel
  rollerList: Rol[]
  vcardQrUrl: string | null
  closeView: () => void
  openForm: (e?: React.MouseEvent, personel?: Personel) => void
}

export function PersonelDetailView({
  viewingPersonel,
  rollerList,
  vcardQrUrl,
  closeView,
  openForm
}: PersonelDetailViewProps): React.JSX.Element {
  const rolesOfViewingPerson = rollerList.filter(
    (r) => r.varsayilan_personel_id === viewingPersonel.id
  )

  return (
    <div className="p-8 max-w-[1600px] mx-auto flex flex-col gap-6 w-full animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full">
      {/* Üst Kısım */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <Button
          variant="ghost"
          onClick={closeView}
          className="w-fit text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 pl-0 hover:bg-transparent"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Personel Listesine Dön
        </Button>

        <Button
          onClick={(e) => openForm(e, viewingPersonel)}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-md w-full sm:w-auto flex items-center justify-center"
        >
          <Edit className="w-4 h-4 mr-2" />
          Personeli Düzenle
        </Button>
      </div>

      {/* 3 Sütunlu Izgara Yapısı (Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sol Kolon: Profil Özeti ve QR Kartı */}
        <div className="flex flex-col gap-6">
          {/* Profil Bilgisi Kartı */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-full overflow-hidden shrink-0 border-4 border-slate-100 dark:border-slate-800 shadow-md mb-4">
              {viewingPersonel.avatar ? (
                <img
                  src={viewingPersonel.avatar}
                  alt={viewingPersonel.ad_soyad}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-3xl uppercase">
                  {viewingPersonel.ad_soyad.slice(0, 2)}
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1 leading-snug">
              {viewingPersonel.ad_soyad}
            </h2>
            <div className="flex flex-col items-center gap-1 mb-3">
              <p className="text-sm font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1.5 justify-center">
                <Briefcase className="w-4 h-4 shrink-0 text-blue-500" />
                {viewingPersonel.unvan || 'Kadro Unvanı Yok'}
              </p>
              {viewingPersonel.gorev && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 font-semibold">
                  Görev: {viewingPersonel.gorev}
                </span>
              )}
            </div>
            {viewingPersonel.birim && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-50 dark:bg-slate-950/40 text-xs font-semibold rounded-full border border-slate-150 dark:border-slate-850 text-slate-600 dark:text-slate-350">
                <Building className="w-3.5 h-3.5" />
                {viewingPersonel.birim}
              </span>
            )}
          </div>

          {/* QR Kartı */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-900 dark:to-slate-900/70 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3 flex items-center gap-1.5">
              <QrCode className="w-4 h-4 text-blue-500" />
              Kişi Kartı (vCard)
            </h3>
            {vcardQrUrl ? (
              <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 mb-3 animate-in zoom-in-95 duration-300">
                <img src={vcardQrUrl} alt="vCard QR Code" className="w-44 h-44 object-contain" />
              </div>
            ) : (
              <div className="w-44 h-44 bg-slate-100 dark:bg-slate-950 rounded-2xl flex items-center justify-center animate-pulse mb-3">
                <span className="text-[10px] text-slate-400">Yükleniyor...</span>
              </div>
            )}
            <p className="text-[10px] text-slate-450 dark:text-slate-400 leading-relaxed font-medium max-w-[220px]">
              Telefonunuzun kamerasından bu karekodu okutarak personeli rehbere&nbsp;
              <strong>anında kaydedebilirsiniz.</strong>
            </p>
          </div>
        </div>

        {/* Sağ Kolon: Detaylı Bilgiler ve Yetkiler */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Detay Kartı */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <FileText className="w-4 h-4 text-blue-500" />
              Kadro ve İletişim Bilgileri
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kadro / Meslek Unvanı
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {viewingPersonel.unvan || '-'}
                </span>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kurum İçi / İhale Görevi
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {viewingPersonel.gorev || '-'}
                </span>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Birim / Müdürlük
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {viewingPersonel.birim || '-'}
                </span>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Kurum Sicil Numarası
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                  {viewingPersonel.sicil_no || '-'}
                </span>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3 h-3 text-emerald-500" />
                  Telefon Numarası
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {viewingPersonel.telefon || '-'}
                </span>
              </div>

              <div className="p-4 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-150 dark:border-slate-850 rounded-2xl flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="w-3 h-3 text-blue-500" />
                  E-Posta Adresi
                </span>
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  {viewingPersonel.eposta || '-'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 text-xs text-slate-500">
              <UserCheck className="w-4 h-4 text-emerald-500" />
              <span>
                Durum:{' '}
                <strong
                  className={viewingPersonel.aktif_mi ? 'text-emerald-600' : 'text-slate-400'}
                >
                  {viewingPersonel.aktif_mi ? 'Aktif Görevde' : 'Pasif'}
                </strong>
              </span>
            </div>
          </div>

          {/* Unvan & Görev Tarihçesi */}
          {viewingPersonel.id && <PersonelUnvanGecmisiCard personel={viewingPersonel} />}

          {/* Şablon Yetkileri / Görevleri Kartı */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
              <Shield className="w-4 h-4 text-blue-500" />
              Varsayılan İhale / Belge Rolleri
            </h3>

            {rolesOfViewingPerson.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rolesOfViewingPerson.map((role) => (
                  <div
                    key={role.rol_kodu}
                    className="p-3 bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 rounded-2xl flex flex-col gap-1"
                  >
                    <span className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5" />
                      {role.rol_adi}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                      {role.aciklama}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Bu personele şablonlarda otomatik atanmış herhangi bir varsayılan rol
                bulunmamaktadır.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
