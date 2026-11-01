import React from 'react'
import {
  FileText,
  Printer,
  Copy,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react'
import { useResmiUstYazi } from './useResmiUstYazi'

type FormProps = ReturnType<typeof useResmiUstYazi>

export function UstYaziFormPanel(props: FormProps): React.JSX.Element {
  const {
    templateKey,
    antet,
    setAntet,
    solLogo,
    sagLogo,
    detsis,
    setDetsis,
    yil,
    setYil,
    sayisi,
    setSayisi,
    konu,
    setKonu,
    tarih,
    setTarih,
    dagitimli,
    setDagitimli,
    muhatap,
    setMuhatap,
    ilgi,
    setIlgi,
    aciklama,
    setAciklama,
    imzalar,
    setImzalar,
    eimza,
    setEimza,
    kod,
    setKod,
    kalemler,
    setKalemler,
    fiyat,
    setFiyat,
    firma,
    setFirma,
    ek,
    setEk,
    gereg,
    setGereg,
    bilgi,
    setBilgi,
    kurumici,
    setKurumici,
    adres,
    setAdres,
    web,
    setWeb,
    eposta,
    setEposta,
    kep,
    setKep,
    hazad,
    setHazad,
    hazun,
    setHazun,
    haztel,
    setHaztel,
    copyToast,
    openSections,
    toggleSection,
    handlePresetChange,
    handleLogoUpload,
    handlePrint,
    handleCopyText
  } = props

  return (
    <aside className="w-full lg:w-[420px] xl:w-[460px] border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-full shrink-0 overflow-hidden shadow-xs">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold text-slate-900 dark:text-white">
              Resmî Üst Yazı Düzenleyici
            </h2>
            <p className="text-[10px] text-slate-500">Yönetmelik 2646 &amp; EYP 2.0 Uyumlu</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={templateKey}
            onChange={(e) => handlePresetChange(e.target.value as 'arastirma' | 'bos')}
            className="text-xs font-semibold py-1 px-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 shadow-2xs cursor-pointer outline-none"
          >
            <option value="arastirma" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              Şablon: Fiyat Araştırması
            </option>
            <option value="bos" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
              Şablon: Boş Standart Üst Yazı
            </option>
          </select>
        </div>
      </div>

      {/* Accordion Form Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs custom-scrollbar">
        {/* 1. Antet ve Logo */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => toggleSection('antet')}
            className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
          >
            <span>1. Antet &amp; Logolar</span>
            {openSections.antet ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.antet && (
            <div className="p-3 pt-0 space-y-3 border-t border-slate-200 dark:border-slate-800/60 mt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  İdari Antet Başlığı (Her satır ortalanır)
                </label>
                <textarea
                  rows={4}
                  value={antet}
                  onChange={(e) => setAntet(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-slate-500">Sol Logo</label>
                    {solLogo && (
                      <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Yüklü
                      </span>
                    )}
                  </div>
                  {solLogo && (
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <img
                        src={solLogo}
                        alt="Sol Logo"
                        className="w-8 h-8 object-contain rounded bg-white p-0.5 border border-slate-200 dark:border-slate-700"
                      />
                      <span className="text-[10px] text-slate-500 truncate">Kurum / Sol Logo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'sol')}
                    className="text-[10px] w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-800 dark:file:text-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-medium text-slate-500">Sağ Logo</label>
                    {sagLogo && (
                      <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                        Yüklü
                      </span>
                    )}
                  </div>
                  {sagLogo && (
                    <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                      <img
                        src={sagLogo}
                        alt="Sağ Logo"
                        className="w-8 h-8 object-contain rounded bg-white p-0.5 border border-slate-200 dark:border-slate-700"
                      />
                      <span className="text-[10px] text-slate-500 truncate">Sağ Logo</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleLogoUpload(e, 'sag')}
                    className="text-[10px] w-full file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:bg-slate-200 dark:file:bg-slate-800 file:text-slate-800 dark:file:text-slate-200"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 2. Sayı, Konu, Tarih */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => toggleSection('sayi')}
            className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
          >
            <span>2. Sayı, Konu &amp; Tarih</span>
            {openSections.sayi ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.sayi && (
            <div className="p-3 pt-0 space-y-2.5 border-t border-slate-200 dark:border-slate-800/60 mt-1">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    DETSİS
                  </label>
                  <input
                    type="text"
                    value={detsis}
                    onChange={(e) => setDetsis(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Yıl</label>
                  <input
                    type="text"
                    value={yil}
                    onChange={(e) => setYil(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Evrak No
                  </label>
                  <input
                    type="text"
                    value={sayisi}
                    onChange={(e) => setSayisi(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Konu</label>
                  <input
                    type="text"
                    value={konu}
                    onChange={(e) => setKonu(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Tarih</label>
                  <input
                    type="date"
                    value={tarih}
                    onChange={(e) => setTarih(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 3. Muhatap, İlgiler ve Metin */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => toggleSection('muhatap')}
            className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
          >
            <span>3. Muhatap, İlgiler &amp; Metin</span>
            {openSections.muhatap ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.muhatap && (
            <div className="p-3 pt-0 space-y-2.5 border-t border-slate-200 dark:border-slate-800/60 mt-1">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-500">Muhatap</label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-600 dark:text-slate-400">
                    <input
                      type="checkbox"
                      checked={dagitimli}
                      onChange={(e) => setDagitimli(e.target.checked)}
                      className="rounded text-blue-600"
                    />
                    <span>Dağıtımlı Yazı</span>
                  </label>
                </div>
                {!dagitimli && (
                  <input
                    type="text"
                    value={muhatap}
                    onChange={(e) => setMuhatap(e.target.value)}
                    placeholder="Örn: ANKARA İL SAĞLIK MÜDÜRLÜĞÜNE"
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                )}
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  İlgiler (Her satıra bir ilgi maddesi)
                </label>
                <textarea
                  rows={2}
                  value={ilgi}
                  onChange={(e) => setIlgi(e.target.value)}
                  placeholder="Örn: 12.01.2026 tarihli ve 456 sayılı yazınız."
                  className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Yazı Metni (Açıklama / Gövde)
                </label>
                <textarea
                  rows={6}
                  value={aciklama}
                  onChange={(e) => setAciklama(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. İmza & Doğrulama Kodu */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => toggleSection('imza')}
            className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
          >
            <span>4. İmza Yetkilileri &amp; E-İmza</span>
            {openSections.imza ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.imza && (
            <div className="p-3 pt-0 space-y-2.5 border-t border-slate-200 dark:border-slate-800/60 mt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  İmza Bloğu (Görevi | Adı Soyadı | Unvanı)
                </label>
                <textarea
                  rows={3}
                  value={imzalar}
                  onChange={(e) => setImzalar(e.target.value)}
                  placeholder="Komisyon Başkanı | Ahmet YILMAZ | Mühendis"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                />
              </div>
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={eimza}
                    onChange={(e) => setEimza(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300 font-medium">
                    Elektronik İmzalıdır Şerhi
                  </span>
                </label>
                {eimza && (
                  <button
                    type="button"
                    onClick={() =>
                      setKod(
                        Math.random().toString(36).substring(2, 6).toUpperCase() +
                          '-' +
                          Math.random().toString(36).substring(2, 6).toUpperCase()
                      )
                    }
                    className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles size={11} />
                    <span>Kod Üret</span>
                  </button>
                )}
              </div>
              {eimza && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Doğrulama Kodu
                  </label>
                  <input
                    type="text"
                    value={kod}
                    onChange={(e) => setKod(e.target.value)}
                    className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 font-mono text-xs"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* 5. Kalemler Tablosu */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => toggleSection('kalemler')}
            className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
          >
            <span>5. Kalem Tablosu &amp; Fiyat Teklifi</span>
            {openSections.kalemler ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.kalemler && (
            <div className="p-3 pt-0 space-y-2 border-t border-slate-200 dark:border-slate-800/60 mt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Kalemler (Malzeme | Özelliği | Birimi | Miktarı)
                </label>
                <textarea
                  rows={4}
                  value={kalemler}
                  onChange={(e) => setKalemler(e.target.value)}
                  placeholder="A4 Kağıdı | 80 gr | Kutu | 50"
                  className="w-full p-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs font-mono"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={fiyat}
                    onChange={(e) => setFiyat(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300">
                    Fiyat Sütunları
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={firma}
                    onChange={(e) => setFirma(e.target.checked)}
                    className="rounded text-blue-600"
                  />
                  <span className="text-[11px] text-slate-700 dark:text-slate-300">
                    Firma İmza Alanı
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* 6. Ek & Dağıtım */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => toggleSection('ek')}
            className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
          >
            <span>6. Ekler &amp; Dağıtım Listesi</span>
            {openSections.ek ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.ek && (
            <div className="p-3 pt-0 space-y-2 border-t border-slate-200 dark:border-slate-800/60 mt-1">
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Ekler (Her satıra bir ek)
                </label>
                <textarea
                  rows={2}
                  value={ek}
                  onChange={(e) => setEk(e.target.value)}
                  placeholder="Teknik Şartname (4 sayfa)"
                  className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Dağıtım: Gereği
                </label>
                <textarea
                  rows={2}
                  value={gereg}
                  onChange={(e) => setGereg(e.target.value)}
                  placeholder="Mali Hizmetler Birimi"
                  className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Dağıtım: Bilgi
                </label>
                <textarea
                  rows={2}
                  value={bilgi}
                  onChange={(e) => setBilgi(e.target.value)}
                  placeholder="İl Sağlık Müdürlüğü"
                  className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-xs"
                />
              </div>
            </div>
          )}
        </div>

        {/* 7. Alt Bilgi */}
        <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/40 dark:bg-slate-950/40">
          <button
            type="button"
            onClick={() => toggleSection('alt')}
            className="w-full px-3 py-2.5 flex items-center justify-between font-bold text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/50 cursor-pointer"
          >
            <span>7. İletişim Alt Bilgisi (İmza Altı)</span>
            {openSections.alt ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          {openSections.alt && (
            <div className="p-3 pt-0 space-y-2 border-t border-slate-200 dark:border-slate-800/60 mt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={kurumici}
                  onChange={(e) => setKurumici(e.target.checked)}
                  className="rounded text-blue-600"
                />
                <span className="text-[11px] text-slate-700 dark:text-slate-300">
                  Kurum içi yazı (Alt bilgi basılmaz)
                </span>
              </label>

              {!kurumici && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">
                      Adres
                    </label>
                    <input
                      type="text"
                      value={adres}
                      onChange={(e) => setAdres(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Web
                      </label>
                      <input
                        type="text"
                        value={web}
                        onChange={(e) => setWeb(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        E-Posta
                      </label>
                      <input
                        type="text"
                        value={eposta}
                        onChange={(e) => setEposta(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-500 mb-1">KEP</label>
                    <input
                      type="text"
                      value={kep}
                      onChange={(e) => setKep(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Bilgi için: Ad
                      </label>
                      <input
                        type="text"
                        value={hazad}
                        onChange={(e) => setHazad(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Unvan
                      </label>
                      <input
                        type="text"
                        value={hazun}
                        onChange={(e) => setHazun(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 mb-1">
                        Telefon
                      </label>
                      <input
                        type="text"
                        value={haztel}
                        onChange={(e) => setHaztel(e.target.value)}
                        className="w-full p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons Footer */}
      <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center gap-2">
        <button
          type="button"
          onClick={handlePrint}
          className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Printer size={14} />
          <span>Yazdır / PDF</span>
        </button>
        <button
          type="button"
          onClick={handleCopyText}
          className="flex-1 py-2 px-3 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
        >
          {copyToast ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span>Kopyalandı</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              <span>Metni Kopyala</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
