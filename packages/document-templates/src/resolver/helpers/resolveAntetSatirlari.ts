import { InstitutionalHeaderProvider } from '@worksuite-360/document-engine';

/**
 * Resolves institution header lines by combining TANIM_Kurum.kurum_anteti and DATA_TeminDosyasi.antet_ek_satir
 * (or selected birimId from TANIM_Birim) via the unified InstitutionalHeaderProvider.
 */
export async function resolveAntetSatirlari(
  activeDosyaId: number,
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>,
  overrideBirimId?: number | string | null
): Promise<string[]> {
  try {
    let result: string[] = [];
    let kurumAdiText = '';

    // 1. Fetch kurum_anteti or individual institution columns from TANIM_Kurum
    const kurumRes = await queryExecutor(
      'SELECT kurum_anteti, ust_kurum_adi, kurum_adi FROM TANIM_Kurum LIMIT 1',
      []
    );

    if (kurumRes && kurumRes.length > 0) {
      const row = kurumRes[0];
      kurumAdiText = row.kurum_adi || '';
      result = InstitutionalHeaderProvider.parseKurumBaseAntetLines(row);
    }

    // 2. Fallback to settings (institutionLetterhead or institutionName) if TANIM_Kurum has no antet
    if (result.length === 0 || (result.length === 1 && result[0] === 'T.C.')) {
      try {
        const ayarRes = await queryExecutor(
          'SELECT key, value FROM settings WHERE key IN ("institutionLetterhead", "institutionName", "parentInstitution")',
          []
        );
        if (ayarRes && Array.isArray(ayarRes)) {
          const ayarMap: Record<string, string> = {};
          ayarRes.forEach((item: any) => {
            ayarMap[item.key] = item.value;
          });

          if (ayarMap.institutionLetterhead) {
            try {
              const parsed = JSON.parse(ayarMap.institutionLetterhead);
              if (Array.isArray(parsed) && parsed.filter(Boolean).length > 0) {
                result = parsed.filter((s: string) => s && s.trim() !== '');
              }
            } catch {}
          }

          if (result.length === 0 || (result.length === 1 && result[0] === 'T.C.')) {
            const built: string[] = ['T.C.'];
            if (ayarMap.parentInstitution && ayarMap.parentInstitution.trim()) {
              built.push(ayarMap.parentInstitution.toUpperCase());
            }
            if (ayarMap.institutionName && ayarMap.institutionName.trim()) {
              built.push(ayarMap.institutionName.toUpperCase());
            }
            if (built.length > 1) result = built;
          }
        }
      } catch (e) {}
    }

    // 3. Fallback to clean T.C. if TANIM_Kurum and settings had no header lines
    if (result.length === 0) {
      result = ['T.C.'];
    }

    // 4. If overrideBirimId is explicitly given, resolve from TANIM_Birim directly
    if (overrideBirimId !== undefined && overrideBirimId !== null && String(overrideBirimId).trim() !== '') {
      try {
        const birimRes = await queryExecutor(
          'SELECT id, ad, birim_adi, antet_ek_satir FROM TANIM_Birim WHERE id = ? LIMIT 1',
          [overrideBirimId]
        );
        if (birimRes && birimRes.length > 0) {
          return InstitutionalHeaderProvider.composeBirimAntetLines(
            result,
            birimRes[0],
            undefined,
            undefined,
            kurumAdiText
          );
        }
      } catch (e) {
        console.error('Seçili birimId için antet satırı çözümlenirken hata:', e);
      }
    }

    // 5. Fetch antet_ek_satir or birim antet from DATA_TeminDosyasi & TANIM_Birim
    if (activeDosyaId) {
      try {
        const birimRes = await queryExecutor(
          `SELECT d.antet_ek_satir as dosya_antet, 
                  b.antet_ek_satir as birim_antet, 
                  b.birim_adi, 
                  d.harcama_birimi
           FROM DATA_TeminDosyasi d 
           LEFT JOIN TANIM_Birim b ON d.birim_id = b.id 
           WHERE d.id = ? LIMIT 1`,
          [activeDosyaId]
        );
        if (birimRes && birimRes.length > 0) {
          const row = birimRes[0];
          const ekSatir = (
            row.dosya_antet ||
            row.birim_antet ||
            row.birim_adi ||
            row.harcama_birimi ||
            ''
          ).trim();
          if (ekSatir) {
            result = InstitutionalHeaderProvider.composeBirimAntetLines(
              result,
              ekSatir,
              row.dosya_antet,
              undefined,
              kurumAdiText
            );
          }
        }
      } catch (e) {
        console.error('Birim antet ek satırı çözümlenirken hata:', e);
      }
    }

    return result;
  } catch (err) {
    console.error('Antet satırları çözümlenirken hata:', err);
  }
  return ['T.C.'];
}
