/**
 * Formats an evrak sayısı into official EBYS/DETSIS format ([DETSIS]-[SDP]-[SAYI]) as in İhtiyaç Listesi.
 */
export function formatOfficialEvrakSayisi(options: {
  evrakSayisi?: string | null;
  detsisNo?: string | null;
  tur?: string | null;
  sayisi?: string | number | null;
  teminNo?: string | null;
  yil?: number | string | null;
}): string {
  const current = String(options.evrakSayisi || '').replace(/^E-/i, '').trim();
  if (current && !current.includes('/') && /^\d+-\d+\.\d+-\d+$/.test(current)) {
    return current;
  }

  const detsis = String(options.detsisNo || '').trim() || '10234521';
  const rawTur = String(options.tur || 'mal').toLowerCase();
  let sdpAltKodu = '01';
  if (rawTur.includes('hizmet') || rawTur.includes('danismanlik')) {
    sdpAltKodu = '02';
  } else if (rawTur.includes('yapim')) {
    sdpAltKodu = '03';
  }
  const sdpKodu = `934.${sdpAltKodu}`;

  let seqNumber = 1;
  const numSource = String(options.sayisi || options.teminNo || current || '');
  if (numSource) {
    const parts = numSource.split(/[/_ -]+/);
    for (let i = parts.length - 1; i >= 0; i--) {
      const n = parseInt(parts[i], 10);
      if (!isNaN(n) && n > 0 && n < 2000) {
        seqNumber = n;
        break;
      }
    }
  }

  const padded = String(seqNumber).padStart(4, '0');
  return `${detsis}-${sdpKodu}-${padded}`;
}

/**
 * Resolves official document number in standard İhtiyaç Listesi format e.g. 0000000-934.01-0001
 */
export async function resolveEvrakSayisi(
  activeDosyaId: number,
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>
): Promise<string> {
  try {
    let detsisNo = '';

    // 1. Fetch detsis_kodu from TANIM_Kurum
    try {
      const kurumRes = await queryExecutor('SELECT * FROM TANIM_Kurum LIMIT 1', []);
      if (kurumRes?.[0]?.detsis_kodu) {
        detsisNo = String(kurumRes[0].detsis_kodu).trim();
      } else if (kurumRes?.[0]?.detsis_no) {
        detsisNo = String(kurumRes[0].detsis_no).trim();
      } else if (kurumRes?.[0]?.dtvt_kodu) {
        detsisNo = String(kurumRes[0].dtvt_kodu).trim();
      }
    } catch {}

    // 1.b Check birim detsis_kodu if dosya has birim_id
    if (!detsisNo && activeDosyaId) {
      try {
        const bRes = await queryExecutor(
          `SELECT b.detsis_kodu, b.dtvt_kodu 
           FROM DATA_TeminDosyasi d 
           JOIN TANIM_Birim b ON d.birim_id = b.id 
           WHERE d.id = ? LIMIT 1`,
          [activeDosyaId]
        );
        if (bRes?.[0]?.detsis_kodu) {
          detsisNo = String(bRes[0].detsis_kodu).trim();
        } else if (bRes?.[0]?.dtvt_kodu) {
          detsisNo = String(bRes[0].dtvt_kodu).trim();
        }
      } catch {}
    }

    // 2. Fallback to TANIM_Ayar / settings (detsisKodu / detsis_kodu)
    if (!detsisNo) {
      try {
        const ayarRes = await queryExecutor(
          "SELECT deger FROM TANIM_Ayar WHERE anahtar IN ('detsisKodu', 'detsis_kodu') LIMIT 1",
          []
        );
        if (ayarRes?.[0]?.deger) {
          detsisNo = String(ayarRes[0].deger).trim();
        }
      } catch {}
    }

    if (!detsisNo) {
      try {
        const setRes = await queryExecutor(
          "SELECT value FROM settings WHERE key IN ('detsisKodu', 'detsis_kodu') LIMIT 1",
          []
        );
        if (setRes?.[0]?.value) {
          detsisNo = String(setRes[0].value).trim();
        }
      } catch {}
    }

    if (!detsisNo) {
      detsisNo = '10234521';
    }

    // 3. Fetch dosya details
    const dosyaRes = await queryExecutor(
      'SELECT id, temin_no, evrak_sayisi, tur, butce_yili, dosya_acilis_tarihi, created_at FROM DATA_TeminDosyasi WHERE id = ? LIMIT 1',
      [activeDosyaId]
    );

    const row = dosyaRes?.[0];

    // Eğer dosyada önceden girilmiş resmi formatta bir evrak sayısı varsa koru
    const existingEvrak = String(row?.evrak_sayisi || '').replace(/^E-/i, '').trim();
    if (existingEvrak && !existingEvrak.includes('/') && /^\d+-\d+\.\d+-\d+$/.test(existingEvrak)) {
      return existingEvrak;
    }

    const dosyaSayisi = String(row?.temin_no || '').trim();
    const rawTur = String(row?.tur || 'mal').toLowerCase();

    // SDP Standart Dosya Planı Kodu: 934.01 (Mal Alımı), 934.02 (Hizmet/Danışmanlık), 934.03 (Yapım İşi)
    let sdpAltKodu = '01';
    if (rawTur.includes('hizmet') || rawTur.includes('danismanlik')) {
      sdpAltKodu = '02';
    } else if (rawTur.includes('yapim')) {
      sdpAltKodu = '03';
    } else {
      sdpAltKodu = '01';
    }
    const sdpKodu = `934.${sdpAltKodu}`;

    // Yıla göre sıra numarası hesaplama (Her yıl 0001'den başlar)
    const fileYear =
      row?.butce_yili ||
      (row?.dosya_acilis_tarihi ? new Date(row.dosya_acilis_tarihi).getFullYear() : null) ||
      (row?.created_at ? new Date(row.created_at).getFullYear() : null) ||
      new Date().getFullYear();

    let seqNumber: number | null = null;

    if (dosyaSayisi) {
      const parts = dosyaSayisi.split(/[/_ -]+/);
      for (let i = parts.length - 1; i >= 0; i--) {
        const num = parseInt(parts[i], 10);
        if (!isNaN(num) && num !== fileYear && num > 0) {
          seqNumber = num;
          break;
        }
      }
    }

    // Eğer temin_no içinden yıl sırası çıkarılamadıysa, o yılın dosyaları arasındaki sırasını bul
    if (!seqNumber || seqNumber <= 0) {
      try {
        const countRes = await queryExecutor(
          `SELECT COUNT(*) as cnt FROM DATA_TeminDosyasi 
           WHERE (coalesce(butce_yili, strftime('%Y', coalesce(dosya_acilis_tarihi, created_at))) = ? 
                  OR temin_no LIKE ?) 
             AND id <= ? AND (is_deleted IS NULL OR is_deleted = 0)`,
          [fileYear, `%${fileYear}%`, activeDosyaId]
        );
        if (countRes?.[0]?.cnt && countRes[0].cnt > 0) {
          seqNumber = countRes[0].cnt;
        }
      } catch {}
    }

    if (!seqNumber || seqNumber <= 0) {
      seqNumber = 1;
    }

    const paddedSayi = String(seqNumber).padStart(4, '0');
    return `${detsisNo}-${sdpKodu}-${paddedSayi}`;
  } catch (err) {
    return '10234521-934.01-0001';
  }
}
