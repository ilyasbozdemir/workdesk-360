import type { CommissionSignatureType } from '@temin360/contracts';

export type CommissionCategory = 'maliyet' | 'muayene' | 'ihale' | 'unmapped';

export interface CommissionResolutionInput {
  komisyon_id?: number | string | null;
  komisyon_turu?: string | null;
  komisyon_adi?: string | null;
  gorev?: string | null;
  belge_kapsami?: string | null;
  belgeKapsami?: string | null;
  [key: string]: any;
}

export interface FormattedCommissionMember {
  id?: number | string;
  personelId?: number | string | null;
  adSoyad: string;
  ad_soyad: string;
  unvan: string;
  /** Komisyondaki görevi (Örn: Komisyon Başkanı, Başkan, Üye, Yedek Üye, Fiyat Araştırma Görevlisi) */
  gorev: string;
  gorevi: string;
  komisyonGorevi: string;
  /** Asil / Yedek durumu */
  rol: string;
  asilMi: number;
  asliYedek: 'Asil' | 'Yedek';
  /** Belge rotasındaki imza türü (Paraf | Koordinasyon | İmza) - komisyon görevinden ayrıdır */
  imzaTuru: CommissionSignatureType;
  imza_turu: CommissionSignatureType;
  birimId?: number | string | null;
  birim?: string;
  aktifKatilim?: boolean;
}

export interface CommissionSignatureDistribution {
  /** Islak imza alanında (çoklu imza bloğu) gösterilecek 'İmza' türündeki uygun üyeler */
  wetSignatureMembers: FormattedCommissionMember[];
  /** Rotada 'Paraf' adımına aktarılacak üyeler */
  parafMembers: FormattedCommissionMember[];
  /** Rotada 'Koordinasyon' adımına aktarılacak üyeler */
  koordinasyonMembers: FormattedCommissionMember[];
  /** Yedek üye kuralı gereği bu belgede otomatik imza alanına eklenmeyen yedek üyeler */
  excludedReserveMembers: FormattedCommissionMember[];
  /** Tüm uygun üyeler (İmza + Paraf + Koordinasyon) */
  allEligibleMembers: FormattedCommissionMember[];
  /** Paraf ve Koordinasyon üyelerinin aktarıldığı güncel rota adımları */
  rotaSteps: Array<{
    t: CommissionSignatureType | string;
    a: string;
    u: string;
    gorevi?: string;
    tarih?: string;
    sira?: number;
  }>;
}

/**
 * İmza türünü ('Paraf' | 'Koordinasyon' | 'İmza') normalize eder.
 * Komisyon görevi (Başkan, Üye vb.) ile KARIŞTIRILMAZ; varsayılan değer 'İmza'dır.
 */
export function normalizeSignatureType(raw: unknown): CommissionSignatureType {
  if (typeof raw !== 'string') return 'İmza';
  const clean = raw.trim().toLocaleLowerCase('tr-TR');
  if (clean === 'paraf') return 'Paraf';
  if (clean === 'koordinasyon' || clean === 'koordine') return 'Koordinasyon';
  return 'İmza';
}

/**
 * Bir komisyon üyesinin Yedek Üye olup olmadığını tespit eder.
 */
export function isReserveCommissionMember(member: Record<string, any> | null | undefined): boolean {
  if (!member || typeof member !== 'object') return false;
  if (member.asil_mi === 0 || member.asil_mi === '0' || member.asil_mi === false) return true;
  if (member.asilMi === 0 || member.asilMi === '0' || member.asilMi === false) return true;

  const asliYedek = String(member.asli_yedek ?? member.asliYedek ?? '').trim().toLocaleLowerCase('tr-TR');
  if (asliYedek === 'yedek' || asliYedek === 'yedek üye' || asliYedek === 'yedek uye') return true;

  const rol = String(member.rol ?? '').trim().toLocaleLowerCase('tr-TR');
  if (rol === 'yedek' || rol.includes('yedek')) return true;

  const gorev = String(member.gorev ?? member.gorevi ?? member.gorev_adi ?? member.role ?? '')
    .trim()
    .toLocaleLowerCase('tr-TR');
  if (gorev.includes('yedek')) return true;

  return false;
}

/**
 * Belgenin komisyon görevlendirme / kurulum oluru belgesi olup olmadığını döndürür.
 * Görevlendirme belgelerinde asil ve yedek üyeler kadro tablosunda birlikte yer alabilir;
 * ancak tutanak, karar ve yaklaşık maliyet gibi ıslak imzalı belgelerde yedek üyeler
 * otomatik olarak imza alanına eklenmez.
 */
export function isCommissionAppointmentDocument(
  docInput?: string | string[] | null
): boolean {
  if (!docInput) return false;
  const list = Array.isArray(docInput) ? docInput : [docInput];
  return list.some((raw) => {
    const clean = String(raw || '')
      .trim()
      .toLocaleLowerCase('tr-TR')
      .replace(/_/g, '-');
    return (
      clean.includes('komisyon-gorevlendirme') ||
      clean.includes('muayene-kabul-komisyonu') ||
      clean.includes('fiyat-arastirma-gorevlendirmesi')
    );
  });
}

/**
 * Yedek üyenin ilgili belgede imza/kadro alanına dahil edilip edilmeyeceğini komisyon
 * işleyiş kurallarına göre belirler:
 * - Asil üyeler her zaman dahildir.
 * - Yedek üyeler varsayılan olarak tutanak/karar belgelerinin ıslak imza alanına EKLENMEZ.
 * - Yedek üye yalnızca:
 *   1) Belge bir komisyon görevlendirme oluru ise (`isCommissionAppointmentDocument`), VEYA
 *   2) Üye asil üye yerine açıkça aktif katılımcı (`aktif_katilim` / `aktifKatilim` / `yedek_aktif`) işaretlenmişse, VEYA
 *   3) `options.includeReserves === true` açıkça belirtilmişse dahil edilir.
 */
export function isReserveMemberEligibleForDocument(
  member: Record<string, any> | null | undefined,
  docInput?: string | string[] | null,
  options?: { includeReserves?: boolean }
): boolean {
  if (!member) return false;
  if (!isReserveCommissionMember(member)) return true;
  if (options?.includeReserves === true) return true;
  if (
    member.aktif_katilim === true ||
    member.aktif_katilim === 1 ||
    member.aktifKatilim === true ||
    member.yedek_aktif === 1 ||
    member.yedekAktif === true
  ) {
    return true;
  }
  if (isCommissionAppointmentDocument(docInput)) {
    return true;
  }
  return false;
}

/**
 * Ham komisyon üyesi kaydını (DB veya UI) görev ve imza türünü birbirine karıştırmadan
 * belge şablonlarının ve rotanın kullanacağı standart yapıya dönüştürür.
 */
export function formatCommissionMemberForDocument(
  member: Record<string, any>,
  defaultRole = 'Üye'
): FormattedCommissionMember {
  const rawName = String(
    member.adSoyad ?? member.ad_soyad ?? member.name ?? member.a ?? ''
  )
    .split('(')[0]
    .trim();

  const rawUnvan = String(
    member.vekalet_unvani ||
      member.vekaletUnvani ||
      member.unvan ||
      member.personel_unvan ||
      member.title ||
      member.u ||
      ''
  ).trim();

  const isReserve = isReserveCommissionMember(member);

  // Komisyon görevi (Başkan, Üye, Yedek Üye vb.) imza türünden (Paraf, Koordinasyon, İmza) tamamen ayrıdır
  const rawGorev = String(
    member.gorevi ||
      member.gorev ||
      member.gorev_adi ||
      member.komisyonGorevi ||
      member.role ||
      ''
  ).trim();

  const cleanGorev =
    rawGorev &&
    rawGorev !== 'Paraf' &&
    rawGorev !== 'Koordinasyon' &&
    rawGorev !== 'İmza'
      ? rawGorev
      : isReserve
        ? 'Yedek Üye'
        : defaultRole;

  const imzaTuru = normalizeSignatureType(
    member.imza_turu ?? member.imzaTuru ?? member.signatureType
  );

  const asilMi = isReserve ? 0 : 1;
  const asliYedek: 'Asil' | 'Yedek' = isReserve ? 'Yedek' : 'Asil';
  const rol = isReserve
    ? 'Yedek Üye'
    : cleanGorev.toLocaleLowerCase('tr-TR').includes('başkan') ||
        cleanGorev.toLocaleLowerCase('tr-TR').includes('baskan')
      ? 'Başkan'
      : 'Üye';

  return {
    id: member.id ?? member.role_id ?? member.personel_id ?? member.personelId,
    personelId: member.personel_id ?? member.personelId ?? member.id ?? null,
    adSoyad: rawName,
    ad_soyad: rawName,
    unvan: rawUnvan,
    gorev: cleanGorev,
    gorevi: cleanGorev,
    komisyonGorevi: cleanGorev,
    rol,
    asilMi,
    asliYedek,
    imzaTuru,
    imza_turu: imzaTuru,
    birimId: member.birim_id ?? member.birimId ?? member.unitId ?? null,
    birim: member.birim ?? member.birim_adi ?? member.birimAdi ?? member.unitName ?? undefined,
    aktifKatilim: Boolean(
      member.aktif_katilim || member.aktifKatilim || member.yedek_aktif || member.yedekAktif
    ),
  };
}

/**
 * Komisyon üyelerini işleyiş kurallarına (Asil/Yedek) ve imza türlerine (İmza / Paraf / Koordinasyon)
 * göre ayrıştırır; çoklu ıslak imza listesini ve Paraf/Koordinasyon rota adımlarını üretir.
 *
 * Mimari Kural:
 * - Komisyon üyeliği koordinasyon ile eşitlenmez; varsayılan imza türü 'İmza'dır.
 * - Yalnızca imza türü açıkça 'Paraf' veya 'Koordinasyon' seçilen üyeler rota akışına aktarılır.
 * - Üyenin komisyon görevi (Başkan, Üye vb.) ile imza türü (Paraf, Koordinasyon, İmza) ayrı tutulur.
 */
export function distributeCommissionMembersBySignatureType(
  rawMembers: Record<string, any>[],
  options: {
    docId?: string | string[] | null;
    includeReserves?: boolean;
    defaultRole?: string;
    existingRota?: Array<{
      t?: string;
      a?: string;
      u?: string;
      gorevi?: string;
      tarih?: string;
      sira?: number;
    }>;
    defaultDate?: string;
  } = {}
): CommissionSignatureDistribution {
  const {
    docId,
    includeReserves = false,
    defaultRole = 'Üye',
    existingRota = [],
    defaultDate = '',
  } = options;

  const wetSignatureMembers: FormattedCommissionMember[] = [];
  const parafMembers: FormattedCommissionMember[] = [];
  const koordinasyonMembers: FormattedCommissionMember[] = [];
  const excludedReserveMembers: FormattedCommissionMember[] = [];
  const allEligibleMembers: FormattedCommissionMember[] = [];

  for (let i = 0; i < (rawMembers || []).length; i++) {
    const raw = rawMembers[i];
    if (!raw || typeof raw !== 'object') continue;

    const fallbackRole = i === 0 && rawMembers.length > 1 ? 'Başkan' : defaultRole;
    const formatted = formatCommissionMemberForDocument(raw, fallbackRole);
    if (!formatted.adSoyad) continue;

    const eligible = isReserveMemberEligibleForDocument(raw, docId, {
      includeReserves,
    });

    if (!eligible) {
      excludedReserveMembers.push(formatted);
      continue;
    }

    allEligibleMembers.push(formatted);

    if (formatted.imzaTuru === 'Paraf') {
      parafMembers.push(formatted);
    } else if (formatted.imzaTuru === 'Koordinasyon') {
      koordinasyonMembers.push(formatted);
    } else {
      wetSignatureMembers.push(formatted);
    }
  }

  // Mevcut rota adımlarını koru ve Paraf / Koordinasyon türündeki uygun komisyon üyelerini ekle
  const rotaSteps = Array.isArray(existingRota) ? [...existingRota.map((r) => ({ ...r, t: r.t || 'Paraf', a: r.a || '', u: r.u || '' }))] : [];

  for (const pm of [...parafMembers, ...koordinasyonMembers]) {
    const alreadyExists = rotaSteps.some(
      (r) =>
        String(r.a || '')
          .trim()
          .toLocaleLowerCase('tr-TR') === pm.adSoyad.toLocaleLowerCase('tr-TR') &&
        String(r.t || '')
          .trim()
          .toLocaleLowerCase('tr-TR') === pm.imzaTuru.toLocaleLowerCase('tr-TR')
    );
    if (!alreadyExists) {
      rotaSteps.push({
        t: pm.imzaTuru,
        a: pm.adSoyad,
        u: pm.unvan,
        gorevi: pm.gorevi,
        tarih: defaultDate,
        sira: rotaSteps.length + 1,
      });
    }
  }

  return {
    wetSignatureMembers,
    parafMembers,
    koordinasyonMembers,
    excludedReserveMembers,
    allEligibleMembers,
    rotaSteps,
  };
}

/**
 * Central, type-safe commission category resolver.
 * Replaces scattered includes() and magic numbers with layered precedence:
 * 1. Explicit scope (belge_kapsami / belgeKapsami)
 * 2. Database ID fallback (komisyon_id = 1 -> maliyet, 2 -> muayene)
 * 3. Text classification fallback (komisyon_turu / komisyon_adi / gorev)
 */
export function resolveCommissionCategory(
  input: CommissionResolutionInput | null | undefined
): CommissionCategory {
  if (!input) return 'unmapped';

  // 1. Explicit Scope Precedence
  const rawScope = input.belge_kapsami ?? input.belgeKapsami;
  if (rawScope !== undefined && rawScope !== null) {
    const scope = String(rawScope).trim().toLowerCase();
    if (scope === 'piyasa_arastirma' || scope === 'yaklasik_maliyet') {
      return 'maliyet';
    }
    if (scope === 'muayene_kabul') {
      return 'muayene';
    }
    if (scope === 'ihale_komisyonu' || scope === 'ihale') {
      return 'ihale';
    }
    if (scope === 'gizli' || scope === 'none') {
      return 'unmapped';
    }
  }

  // 2. Tur / Type code precedence (from TANIM_Komisyon.tur or komisyon_tur_kodu)
  const rawTur = input.tur ?? input.komisyon_tur_kodu ?? input.komisyonTuruKodu;
  if (rawTur !== undefined && rawTur !== null && rawTur !== '') {
    const turStr = String(rawTur).trim().toLowerCase();
    if (turStr.includes('yaklasik') || turStr.includes('maliyet') || turStr.includes('fiyat') || turStr.includes('piyasa')) {
      return 'maliyet';
    }
    if (turStr.includes('muayene') || turStr.includes('kabul')) {
      return 'muayene';
    }
    if (turStr.includes('ihale')) {
      return 'ihale';
    }
  }

  // 3. Database ID Precedence:
  // In initial default seeds, komisyon_id = 1 was Yaklasik Maliyet.
  // komisyon_id = 2 was Muayene ONLY if the commission/task text does not explicitly say Yaklasik Maliyet or Fiyat Arastirma.
  // (In many databases, Yaklasik Maliyet was created with id = 2 and Muayene with id = 3).
  const rawId = input.komisyon_id;
  if (rawId !== undefined && rawId !== null && rawId !== '') {
    const numId = Number(rawId);
    if (numId === 1) return 'maliyet';
    if (numId === 2) {
      const text = `${input.komisyon_turu || ''} ${input.komisyon_adi || ''} ${input.komisyon_turu_adi || ''} ${input.gorev || ''} ${input.gorevi || ''}`.toLowerCase();
      if (text.includes('fiyat') || text.includes('maliyet') || text.includes('araştırma') || text.includes('arastirma') || text.includes('piyasa')) {
        return 'maliyet';
      }
      return 'muayene';
    }
  }

  // 4. Normalized Text Classification Fallback
  const textSource = `${input.komisyon_turu || ''} ${input.komisyon_adi || ''} ${input.komisyon_turu_adi || ''} ${input.gorev || ''} ${input.gorevi || ''} ${input.komisyonGorevi || ''}`.trim().toLowerCase();
  if (!textSource) return 'unmapped';

  if (
    textSource.includes('fiyat') ||
    textSource.includes('maliyet') ||
    textSource.includes('araştırma') ||
    textSource.includes('arastirma') ||
    textSource.includes('piyasa')
  ) {
    return 'maliyet';
  }

  if (textSource.includes('muayene') || textSource.includes('kabul')) {
    return 'muayene';
  }

  if (textSource.includes('ihale')) {
    return 'ihale';
  }

  return 'unmapped';
}

/**
 * Incompatible duty / task keywords for Muayene ve Kabul Komisyonu.
 * In Turkish public procurement (4734 sayılı KİK ve ilgili mevzuat), officials with approval,
 * payment realization, accounting, or initial price research duties cannot serve as inspection/acceptance members.
 */
export const INCOMPATIBLE_MUAYENE_TASKS = [
  'fiyat araştırma',
  'fiyat arastirma',
  'harcama yetkili',
  'muhasebe yetkili',
  'gerçekleştirme',
  'gerceklestirme'
] as const;

/**
 * Checks whether a specific task/duty (or commission member record) is legally and operationally
 * eligible to serve on the Muayene ve Kabul Komisyonu.
 *
 * NOTE: This is an independent task suitability policy. It must NOT be merged into
 * commission category resolution (resolveCommissionCategory), which solely determines
 * the type of committee.
 */
export function isTaskEligibleForMuayene(
  taskOrMember: string | CommissionResolutionInput | null | undefined
): boolean {
  if (!taskOrMember) return true;

  const duty =
    typeof taskOrMember === 'string'
      ? taskOrMember
      : String(taskOrMember.gorev || taskOrMember.gorevi || taskOrMember.komisyonGorevi || '');

  if (!duty.trim()) return true;

  const normalized = duty.toLowerCase();
  for (const incompatible of INCOMPATIBLE_MUAYENE_TASKS) {
    if (normalized.includes(incompatible)) {
      return false;
    }
  }
  return true;
}
