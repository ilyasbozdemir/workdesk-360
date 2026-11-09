import type { TableColumnMapping } from '../types';

export async function resolveTableArray(
  rule: TableColumnMapping,
  activeDosyaId: number,
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>,
  resolvedPayload: Record<string, any>,
  sablonDegiskeni: string
): Promise<void> {
  try {
    let rows: any[] = [];
    if (rule.tablo === 'DATA_TeminKalem') {
      try {
        const tkQuery = `
          SELECT tk.*, 
                 COALESCE(NULLIF(tk.aciklama, ''), tanim.ozelligi, '') as aciklama,
                 COALESCE(NULLIF(tk.aciklama, ''), tanim.ozelligi, '') as ozelligi
          FROM DATA_TeminKalem tk
          LEFT JOIN TANIM_Kalem tanim ON (
            tk.kalem_adi = tanim.kalem_adi 
            OR (tk.tasinir_kodu IS NOT NULL AND tk.tasinir_kodu != '' AND tk.tasinir_kodu = tanim.tasinir_kodu)
          )
          WHERE tk.temin_dosya_id = ?
          ORDER BY tk.id ASC
        `;
        rows = await queryExecutor(tkQuery, [activeDosyaId]);
      } catch {
        rows = await queryExecutor(`SELECT * FROM ${rule.tablo} WHERE ${rule.iliskili_id} = ?`, [activeDosyaId]);
      }
    } else {
      rows = await queryExecutor(`SELECT * FROM ${rule.tablo} WHERE ${rule.iliskili_id} = ?`, [activeDosyaId]);
    }

    let firms: any[] = [];
    const bidsMap: Record<string, number> = {};

    if (rule.tablo === 'DATA_TeminKalem') {
      try {
        const firmQuery = `SELECT df.id as temin_firma_id,
                                  COALESCE(NULLIF(df.unvan, ''), NULLIF(f.unvan, ''), 'İstekli Firma') as unvan
                           FROM DATA_TeminFirma df
                           LEFT JOIN TANIM_Firma f ON df.firma_id = f.id
                           WHERE df.temin_dosya_id = ?
                           ORDER BY df.id ASC`;
        firms = await queryExecutor(firmQuery, [activeDosyaId]);
        if (firms && firms.length > 0) {
          resolvedPayload['firmalar'] = firms.map((f: any) => ({ unvan: f.unvan }));
        }

        const bidQuery = `SELECT temin_kalem_id, temin_firma_id, birim_fiyat FROM DATA_TeminKalemTeklif WHERE temin_dosya_id = ?`;
        const bidRows = await queryExecutor(bidQuery, [activeDosyaId]);
        (bidRows || []).forEach((b: any) => {
          bidsMap[`${b.temin_kalem_id}_${b.temin_firma_id}`] = b.birim_fiyat || 0;
        });
      } catch {
        // Ignore firm query failure
      }
    }

    const formatTR = (val: number) => {
      return new Intl.NumberFormat('tr-TR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      }).format(val);
    };

    const firmTotals = (firms || []).map(() => 0);

    resolvedPayload[sablonDegiskeni] = rows.map((row: any, idx: number) => {
      const item: Record<string, any> = { siraNo: idx + 1 };
      for (const [templateKey, dbColumn] of Object.entries(rule.altEslestirme!)) {
        item[templateKey] = row[dbColumn as string] ?? row[templateKey] ?? '';
      }

      if (!item.ozelligi || item.ozelligi === '') {
        item.ozelligi = row.aciklama || row.ozelligi || '';
      }
      if (!item.malzemeAdi || item.malzemeAdi === '') {
        item.malzemeAdi = row.kalem_adi || row.malzemeAdi || '';
      }
      if (!item.birimi || item.birimi === '') {
        item.birimi = row.birim || row.birimi || 'Adet';
      }
      if (!item.kodu || item.kodu === '') {
        item.kodu = row.tasinir_kodu || row.kodu || '-';
      }
      if (!item.miktar || item.miktar === '') {
        item.miktar = row.miktar !== undefined && row.miktar !== null ? row.miktar : 1;
      }

      if (rule.tablo === 'DATA_TeminKalem' && firms && firms.length > 0) {
        let minPrice = Infinity;
        let minIdx = -1;

        const firmaTeklifleriDetay = firms.map((f: any, fIdx: number) => {
          const price = bidsMap[`${row.id}_${f.temin_firma_id}`] || 0;
          const numMiktar = typeof row.miktar === 'number' ? row.miktar : parseFloat(String(row.miktar || 0));
          const total = price * (isNaN(numMiktar) ? 0 : numMiktar);
          if (price > 0) {
            firmTotals[fIdx] += total;
            if (price < minPrice) {
              minPrice = price;
              minIdx = fIdx;
            }
          }
          return {
            birimFiyat: price > 0 ? formatTR(price) : '-',
            tutar: total > 0 ? formatTR(total) : '-'
          };
        });

        item['firmaTeklifleriDetay'] = firmaTeklifleriDetay;
        if (minIdx !== -1 && firms[minIdx]) {
          const numMiktar = typeof row.miktar === 'number' ? row.miktar : parseFloat(String(row.miktar || 0));
          item['enUygunFirmaAdi'] = firms[minIdx].unvan;
          item['enDusukFiyat'] = formatTR(minPrice);
          item['toplamBedel'] = formatTR(minPrice * (isNaN(numMiktar) ? 0 : numMiktar));
        } else {
          item['enUygunFirmaAdi'] = item['enUygunFirmaAdi'] || '-';
          item['enDusukFiyat'] = item['enDusukFiyat'] || '-';
          item['toplamBedel'] = item['toplamBedel'] || '-';
        }
      }

      return item;
    });

    if (rule.tablo === 'DATA_TeminKalem' && firms && firms.length > 0) {
      resolvedPayload['firmaToplamlariDetay'] = firmTotals.map((tot: number) => ({
        toplam: tot > 0 ? formatTR(tot) : '-'
      }));
    }

    if (sablonDegiskeni === 'ihtiyacKalemleri') {
      resolvedPayload['kalemler'] = resolvedPayload[sablonDegiskeni];
      resolvedPayload['items'] = resolvedPayload[sablonDegiskeni];
    }
  } catch (err) {
    resolvedPayload[sablonDegiskeni] = [];
  }
}
