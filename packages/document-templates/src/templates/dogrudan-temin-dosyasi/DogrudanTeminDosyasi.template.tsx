import React, { useMemo } from 'react';
import { DocumentLayout } from '../../document/DocumentLayout';
import { InstitutionalHeaderProvider } from '../../header';
import { formatDateTR, formatCurrency } from '../../utils/textHelpers';
import type { DogrudanTeminDosyasiType, KapakDetayItem } from './DogrudanTeminDosyasi.schema';

interface DogrudanTeminDosyasiProps {
  data?: Partial<DogrudanTeminDosyasiType> & Record<string, any>;
  pageSize?: 'A4' | 'A3';
  orientation?: 'portrait' | 'landscape';
  chrome?: 'full' | 'bare' | 'paper';
  isEditing?: boolean;
}

export function DogrudanTeminDosyasi({
  data = {},
  pageSize = 'A4',
  orientation = 'portrait',
  chrome = 'full',
}: DogrudanTeminDosyasiProps): React.JSX.Element {
  // 1. Antet Satırları Çözümleme (InstitutionalHeaderProvider Otoritesi)
  const antetLines: string[] = useMemo(() => {
    if (data?.antetSatirlari && Array.isArray(data.antetSatirlari) && data.antetSatirlari.length > 0) {
      return data.antetSatirlari;
    }
    try {
      const dynamicHeader = InstitutionalHeaderProvider.resolveDynamicHeader(
        (data as any)?.headerDefinition || 'standard',
        {
          settings: {
            institutionName: data?.kurumAdi,
            parentInstitution: data?.kurumUst,
            spendingUnit: (data as any)?.harcamaBirimi,
          },
          document: data,
          manual: data,
          fallbackInstitutionName: data?.kurumAdi || 'T.C. İÇİŞLERİ BAKANLIĞI',
        }
      );
      if (dynamicHeader && dynamicHeader.length > 0) {
        return dynamicHeader;
      }
    } catch {
      // Fallback
    }
    return [
      'T.C.',
      data?.kurumAdi ? String(data.kurumAdi).toLocaleUpperCase('tr-TR') : 'HARCAMA YETKİLİSİ BİRİMİ',
    ];
  }, [data]);

  // Logolar
  const ustLogo = data?.ustLogo;
  const solLogo = data?.solLogo;
  const sagLogo = data?.sagLogo;

  // 2. Kapak Başlığı
  const coverTitle = (data?.kapakBasligi || 'DOĞRUDAN TEMİN DOSYASI').toLocaleUpperCase('tr-TR');

  // 3. Tablo Detaylarının Çözümlenmesi
  const kapakDetaylari: KapakDetayItem[] = useMemo(() => {
    if (data?.kapakDetaylari && Array.isArray(data.kapakDetaylari) && data.kapakDetaylari.length > 0) {
      return data.kapakDetaylari;
    }

    const items: KapakDetayItem[] = [];

    // 1) Bütçe Yılı
    const rawDate = data?.dosyaTarihi || data?.tarih;
    const butceYili = data?.butceYili
      ? String(data.butceYili)
      : rawDate
      ? String(new Date(rawDate).getFullYear())
      : String(new Date().getFullYear());

    items.push({
      label: 'Bütçe Yılı',
      lines: [butceYili],
      isBold: true,
    });

    // 2) İşin Türü / Alım Usulü
    const rawAlimTuru = (data?.alimTuru || data?.tur || 'mal').toString().toLowerCase();
    let alimTuruText = 'Mal Alımı';
    if (rawAlimTuru.includes('hizmet')) alimTuruText = 'Hizmet Alımı';
    else if (rawAlimTuru.includes('yapim') || rawAlimTuru.includes('yapım')) alimTuruText = 'Yapım İşi';
    else if (rawAlimTuru.includes('danismanlik') || rawAlimTuru.includes('danışmanlık'))
      alimTuruText = 'Danışmanlık Hizmet Alımı';

    const rawTeminSekli = (data?.teminSekli || data?.usul || '22/d').toString();
    let usulText = '4734 Sayılı KİK Madde 22/d Doğrudan Temin';
    if (rawTeminSekli.includes('22/a')) usulText = '4734 Sayılı KİK Madde 22/a Doğrudan Temin';
    else if (rawTeminSekli.includes('22/b')) usulText = '4734 Sayılı KİK Madde 22/b Doğrudan Temin';
    else if (rawTeminSekli.includes('22/c')) usulText = '4734 Sayılı KİK Madde 22/c Doğrudan Temin';
    else if (rawTeminSekli.includes('22/e')) usulText = '4734 Sayılı KİK Madde 22/e Doğrudan Temin';
    else if (rawTeminSekli.includes('22/f')) usulText = '4734 Sayılı KİK Madde 22/f Doğrudan Temin';

    items.push({
      label: 'İşin Türü / Alım Usulü',
      lines: [`${alimTuruText} / ${usulText}`],
      isBold: false,
    });

    // 3) Dosya Tarihi
    const formattedDate = formatDateTR(data?.dosyaTarihi || data?.tarih) || formatDateTR(new Date());
    items.push({
      label: 'Dosya Tarihi',
      lines: [formattedDate],
      isBold: false,
    });

    // 4) İşin Adı
    const isAdi = data?.isAdi || data?.isinAdi || data?.dosyaKonusu || (data as any)?.konu || '—';
    items.push({
      label: 'İşin Adı',
      lines: [String(isAdi)],
      isBold: true,
    });

    // 5) İşin Açıklaması / Gerekçesi
    const isinAciklamasi =
      data?.isinAciklamasi || data?.gerekce || data?.aciklama || 'Müdürlük ihtiyaçları doğrultusunda doğrudan temin usulüyle alım yapılması.';
    items.push({
      label: 'İşin Açıklaması',
      lines: [String(isinAciklamasi)],
      isBold: false,
    });

    // 6) Yüklenici Firma
    let firmaUnvan = data?.firmaAdi || (typeof data?.yukleniciFirma === 'string' ? data.yukleniciFirma : (data?.yukleniciFirma as any)?.unvan);
    if (!firmaUnvan && (data as any)?.kazananFirmaAdi) firmaUnvan = (data as any).kazananFirmaAdi;
    if (!firmaUnvan && (data as any)?.kazanan_firma_adi) firmaUnvan = (data as any).kazanan_firma_adi;
    if (!firmaUnvan) firmaUnvan = '—';

    const firmaVkn = data?.firmaVkn || (typeof data?.yukleniciFirma === 'object' && data?.yukleniciFirma !== null ? (data.yukleniciFirma as any).vkn : undefined) || (data as any)?.kazanan_firma_vkn;
    const firmaAdres = data?.firmaAdres || (typeof data?.yukleniciFirma === 'object' && data?.yukleniciFirma !== null ? (data.yukleniciFirma as any).adres : undefined);

    const firmaLines: string[] = [String(firmaUnvan)];
    if (firmaVkn) firmaLines.push(`VKN / TCKN: ${firmaVkn}`);
    if (firmaAdres) firmaLines.push(`Adres: ${firmaAdres}`);

    items.push({
      label: 'Yüklenici Firma',
      lines: firmaLines,
      isBold: true,
    });

    // 7) Sözleşme Bedeli (KDV hariç, KDV oranı ve tutarı ile KDV dahil tek satırda alt alta)
    const rawSozlesmeBedeli = data?.sozlesmeBedeli ?? data?.toplamTutar ?? (data as any)?.yaklasikMaliyet;
    const numSozlesmeBedeli =
      typeof rawSozlesmeBedeli === 'number'
        ? rawSozlesmeBedeli
        : parseFloat(String(rawSozlesmeBedeli || '0').replace(/[^0-9.,]/g, '').replace(',', '.')) || 0;

    const rawKdvOrani = data?.kdvOrani ?? (data as any)?.kdv_orani ?? 20;
    const numKdvOrani =
      typeof rawKdvOrani === 'number' ? rawKdvOrani : parseFloat(String(rawKdvOrani).replace(/[^0-9.,]/g, '')) || 20;

    const kdvTutari = (numSozlesmeBedeli * numKdvOrani) / 100;
    const kdvDahilToplam = numSozlesmeBedeli + kdvTutari;

    const bedelLines: string[] = [
      `KDV Hariç Tutar: ${formatCurrency(numSozlesmeBedeli, '0,00')} ₺`,
      `KDV Oranı (%${numKdvOrani}) / Tutarı: ${formatCurrency(kdvTutari, '0,00')} ₺`,
      `KDV Dahil Toplam Bedel: ${formatCurrency(kdvDahilToplam, '0,00')} ₺`,
    ];

    if (data?.tutarYazi) {
      bedelLines.push(`(Yalnız ${data.tutarYazi})`);
    }

    items.push({
      label: 'Sözleşme / Teklif Bedeli',
      lines: bedelLines,
      isBold: false,
    });

    return items;
  }, [data]);

  return (
    <DocumentLayout
      data={data as any}
      hideHeader
      hideFooter
      pageSize={pageSize}
      orientation={orientation}
    >
      <div className="w-full h-full flex flex-col justify-between text-black font-serif bg-white p-4 sm:p-8 select-text">
        <div>
          {/* LOGO & ANTET BÖLÜMÜ */}
          {ustLogo ? (
            /* Üstte Ortalanmış Logo + Antet */
            <div className="flex items-center justify-center gap-5 mb-8">
              <img
                src={ustLogo}
                alt="Logo"
                className="max-w-[90px] max-h-[90px] object-contain shrink-0"
              />
              <div className="text-left font-bold text-[13pt] leading-tight">
                {antetLines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </div>
          ) : sagLogo ? (
            /* Çift Logo: Sol Logo - Antet - Sağ Logo */
            <table className="w-full border-collapse mb-8">
              <tbody>
                <tr>
                  <td className="w-[95px] text-left align-middle">
                    {solLogo && (
                      <img
                        src={solLogo}
                        alt="Sol Logo"
                        className="max-w-[90px] max-h-[90px] object-contain"
                      />
                    )}
                  </td>
                  <td className="text-center align-middle font-bold text-[13pt] leading-tight">
                    {antetLines.map((line, idx) => (
                      <div key={idx}>{line}</div>
                    ))}
                  </td>
                  <td className="w-[95px] text-right align-middle">
                    <img
                      src={sagLogo}
                      alt="Sağ Logo"
                      className="max-w-[90px] max-h-[90px] object-contain ml-auto"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          ) : (
            /* Tek Logo (Sol veya Sol+Orta Ortalanmış) */
            <div className="flex items-center justify-center gap-5 mb-8">
              {solLogo && (
                <img
                  src={solLogo}
                  alt="Logo"
                  className="max-w-[90px] max-h-[90px] object-contain shrink-0"
                />
              )}
              <div className="text-center font-bold text-[13pt] leading-tight">
                {antetLines.map((line, idx) => (
                  <div key={idx}>{line}</div>
                ))}
              </div>
            </div>
          )}

          {/* KAPAK BAŞLIĞI */}
          <div className="text-center my-10 sm:my-14">
            <h1 className="text-[24pt] sm:text-[26pt] font-extrabold tracking-wider text-slate-900 uppercase">
              {coverTitle}
            </h1>
          </div>

          {/* DETAYLAR TABLOSU */}
          <table className="w-[92%] mx-auto border-collapse border border-black my-6">
            <tbody>
              {kapakDetaylari.map((item, index) => (
                <tr key={index} className="border-b border-black last:border-b-0">
                  <td className="w-[34%] bg-slate-50 border-r border-black p-3 sm:p-3.5 font-bold text-[11.5pt] align-middle text-slate-900">
                    {item.label}
                  </td>
                  <td
                    className={`w-[66%] p-3 sm:p-3.5 text-[11.5pt] align-middle leading-relaxed text-slate-950 ${
                      item.isBold ? 'font-bold' : 'font-normal'
                    }`}
                  >
                    {item.lines.map((line, lIdx) => (
                      <div
                        key={lIdx}
                        className={
                          line.startsWith('KDV Dahil Toplam')
                            ? 'font-bold text-slate-900 mt-1'
                            : ''
                        }
                      >
                        {line}
                      </div>
                    ))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ALT BİLGİ & YIL */}
        <div className="text-center mt-auto pt-6 text-[10.5pt] border-t border-dashed border-slate-300 text-slate-600">
          <div>4734 Sayılı Kamu İhale Kanunu Doğrudan Temin Dosyası</div>
          <div className="text-[13pt] font-bold text-slate-800 mt-1">
            {data?.butceYili || new Date().getFullYear()}
          </div>
        </div>
      </div>
    </DocumentLayout>
  );
}

export default DogrudanTeminDosyasi;
