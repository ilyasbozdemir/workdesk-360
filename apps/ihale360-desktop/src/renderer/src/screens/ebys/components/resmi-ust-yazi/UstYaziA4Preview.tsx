import React from 'react'
import { useResmiUstYazi } from './useResmiUstYazi'

type PreviewProps = ReturnType<typeof useResmiUstYazi>

export function UstYaziA4Preview(props: PreviewProps): React.JSX.Element {
  const {
    sheetRef,
    solLogo,
    sagLogo,
    antetLines,
    detsis,
    yil,
    sayisi,
    konu,
    tarih,
    formatTrDate,
    dagitimli,
    muhatap,
    ilgiLines,
    aciklamaParagraphs,
    imzaList,
    eimza,
    kalemList,
    fiyat,
    firma,
    ekLines,
    geregLines,
    bilgiLines,
    rota,
    kod,
    kurumici,
    adres,
    web,
    eposta,
    kep,
    hazad,
    hazun,
    haztel
  } = props

  return (
    <div className="flex-1 overflow-auto p-6 md:p-8 flex justify-center bg-slate-200/70 dark:bg-slate-950 custom-scrollbar">
      {/* A4 Sheet Container */}
      <div
        ref={sheetRef}
        className="bg-white text-black shadow-2xl rounded-xs p-[2cm_1.5cm_3cm_1.5cm] w-[210mm] min-h-[297mm] h-fit relative select-text"
        style={{
          fontFamily: "'Times New Roman', 'Liberation Serif', Times, serif",
          fontSize: '12pt',
          lineHeight: '1.5'
        }}
      >
        {/* Antet */}
        <table className="w-full border-collapse mb-5 min-h-[80px]">
          <tbody>
            <tr>
              <td className="w-[90px] align-top p-0">
                {solLogo && (
                  <img
                    src={solLogo}
                    alt="Sol Logo"
                    className="max-w-[80px] max-h-[80px] object-contain"
                  />
                )}
              </td>
              <td className="text-center font-bold leading-tight align-top p-0">
                {antetLines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </td>
              <td className="w-[90px] text-right align-top p-0">
                {sagLogo && (
                  <img
                    src={sagLogo}
                    alt="Sağ Logo"
                    className="max-w-[80px] max-h-[80px] object-contain ml-auto"
                  />
                )}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Sayı, Konu, Tarih */}
        <div className="flex justify-between mb-5">
          <div>
            <table className="border-collapse">
              <tbody>
                <tr>
                  <td className="font-bold whitespace-nowrap pr-2.5 py-0.5">Sayı</td>
                  <td className="py-0.5">
                    : {detsis || '........'}-{yil || '....'}/{sayisi || '....'}
                  </td>
                </tr>
                <tr>
                  <td className="font-bold whitespace-nowrap pr-2.5 py-0.5">Konu</td>
                  <td className="py-0.5">: {konu || '[Konu]'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="font-bold text-right">Tarih: {formatTrDate(tarih) || '__.__.20__'}</div>
        </div>

        {/* Muhatap */}
        <div className={`my-4 font-bold ${dagitimli ? 'text-center' : 'indent-10'}`}>
          {dagitimli ? 'DAĞITIM YERLERİNE' : muhatap || '[Muhatap]'}
        </div>

        {/* İlgiler */}
        {ilgiLines.map((line, idx) => (
          <p key={idx} className="pl-[74px] -indent-[74px] m-0">
            {idx === 0 ? 'İlgi   : ' : '        '}
            {ilgiLines.length > 1 ? `${String.fromCharCode(97 + idx)}) ` : ''}
            {line}
          </p>
        ))}

        {/* Açıklama Metni */}
        <div className="mt-3 space-y-3">
          {aciklamaParagraphs.map((par, idx) => (
            <p key={idx} className="indent-10 text-justify m-0 whitespace-pre-wrap">
              {par}
            </p>
          ))}
        </div>

        {/* İmzalar */}
        {imzaList.length === 1 && (
          <div className="mt-8 ml-auto w-[48%] text-center">
            {eimza ? (
              <div className="text-[9pt] italic mb-1 text-slate-600">e-imzalıdır</div>
            ) : (
              <div className="h-16" />
            )}
            {imzaList[0].g && (
              <b>
                {imzaList[0].g}
                <br />
              </b>
            )}
            {imzaList[0].a}
            <br />
            {imzaList[0].u}
          </div>
        )}

        {imzaList.length > 1 && (
          <table className="w-full border-collapse my-6 text-center break-inside-avoid">
            <tbody>
              <tr>
                {imzaList.map((im, idx) => (
                  <td
                    key={idx}
                    style={{ width: `${100 / imzaList.length}%` }}
                    className="align-top text-[10pt] p-1 leading-snug"
                  >
                    {eimza ? (
                      <div className="text-[9pt] italic mb-1 text-slate-600">e-imzalıdır</div>
                    ) : (
                      <div className="h-10" />
                    )}
                    {im.g && (
                      <b>
                        {im.g}
                        <br />
                      </b>
                    )}
                    {im.a}
                    <br />
                    {im.u}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        )}

        {/* Kalemler Tablosu */}
        {kalemList.length > 0 && (
          <table className="w-full border-collapse mt-5 text-[10pt] border border-black">
            <thead>
              <tr className="bg-slate-100">
                <th className="border border-black p-1.5 text-center w-[6%]">Sıra</th>
                <th className="border border-black p-1.5 text-left w-[36%]">
                  Malzeme / Hizmet Adı
                </th>
                <th className="border border-black p-1.5 text-left w-[24%]">Özelliği</th>
                <th className="border border-black p-1.5 text-center w-[12%]">Birimi</th>
                <th className="border border-black p-1.5 text-right w-[12%]">Miktarı</th>
                {fiyat && (
                  <>
                    <th className="border border-black p-1.5 text-center">Birim Fiyatı</th>
                    <th className="border border-black p-1.5 text-center">Tutarı</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {kalemList.map((row, idx) => (
                <tr key={idx}>
                  <td className="border border-black p-1.5 text-center">{idx + 1}</td>
                  <td className="border border-black p-1.5">{row[0] || ''}</td>
                  <td className="border border-black p-1.5">{row[1] || ''}</td>
                  <td className="border border-black p-1.5 text-center">{row[2] || ''}</td>
                  <td className="border border-black p-1.5 text-right">{row[3] || ''}</td>
                  {fiyat && (
                    <>
                      <td className="border border-black p-1.5"></td>
                      <td className="border border-black p-1.5 h-8"></td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Firma İmza / Kaşe Bloğu */}
        {firma && (
          <div className="mt-6 flex justify-between text-[11pt] leading-normal">
            <div className="italic text-slate-700">Para Birimi: Türk Lirası (TL)</div>
            <div className="text-right">
              Tarih: .…../.…../20…
              <br />
              Kaşe:
              <br />
              <br />
              İmza:
            </div>
          </div>
        )}

        {/* Ekler */}
        {ekLines.length > 0 && (
          <div className="mt-5">
            <b>EK:</b>
            {ekLines.map((line, idx) => (
              <p key={idx} className="pl-5 m-0">
                {ekLines.length > 1 ? `${idx + 1}) ` : ''}
                {line}
              </p>
            ))}
          </div>
        )}

        {/* Dağıtım */}
        {(geregLines.length > 0 || bilgiLines.length > 0) && (
          <div className="mt-5">
            <b>DAĞITIM:</b>
            {geregLines.length > 0 && (
              <div className="pl-5">
                <b>Gereği:</b>
                {geregLines.map((line, idx) => (
                  <p key={idx} className="m-0">
                    - {line}
                  </p>
                ))}
              </div>
            )}
            {bilgiLines.length > 0 && (
              <div className="pl-5 mt-1">
                <b>Bilgi:</b>
                {bilgiLines.map((line, idx) => (
                  <p key={idx} className="m-0">
                    - {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Paraf & e-İmza Dipnotu */}
        {!eimza ? (
          <div className="flex flex-wrap gap-6 mt-7 text-[11pt] leading-tight">
            {rota
              .filter((r) => r.t === 'Hazırlayan' || r.t === 'Paraf')
              .map((r, idx) => (
                <div key={idx} className="min-w-[110px] text-center">
                  <i className="block h-6 border-b border-black mb-1" />
                  {r.a || '…'}
                  <br />
                  <span className="text-[9pt]">{r.u || ''}</span>
                </div>
              ))}
          </div>
        ) : (
          <div className="mt-8 pt-2 border-t border-black text-[10pt] leading-normal">
            Bu belge, 5070 sayılı Elektronik İmza Kanunu çerçevesinde güvenli elektronik imza ile
            imzalanmıştır.
            <br />
            Belge Doğrulama Kodu: <span className="font-mono">{kod}</span>
          </div>
        )}

        {/* Alt Bilgi */}
        {!kurumici && (
          <div className="absolute bottom-0 left-0 w-full px-[1.5cm] pb-[1cm]">
            <hr className="border-0 border-t border-red-500 mb-1.5" />
            <table className="w-full border-collapse text-[8pt] text-slate-700 leading-tight">
              <tbody>
                <tr>
                  <td className="align-top">
                    Adres: {adres}
                    <br />
                    Elektronik Ağ: {web}
                    <br />
                    E-Posta: {eposta}
                    <br />
                    KEP: {kep}
                  </td>
                  <td className="text-right align-top">
                    Bilgi İçin: {hazad}
                    <br />
                    {hazun}
                    <br />
                    Telefon No: {haztel}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
