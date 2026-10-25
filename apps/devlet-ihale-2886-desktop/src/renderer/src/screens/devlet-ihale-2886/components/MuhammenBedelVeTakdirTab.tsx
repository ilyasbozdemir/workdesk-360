import React, { useState } from 'react'
import {
  TasinmazBilgisi,
  KiymetTakdirKomisyonUyesi,
  EmsalArastirma,
  MuhammenBedelHesabi,
  IslemTuru2886
} from '../types/devletIhale2886.types'
import { TasinmazKunyeSection } from './muhammen-bedel/TasinmazKunyeSection'
import { KiymetTakdirKomisyonuCard } from './muhammen-bedel/KiymetTakdirKomisyonuCard'
import { EmsalArastirmalariCard } from './muhammen-bedel/EmsalArastirmalariCard'
import { MuhammenBedelHesaplamaSection } from './muhammen-bedel/MuhammenBedelHesaplamaSection'
import { KiymetTakdirTutanakModal } from './muhammen-bedel/KiymetTakdirTutanakModal'

interface MuhammenBedelVeTakdirTabProps {
  islemTuru?: IslemTuru2886
}

export function MuhammenBedelVeTakdirTab({
  islemTuru = 'satis'
}: MuhammenBedelVeTakdirTabProps): React.JSX.Element {
  const [tasinmaz, setTasinmaz] = useState<TasinmazBilgisi>({
    il: 'Ankara',
    ilce: 'Çankaya',
    mahalleKoy: 'Kızılay',
    ada: '1024',
    parsel: '12',
    yuzolcumuM2: 450,
    cinsi: islemTuru === 'kiralama' ? 'Dükkan / İşyeri' : 'Arsa (Ticari İmarlı)',
    hisseOrani: '1/1 (Tam)',
    mevcutDurumu: 'Boş',
    adres: 'Gazi Mustafa Kemal Bulvarı No: 45'
  })

  // İşlem türüne özel ek parametreler
  const [kiralamaSuresiYil, setKiralamaSuresiYil] = useState<number>(3)
  const [irtifakSuresiYil, setIrtifakSuresiYil] = useState<number>(30)
  const [hasilatPayiOrani, setHasilatPayiOrani] = useState<number>(1.5)
  const [trampaVerilenBedel, setTrampaVerilenBedel] = useState<number>(12500000)
  const [trampaAlinanBedel, setTrampaAlinanBedel] = useState<number>(14000000)

  const [emsaller, setEmsaller] = useState<EmsalArastirma[]>([
    {
      id: 'emsal-1',
      kaynak: 'Emlakçılar Odası Rayiç Bilgisi',
      tarih: new Date().toISOString().split('T')[0],
      metrekareFiyati: islemTuru === 'kiralama' ? 450 : 35000,
      aciklama: 'Bölgedeki benzer ticari nitelikli taşınmazların ortalama rayici'
    },
    {
      id: 'emsal-2',
      kaynak: 'SPK Lisanslı Değerleme Raporu',
      tarih: new Date().toISOString().split('T')[0],
      metrekareFiyati: islemTuru === 'kiralama' ? 480 : 38000,
      aciklama: 'Emsal karşılaştırma ve indirgenmiş nakit akışı yöntemli değerleme'
    }
  ])

  const [komisyonUyeleri, setKomisyonUyeleri] = useState<KiymetTakdirKomisyonUyesi[]>([
    {
      id: 'kom-1',
      adSoyad: 'Ahmet Yılmaz',
      unvan: 'Emlak ve İstimlak Şube Müdürü',
      gorev: 'Baskan'
    },
    {
      id: 'kom-2',
      adSoyad: 'Mehmet Özkan',
      unvan: 'İnşaat Mühendisi / Harita Mühendisi',
      gorev: 'Uye'
    },
    {
      id: 'kom-3',
      adSoyad: 'Ayşe Kaya',
      unvan: 'Mali Hizmetler Uzmanı',
      gorev: 'Uye'
    }
  ])

  const [hesap, setHesap] = useState<MuhammenBedelHesabi>({
    birimFiyatM2: islemTuru === 'kiralama' ? 465 : 36500,
    toplamAlanM2: 450,
    hesaplananBedel: (islemTuru === 'kiralama' ? 465 : 36500) * 450,
    takdirEdilenMuhammenBedel: (islemTuru === 'kiralama' ? 465 : 36500) * 450,
    geciciTeminatOrani: 3, // %3 yasal standart (2886 Md. 25)
    geciciTeminatTutari: ((islemTuru === 'kiralama' ? 465 : 36500) * 450 * 3) / 100,
    kdvOrani: 20,
    kararTarihi: new Date().toISOString().split('T')[0],
    kararNo: '2026/KTK-08'
  })

  const [showTutanakModal, setShowTutanakModal] = useState(false)

  const handleBirimFiyatChange = (val: number): void => {
    const calculated = val * (tasinmaz.yuzolcumuM2 || 0)
    const teminat = (calculated * hesap.geciciTeminatOrani) / 100
    setHesap((prev) => ({
      ...prev,
      birimFiyatM2: val,
      hesaplananBedel: calculated,
      takdirEdilenMuhammenBedel: calculated,
      geciciTeminatTutari: teminat
    }))
  }

  const handleTakdirBedelChange = (val: number): void => {
    const teminat = (val * hesap.geciciTeminatOrani) / 100
    setHesap((prev) => ({
      ...prev,
      takdirEdilenMuhammenBedel: val,
      geciciTeminatTutari: teminat
    }))
  }

  const handleTeminatOraniChange = (oran: number): void => {
    const teminat = (hesap.takdirEdilenMuhammenBedel * oran) / 100
    setHesap((prev) => ({
      ...prev,
      geciciTeminatOrani: oran,
      geciciTeminatTutari: teminat
    }))
  }

  const handleYuzolcumuChange = (m2: number): void => {
    setTasinmaz((prev) => ({ ...prev, yuzolcumuM2: m2 }))
    const calc = m2 * hesap.birimFiyatM2
    setHesap((prev) => ({
      ...prev,
      toplamAlanM2: m2,
      hesaplananBedel: calc,
      takdirEdilenMuhammenBedel: calc,
      geciciTeminatTutari: (calc * prev.geciciTeminatOrani) / 100
    }))
  }

  const handleAddKomisyonUyesi = (): void => {
    const yeniUye: KiymetTakdirKomisyonUyesi = {
      id: String(Date.now()),
      adSoyad: '',
      unvan: '',
      gorev: komisyonUyeleri.length === 0 ? 'Baskan' : 'Uye'
    }
    setKomisyonUyeleri((prev) => [...prev, yeniUye])
  }

  const handleRemoveKomisyonUyesi = (id: string): void => {
    setKomisyonUyeleri((prev) => prev.filter((u) => u.id !== id))
  }

  const handleAddStandartKomisyon = (): void => {
    setKomisyonUyeleri([
      {
        id: 'kom-std-1',
        adSoyad: 'Komisyon Başkanı',
        unvan: 'Harcama Yetkilisi / Şube Müdürü',
        gorev: 'Baskan'
      },
      {
        id: 'kom-std-2',
        adSoyad: 'Teknik Üye',
        unvan: 'Mimar / İnşaat Mühendisi',
        gorev: 'Uye'
      },
      {
        id: 'kom-std-3',
        adSoyad: 'Mali Üye',
        unvan: 'Mali Hizmetler Birim Temsilcisi',
        gorev: 'Uye'
      }
    ])
  }

  const handleAddEmsal = (): void => {
    const yeniEmsal: EmsalArastirma = {
      id: String(Date.now()),
      kaynak: '',
      tarih: new Date().toISOString().split('T')[0],
      metrekareFiyati: 0,
      aciklama: ''
    }
    setEmsaller((prev) => [...prev, yeniEmsal])
  }

  const handleRemoveEmsal = (id: string): void => {
    setEmsaller((prev) => prev.filter((e) => e.id !== id))
  }

  const emsalOrtalama =
    emsaller.length > 0
      ? Math.round(
          emsaller.reduce((acc, curr) => acc + (curr.metrekareFiyati || 0), 0) / emsaller.length
        )
      : 0

  const handleApplyEmsalOrtalama = (): void => {
    if (emsalOrtalama > 0) {
      handleBirimFiyatChange(emsalOrtalama)
    }
  }

  const formatMoney = (n: number): string =>
    n.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="space-y-4">
      {/* 1. Taşınmaz Künye Bilgileri */}
      <TasinmazKunyeSection
        tasinmaz={tasinmaz}
        setTasinmaz={setTasinmaz}
        islemTuru={islemTuru}
        onYuzolcumuChange={handleYuzolcumuChange}
        kiralamaSuresiYil={kiralamaSuresiYil}
        setKiralamaSuresiYil={setKiralamaSuresiYil}
        irtifakSuresiYil={irtifakSuresiYil}
        setIrtifakSuresiYil={setIrtifakSuresiYil}
        hasilatPayiOrani={hasilatPayiOrani}
        setHasilatPayiOrani={setHasilatPayiOrani}
        trampaVerilenBedel={trampaVerilenBedel}
        setTrampaVerilenBedel={setTrampaVerilenBedel}
        trampaAlinanBedel={trampaAlinanBedel}
        setTrampaAlinanBedel={setTrampaAlinanBedel}
        formatMoney={formatMoney}
      />

      {/* 2. Kıymet Takdir Komisyonu ve Emsal Araştırmaları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <KiymetTakdirKomisyonuCard
          komisyonUyeleri={komisyonUyeleri}
          setKomisyonUyeleri={setKomisyonUyeleri}
          onAddStandartKomisyon={handleAddStandartKomisyon}
          onAddKomisyonUyesi={handleAddKomisyonUyesi}
          onRemoveKomisyonUyesi={handleRemoveKomisyonUyesi}
        />

        <EmsalArastirmalariCard
          emsaller={emsaller}
          setEmsaller={setEmsaller}
          emsalOrtalama={emsalOrtalama}
          onApplyEmsalOrtalama={handleApplyEmsalOrtalama}
          onAddEmsal={handleAddEmsal}
          onRemoveEmsal={handleRemoveEmsal}
          formatMoney={formatMoney}
        />
      </div>

      {/* 3. Muhammen Bedel ve Geçici Teminat Hesap Özeti */}
      <MuhammenBedelHesaplamaSection
        hesap={hesap}
        setHesap={setHesap}
        islemTuru={islemTuru}
        tasinmaz={tasinmaz}
        emsalOrtalama={emsalOrtalama}
        formatMoney={formatMoney}
        onBirimFiyatChange={handleBirimFiyatChange}
        onTakdirBedelChange={handleTakdirBedelChange}
        onTeminatOraniChange={handleTeminatOraniChange}
        onOpenTutanakModal={() => setShowTutanakModal(true)}
      />

      {/* Karar Tutanağı Modalı */}
      <KiymetTakdirTutanakModal
        isOpen={showTutanakModal}
        onClose={() => setShowTutanakModal(false)}
        hesap={hesap}
        islemTuru={islemTuru}
        tasinmaz={tasinmaz}
        komisyonUyeleri={komisyonUyeleri}
        formatMoney={formatMoney}
      />
    </div>
  )
}
