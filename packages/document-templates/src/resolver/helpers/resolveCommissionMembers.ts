import { TemplateRegistryService } from '../../services/templateRegistryService';
import { resolveCommissionCategory } from '../../services/commissionResolver';

export async function resolveCommissionMembers(
  sablonDegiskeni: string,
  activeDosyaId: number,
  templateId: string | undefined,
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>,
  resolvedPayload: Record<string, any>
): Promise<void> {
  try {
    let members: any[] = [];
    const fileKomQuery = `SELECT tk.*, 
                                 COALESCE(NULLIF(tk.ad_soyad, ''), NULLIF(p.ad_soyad, ''), '') as resolved_ad_soyad,
                                 COALESCE(NULLIF(tk.unvan, ''), NULLIF(p.unvan, ''), '') as resolved_unvan,
                                 COALESCE(k.ad, '') as komisyon_turu_adi,
                                 COALESCE(k.tur, '') as komisyon_tur_kodu
                          FROM DATA_TeminKomisyon tk 
                          LEFT JOIN TANIM_Personel p ON (
                            (tk.personel_id IS NOT NULL AND tk.personel_id > 0 AND tk.personel_id = p.id)
                            OR
                            ((tk.personel_id IS NULL OR tk.personel_id = 0) AND LOWER(TRIM(tk.ad_soyad)) = LOWER(TRIM(p.ad_soyad)))
                          )
                          LEFT JOIN TANIM_Komisyon k ON tk.komisyon_id = k.id
                          WHERE tk.temin_dosya_id = ?`;
    const fileKomRows = await queryExecutor(fileKomQuery, [activeDosyaId]);
    const isVisibleMember = (r: any) => {
      return TemplateRegistryService.isMemberVisibleInTemplate(r, templateId || '');
    };

    if (fileKomRows && fileKomRows.length > 0) {
      const visibleRows = fileKomRows.filter(isVisibleMember);
      const pool = visibleRows.length > 0 ? visibleRows : [];
      if (
        sablonDegiskeni === 'fiyatKomisyonu' ||
        sablonDegiskeni === 'komisyon' ||
        sablonDegiskeni === 'komisyonUyeleri' ||
        sablonDegiskeni === 'gorevlendirilenler'
      ) {
        members = pool.filter((r: any) => resolveCommissionCategory(r) === 'maliyet');
      } else if (sablonDegiskeni === 'muayeneKomisyonu') {
        members = pool.filter((r: any) => resolveCommissionCategory(r) === 'muayene');
      } else {
        members = pool;
      }
    }

    const seenMemberNames = new Set<string>();
    const uniqueMembers = (members || []).filter((m: any) => {
      const name = (m.resolved_ad_soyad || m.ad_soyad || m.adSoyad || '').trim().toLowerCase();
      const pid = m.personel_id ? `pid_${m.personel_id}` : null;
      const key = pid || (name ? `name_${name}` : null);
      if (!key) return true;
      if (seenMemberNames.has(key)) return false;
      seenMemberNames.add(key);
      return true;
    });

    resolvedPayload[sablonDegiskeni] = uniqueMembers.map((m: any) => ({
      adSoyad: m.resolved_ad_soyad || m.ad_soyad || m.adSoyad || '',
      ad_soyad: m.resolved_ad_soyad || m.ad_soyad || m.adSoyad || '',
      unvan: m.resolved_unvan || m.unvan || '',
      gorev: m.gorev || m.gorev_adi || (m.asil_mi === 0 ? 'Yedek Üye' : 'Üye'),
      gorevi: m.gorev || m.gorev_adi || (m.asil_mi === 0 ? 'Yedek Üye' : 'Üye'),
      pozisyonu: m.resolved_unvan || m.unvan || ''
    }));

    if (sablonDegiskeni === 'fiyatKomisyonu' || sablonDegiskeni === 'gorevlendirilenler') {
      resolvedPayload.gorevlendirilenler = resolvedPayload[sablonDegiskeni];
    } else if (
      sablonDegiskeni === 'muayeneKomisyonu' &&
      (templateId?.includes('muayene') || templateId?.includes('kabul'))
    ) {
      resolvedPayload.gorevlendirilenler = resolvedPayload[sablonDegiskeni];
      resolvedPayload.dagitimListesi = resolvedPayload[sablonDegiskeni];
    }
  } catch (err) {
    resolvedPayload[sablonDegiskeni] = [];
  }
}
