import {
  TemplateRegistryService,
  resolveCommissionCategory,
  distributeCommissionMembersBySignatureType,
  isCommissionAppointmentDocument
} from '@temin360/document-templates'
import { dedupeMembers, cleanPersonelName } from './previewDataUtils'

export async function resolvePersonnelAndCommissions(
  baseData: any,
  dosyaObj: any,
  ctx: any,
  targetDocTemplateId: string,
  targetDocIds: string[],
  personelList: any[],
  activeDosyaId: number,
  resolvedId: string,
  selectedDocId: string,
  queryExecutor: (sql: string, params: any[]) => Promise<any[]>,
  payloadData?: any
): Promise<void> {
  // Automatic personnel resolution from IDs
  if (
    !baseData.hazirlayanPersonelAdi &&
    dosyaObj.hazirlayan_personel_id &&
    Array.isArray(personelList)
  ) {
    const hp = personelList.find(
      (p: any) => Number(p.id) === Number(dosyaObj.hazirlayan_personel_id)
    )
    if (hp) {
      baseData.hazirlayanPersonelAdi = cleanPersonelName(hp.ad_soyad)
      baseData.hazirlayanPersonelUnvan = hp.unvan || ''
    }
  }
  if (!baseData.onaylayanPersonelAdi && dosyaObj.onay_personel_id && Array.isArray(personelList)) {
    const op = personelList.find((p: any) => Number(p.id) === Number(dosyaObj.onay_personel_id))
    if (op) {
      baseData.onaylayanPersonelAdi = op.ad_soyad
      baseData.onaylayanPersonelUnvan = op.unvan || ''
      baseData.harcamaYetkilisiAdi = op.ad_soyad
      baseData.harcamaYetkilisiUnvan = op.unvan || 'Harcama Yetkilisi'
      baseData.baskanAdi = op.ad_soyad
      baseData.baskanUnvan = op.unvan || 'Harcama Yetkilisi'
    }
  }

  const talepPolicy = TemplateRegistryService.resolveRoleVisibility(
    targetDocTemplateId,
    'talep_eden'
  )
  const onayPolicy = TemplateRegistryService.resolveRoleVisibility(targetDocTemplateId, 'onaylayan')
  const harcamaPol = TemplateRegistryService.resolveRoleVisibility(
    targetDocTemplateId,
    'harcama_yetkilisi'
  )

  if (!baseData.hazirlayanPersonelAdi) {
    baseData.hazirlayanPersonelAdi = ctx.hazirlayanPersonelAdi || ''
    baseData.hazirlayanPersonelUnvan = ctx.hazirlayanPersonelUnvan || ''
  }

  if (!baseData.talepEdenPersonelAdi) {
    baseData.talepEdenPersonelAdi = ctx.talepEdenPersonelAdi || ''
    baseData.talepEdenPersonelUnvan = ctx.talepEdenPersonelUnvan || ''
    if (!baseData.talepEdenPersonelAdi && dosyaObj.talep_eden_personel_id) {
      const tp = (personelList || []).find((p: any) => p.id === dosyaObj.talep_eden_personel_id)
      if (tp) {
        baseData.talepEdenPersonelAdi = cleanPersonelName(tp.ad_soyad)
        baseData.talepEdenPersonelUnvan = tp.unvan || ''
      }
    }
  }

  if (!baseData.onaylayanPersonelAdi && (onayPolicy !== 'hide' || harcamaPol !== 'hide')) {
    baseData.onaylayanPersonelAdi = ctx.onaylayanPersonelAdi || ''
    baseData.onaylayanPersonelUnvan = ctx.onaylayanPersonelUnvan || ''
  }

  let hasHarcamaRowInFile = false
  let hasMuhasebeRowInFile = false
  let hasGerceklestirmeRowInFile = false

  if (activeDosyaId) {
    try {
      let dbKomisyonlar: any[] =
        payloadData?.komisyonlar && Array.isArray(payloadData.komisyonlar) && payloadData.komisyonlar.length > 0
          ? payloadData.komisyonlar
          : []
      if (dbKomisyonlar.length === 0) {
        dbKomisyonlar = await queryExecutor(
          `SELECT tk.*, COALESCE(tk.ad_soyad, p.ad_soyad) as ad_soyad, COALESCE(tk.unvan, p.unvan) as unvan,
                  COALESCE(tk.birim, p.birim) as birim, COALESCE(tk.birim_id, p.birim_id) as birim_id,
                  tk.gorev, tk.rol, tk.komisyon_id
           FROM DATA_TeminKomisyon tk 
           LEFT JOIN TANIM_Personel p ON tk.personel_id = p.id 
           WHERE tk.temin_dosya_id = ? 
           ORDER BY tk.id ASC`,
          [activeDosyaId]
        )
      }
      if (dbKomisyonlar && dbKomisyonlar.length > 0) {
        // 1. Muhasebe Yetkilisi / Mutemet tespiti
        const muhasebeRow = dbKomisyonlar.find((k: any) => {
          const g = (k.gorev || '').toLowerCase()
          const r = (k.rol || '').toLowerCase()
          const u = (k.unvan || '').toLowerCase()
          const kt = (k.komisyon_turu || '').toLowerCase()
          return (
            g.includes('muhasebe') ||
            g.includes('mutemet') ||
            r.includes('muhasebe') ||
            r.includes('mutemet') ||
            u.includes('muhasebe') ||
            u.includes('mutemet') ||
            kt.includes('muhasebe') ||
            kt.includes('mutemet')
          )
        })

        if (muhasebeRow) {
          hasMuhasebeRowInFile = true
          const isMuhasebeVisible = TemplateRegistryService.isMemberVisibleInDocument(
            muhasebeRow,
            targetDocIds
          )
          if (isMuhasebeVisible && (muhasebeRow.ad_soyad || muhasebeRow.personel_id)) {
            let cleanName = (muhasebeRow.ad_soyad || '').split('(')[0].trim()
            if (!cleanName && muhasebeRow.personel_id) {
              const p = (personelList || []).find((x: any) => x.id === muhasebeRow.personel_id)
              if (p) cleanName = (p.ad_soyad || '').split('(')[0].trim()
            }
            if (cleanName) {
              baseData.mutemetAdi = cleanName
              baseData.mutemetUnvan = muhasebeRow.unvan || 'Muhasebe Yetkilisi'
              baseData.muhasebeYetkilisiAdi = cleanName
              baseData.muhasebeYetkilisiUnvan = muhasebeRow.unvan || 'Muhasebe Yetkilisi'
              baseData.muhasebeYetkilisi = cleanName
            }
          } else {
            baseData.mutemetAdi = ''
            baseData.mutemetUnvan = ''
            baseData.muhasebeYetkilisiAdi = ''
            baseData.muhasebeYetkilisiUnvan = ''
            baseData.muhasebeYetkilisi = ''
          }
        }

        // 2. Harcama Yetkilisi (Onaylayan / Olur Veren)
        const harcamaRow = dbKomisyonlar.find((k: any) => {
          const g = (k.gorev || '').toLowerCase()
          return g.includes('harcama yetkili')
        })

        if (harcamaRow) {
          hasHarcamaRowInFile = true
          const isHarcamaVisible = TemplateRegistryService.isMemberVisibleInDocument(
            harcamaRow,
            targetDocIds
          )
          if (isHarcamaVisible && (harcamaRow.ad_soyad || harcamaRow.personel_id)) {
            baseData.harcamaYetkilisiAdi = harcamaRow.ad_soyad || ''
            baseData.harcamaYetkilisiUnvan = harcamaRow.unvan || 'Harcama Yetkilisi'
            baseData.onaylayanPersonelAdi = harcamaRow.ad_soyad || ''
            baseData.onaylayanPersonelUnvan = harcamaRow.unvan || 'Harcama Yetkilisi'
          } else {
            baseData.harcamaYetkilisiAdi = ''
            baseData.harcamaYetkilisiUnvan = ''
            baseData.onaylayanPersonelAdi = ''
            baseData.onaylayanPersonelUnvan = ''
          }
        }

        // 3. Gerçekleştirme Görevlisi (Teklif Eden / Hazırlayan)
        const gerceklestirmeRow = dbKomisyonlar.find((k: any) => {
          const g = (k.gorev || '').toLowerCase()
          return (
            g.includes('gerçekleştirme') || g.includes('gerceklestirme') || g.includes('hazırlayan')
          )
        })

        if (gerceklestirmeRow) {
          hasGerceklestirmeRowInFile = true
          const isGerceklestirmeVisible = TemplateRegistryService.isMemberVisibleInDocument(
            gerceklestirmeRow,
            targetDocIds
          )
          if (
            isGerceklestirmeVisible &&
            (gerceklestirmeRow.ad_soyad || gerceklestirmeRow.personel_id)
          ) {
            baseData.hazirlayanPersonelAdi = gerceklestirmeRow.ad_soyad || ''
            baseData.hazirlayanPersonelUnvan = gerceklestirmeRow.unvan || 'Gerçekleştirme Görevlisi'
            baseData.gerceklestirmeGorevlisiAdi = gerceklestirmeRow.ad_soyad || ''
            baseData.gerceklestirmeGorevlisiUnvan =
              gerceklestirmeRow.unvan || 'Gerçekleştirme Görevlisi'
          } else {
            baseData.hazirlayanPersonelAdi = ''
            baseData.hazirlayanPersonelUnvan = ''
            baseData.gerceklestirmeGorevlisiAdi = ''
            baseData.gerceklestirmeGorevlisiUnvan = ''
          }
        }

        // 4. Komisyon listeleri (Yedek üye kuralları ve İmza / Paraf / Koordinasyon ayrımı ile)
        const currentDocId = String(resolvedId || selectedDocId || targetDocTemplateId || '').toLowerCase()
        const isApptDoc = isCommissionAppointmentDocument(targetDocIds.length > 0 ? targetDocIds : currentDocId)
        const isMuayeneDoc = currentDocId.includes('muayene') || currentDocId.includes('kabul')

        const maliyetMembers = dbKomisyonlar.filter((k: any) => {
          if (!TemplateRegistryService.isMemberVisibleInDocument(k, targetDocIds)) return false
          return resolveCommissionCategory(k) === 'maliyet'
        })

        const muayeneMembers = dbKomisyonlar.filter((k: any) => {
          if (!TemplateRegistryService.isMemberVisibleInDocument(k, targetDocIds)) return false
          return resolveCommissionCategory(k) === 'muayene'
        })

        if (maliyetMembers.length > 0) {
          const deduplicatedMaliyet = dedupeMembers(maliyetMembers)
          const distMaliyet = distributeCommissionMembersBySignatureType(deduplicatedMaliyet, {
            docId: targetDocIds.length > 0 ? targetDocIds : currentDocId,
            defaultRole: 'Fiyat Araştırma Görevlisi',
            existingRota: Array.isArray(baseData.rota) ? baseData.rota : []
          })

          // Görevlendirme oluru belgelerinde tüm uygun üyeler (İmza + Paraf + Koordinasyon) tabloda gösterilir;
          // tutanak ve karar belgelerinde ıslak imza alanına yalnızca 'İmza' türündeki üyeler yerleşir.
          const formattedMaliyet = isApptDoc
            ? distMaliyet.allEligibleMembers
            : distMaliyet.wetSignatureMembers

          baseData.fiyatKomisyonu = formattedMaliyet
          if (!isMuayeneDoc) {
            const activeOfficers = formattedMaliyet.filter((m: any) => {
              const combined = `${m.adSoyad || ''} ${m.unvan || ''} ${m.gorev || ''}`.toLowerCase()
              return (
                !combined.includes('harcama yetkili') &&
                !combined.includes('gerçekleştirme') &&
                !combined.includes('gerceklestirme') &&
                !combined.includes('muhasebe') &&
                !combined.includes('satın alma harcama') &&
                !combined.includes('talep eden') &&
                !combined.includes('hazırlayan') &&
                !combined.includes('onaylayan')
              )
            })
            baseData.gorevlendirilenler =
              activeOfficers.length > 0 ? activeOfficers : formattedMaliyet
            baseData.gorevliler = baseData.gorevlendirilenler
            baseData.dagitimListesi = baseData.gorevlendirilenler

            if (
              !isApptDoc &&
              (distMaliyet.parafMembers.length > 0 || distMaliyet.koordinasyonMembers.length > 0)
            ) {
              baseData.rota = distMaliyet.rotaSteps
            }
          }
        }

        if (muayeneMembers.length > 0) {
          const deduplicatedMuayene = dedupeMembers(muayeneMembers)
          const distMuayene = distributeCommissionMembersBySignatureType(deduplicatedMuayene, {
            docId: targetDocIds.length > 0 ? targetDocIds : currentDocId,
            defaultRole: 'Üye',
            existingRota: Array.isArray(baseData.rota) ? baseData.rota : []
          })

          const formattedMuayene = isApptDoc
            ? distMuayene.allEligibleMembers
            : distMuayene.wetSignatureMembers

          baseData.muayeneKomisyonu = formattedMuayene
          if (isMuayeneDoc) {
            baseData.gorevlendirilenler = formattedMuayene
            baseData.gorevliler = formattedMuayene
            baseData.dagitimListesi = formattedMuayene

            if (
              !isApptDoc &&
              (distMuayene.parafMembers.length > 0 || distMuayene.koordinasyonMembers.length > 0)
            ) {
              baseData.rota = distMuayene.rotaSteps
            }
          }
        }
      }
    } catch (e) {
      console.error('DATA_TeminKomisyon preview query error:', e)
    }
  }

  // Global Komisyon Yönetimi Fallback
  let globalKomisyonlar: any[] = []
  try {
    globalKomisyonlar = await queryExecutor(
      `SELECT u.*, p.ad_soyad, p.unvan, g.ad as gorev, k.ad as komisyon_adi, k.id as komisyon_id
       FROM TANIM_KomisyonUye u
       LEFT JOIN TANIM_Personel p ON u.personel_id = p.id
       LEFT JOIN TANIM_KomisyonGorevi g ON u.gorev_id = g.id
       LEFT JOIN TANIM_Komisyon k ON u.komisyon_id = k.id
       WHERE u.personel_id IS NOT NULL
       ORDER BY u.sira ASC, u.id ASC`,
      []
    )
  } catch (err) {
    console.error('Global komisyon query error in preview:', err)
  }

  if (globalKomisyonlar && globalKomisyonlar.length > 0) {
    if (
      !hasMuhasebeRowInFile &&
      (!baseData.mutemetAdi || baseData.mutemetAdi === '......' || !baseData.muhasebeYetkilisiAdi)
    ) {
      const mRow = globalKomisyonlar.find((k: any) => {
        const g = (k.gorev || '').toLowerCase()
        return g.includes('muhasebe') || g.includes('mutemet')
      })
      if (
        mRow &&
        TemplateRegistryService.isMemberVisibleInDocument(mRow, targetDocIds) &&
        mRow.ad_soyad
      ) {
        const cleanName = mRow.ad_soyad.split('(')[0].trim()
        if (!baseData.mutemetAdi || baseData.mutemetAdi === '......') {
          baseData.mutemetAdi = cleanName
          baseData.mutemetUnvan = mRow.unvan || 'Muhasebe Yetkilisi'
        }
        baseData.muhasebeYetkilisiAdi = baseData.muhasebeYetkilisiAdi || cleanName
        baseData.muhasebeYetkilisiUnvan =
          baseData.muhasebeYetkilisiUnvan || mRow.unvan || 'Muhasebe Yetkilisi'
        baseData.muhasebeYetkilisi = baseData.muhasebeYetkilisi || cleanName
      }
    }

    if (dosyaObj.onay_personel_id) {
      const op = (personelList || []).find((p: any) => p.id === dosyaObj.onay_personel_id)
      if (op) {
        baseData.onaylayanPersonelAdi = op.ad_soyad
        baseData.onaylayanPersonelUnvan = op.unvan || 'Harcama Yetkilisi'
        baseData.harcamaYetkilisiAdi = op.ad_soyad
        baseData.harcamaYetkilisiUnvan = op.unvan || 'Harcama Yetkilisi'
        baseData.baskanAdi = op.ad_soyad
        baseData.baskanUnvan = op.unvan || 'Harcama Yetkilisi'
      }
    } else if (
      !hasHarcamaRowInFile &&
      (!baseData.onaylayanPersonelAdi || !baseData.harcamaYetkilisiAdi)
    ) {
      const hRow = globalKomisyonlar.find((k: any) =>
        (k.gorev || '').toLowerCase().includes('harcama yetkili')
      )
      if (
        hRow &&
        TemplateRegistryService.isMemberVisibleInDocument(hRow, targetDocIds) &&
        hRow.ad_soyad
      ) {
        baseData.onaylayanPersonelAdi = baseData.onaylayanPersonelAdi || cleanPersonelName(hRow.ad_soyad)
        baseData.onaylayanPersonelUnvan =
          baseData.onaylayanPersonelUnvan || hRow.unvan || 'Harcama Yetkilisi'
        baseData.harcamaYetkilisiAdi = baseData.harcamaYetkilisiAdi || cleanPersonelName(hRow.ad_soyad)
        baseData.harcamaYetkilisiUnvan =
          baseData.harcamaYetkilisiUnvan || hRow.unvan || 'Harcama Yetkilisi'
      }
    }

    // Kurum Seviyesi Antet veya Harcama Yetkilisi Fallback Çözümlemesi
    const isKurumLevelAntet =
      !baseData.antetSatirlari ||
      baseData.antetSatirlari.length <= 2 ||
      dosyaObj?.antet_birim_gosterilsin === 0 ||
      dosyaObj?.antet_birim_gosterilsin === '0'

    const fallbackHarcamaAdi = ctx?.harcamaYetkilisiAdi || ''
    const fallbackHarcamaUnvan = ctx?.harcamaYetkilisiUnvan || 'Harcama Yetkilisi'

    if (fallbackHarcamaAdi) {
      if (isKurumLevelAntet && !dosyaObj.onay_personel_id && !hasHarcamaRowInFile) {
        baseData.harcamaYetkilisiAdi = fallbackHarcamaAdi
        baseData.harcamaYetkilisiUnvan = fallbackHarcamaUnvan
        if (!baseData.onaylayanPersonelAdi) {
          baseData.onaylayanPersonelAdi = fallbackHarcamaAdi
          baseData.onaylayanPersonelUnvan = fallbackHarcamaUnvan
        }
      } else if (!baseData.harcamaYetkilisiAdi) {
        baseData.harcamaYetkilisiAdi = fallbackHarcamaAdi
        baseData.harcamaYetkilisiUnvan = baseData.harcamaYetkilisiUnvan || fallbackHarcamaUnvan
        if (!baseData.onaylayanPersonelAdi) {
          baseData.onaylayanPersonelAdi = fallbackHarcamaAdi
          baseData.onaylayanPersonelUnvan = baseData.harcamaYetkilisiUnvan
        }
      }
    }

    if (dosyaObj.hazirlayan_personel_id || dosyaObj.sunan_personel_id) {
      const targetHazId = dosyaObj.hazirlayan_personel_id || dosyaObj.sunan_personel_id
      const hp = (personelList || []).find((p: any) => p.id === targetHazId)
      if (hp) {
        baseData.hazirlayanPersonelAdi = hp.ad_soyad
        baseData.hazirlayanPersonelUnvan = hp.unvan || 'Gerçekleştirme Görevlisi'
        baseData.gerceklestirmeGorevlisiAdi = hp.ad_soyad
        baseData.gerceklestirmeGorevlisiUnvan = hp.unvan || 'Gerçekleştirme Görevlisi'
      }
    } else if (
      !hasGerceklestirmeRowInFile &&
      (!baseData.hazirlayanPersonelAdi || !baseData.gerceklestirmeGorevlisiAdi)
    ) {
      const gRow = globalKomisyonlar.find((k: any) => {
        const g = (k.gorev || '').toLowerCase()
        return (
          g.includes('gerçekleştirme') || g.includes('gerceklestirme') || g.includes('hazırlayan')
        )
      })
      if (
        gRow &&
        TemplateRegistryService.isMemberVisibleInDocument(gRow, targetDocIds) &&
        gRow.ad_soyad
      ) {
        baseData.hazirlayanPersonelAdi = baseData.hazirlayanPersonelAdi || cleanPersonelName(gRow.ad_soyad)
        baseData.hazirlayanPersonelUnvan =
          baseData.hazirlayanPersonelUnvan || gRow.unvan || 'Gerçekleştirme Görevlisi'
        baseData.gerceklestirmeGorevlisiAdi = baseData.gerceklestirmeGorevlisiAdi || cleanPersonelName(gRow.ad_soyad)
        baseData.gerceklestirmeGorevlisiUnvan =
          baseData.gerceklestirmeGorevlisiUnvan || gRow.unvan || 'Gerçekleştirme Görevlisi'
      }
    }

    if (dosyaObj.talep_eden_personel_id) {
      const tp = (personelList || []).find((p: any) => p.id === dosyaObj.talep_eden_personel_id)
      if (tp) {
        baseData.talepEdenPersonelAdi = tp.ad_soyad
        baseData.talepEdenPersonelUnvan = tp.unvan || 'Talep Eden'
      }
    }
  }

  if (
    !hasMuhasebeRowInFile &&
    (!baseData.mutemetAdi || baseData.mutemetAdi === '......' || !baseData.muhasebeYetkilisiAdi)
  ) {
    const pMuhasebe = (personelList || []).find((p: any) => {
      const u = `${p.unvan || ''} ${p.gorev || ''} ${p.birim || ''}`.toLowerCase()
      return u.includes('muhasebe') || u.includes('mutemet')
    })
    if (pMuhasebe && pMuhasebe.ad_soyad) {
      const cleanName = pMuhasebe.ad_soyad.split('(')[0].trim()
      if (!baseData.mutemetAdi || baseData.mutemetAdi === '......') {
        baseData.mutemetAdi = cleanName
        baseData.mutemetUnvan = pMuhasebe.unvan || 'Muhasebe Yetkilisi'
      }
      baseData.muhasebeYetkilisiAdi = baseData.muhasebeYetkilisiAdi || cleanName
      baseData.muhasebeYetkilisiUnvan =
        baseData.muhasebeYetkilisiUnvan || pMuhasebe.unvan || 'Muhasebe Yetkilisi'
      baseData.muhasebeYetkilisi = baseData.muhasebeYetkilisi || cleanName
    }
  }

  if (
    !baseData.fiyatKomisyonu ||
    (Array.isArray(baseData.fiyatKomisyonu) && baseData.fiyatKomisyonu.length === 0)
  ) {
    if (ctx.fiyatKomisyonu && ctx.fiyatKomisyonu.length > 0) {
      baseData.fiyatKomisyonu = ctx.fiyatKomisyonu
      const activeFromCtx = ctx.fiyatKomisyonu.filter((m: any) => {
        const combined =
          `${m.adSoyad || m.ad_soyad || ''} ${m.unvan || ''} ${m.gorev || m.gorevi || ''}`.toLowerCase()
        return (
          !combined.includes('harcama yetkili') &&
          !combined.includes('gerçekleştirme') &&
          !combined.includes('gerceklestirme') &&
          !combined.includes('muhasebe') &&
          !combined.includes('satın alma harcama') &&
          !combined.includes('talep eden') &&
          !combined.includes('hazırlayan') &&
          (m.adSoyad || m.ad_soyad)
        )
      })
      baseData.gorevlendirilenler = activeFromCtx.length > 0 ? activeFromCtx : ctx.fiyatKomisyonu
      baseData.gorevliler = baseData.gorevlendirilenler
      baseData.dagitimListesi = baseData.gorevlendirilenler
    } else if (globalKomisyonlar && globalKomisyonlar.length > 0) {
      const gMaliyet = globalKomisyonlar.filter((g: any) => {
        if (!TemplateRegistryService.isMemberVisibleInDocument(g, targetDocIds)) return false
        return resolveCommissionCategory(g) === 'maliyet'
      })
      if (gMaliyet.length > 0) {
        const currentDocId = String(resolvedId || selectedDocId || targetDocTemplateId || '').toLowerCase()
        const isApptDoc = isCommissionAppointmentDocument(
          targetDocIds.length > 0 ? targetDocIds : currentDocId
        )
        const distGlobalMaliyet = distributeCommissionMembersBySignatureType(
          dedupeMembers(gMaliyet),
          {
            docId: targetDocIds.length > 0 ? targetDocIds : currentDocId,
            defaultRole: 'Fiyat Araştırma Görevlisi',
            existingRota: Array.isArray(baseData.rota) ? baseData.rota : []
          }
        )
        const formatted = isApptDoc
          ? distGlobalMaliyet.allEligibleMembers
          : distGlobalMaliyet.wetSignatureMembers

        baseData.fiyatKomisyonu = formatted
        const activeOfficers = formatted.filter((m: any) => {
          const combined = `${m.adSoyad || ''} ${m.unvan || ''} ${m.gorev || ''}`.toLowerCase()
          return (
            !combined.includes('harcama yetkili') &&
            !combined.includes('gerçekleştirme') &&
            !combined.includes('gerceklestirme') &&
            !combined.includes('muhasebe') &&
            !combined.includes('satın alma harcama') &&
            !combined.includes('talep eden') &&
            !combined.includes('hazırlayan') &&
            !combined.includes('onaylayan')
          )
        })
        baseData.gorevlendirilenler = activeOfficers.length > 0 ? activeOfficers : formatted
        baseData.gorevliler = baseData.gorevlendirilenler
        baseData.dagitimListesi = baseData.gorevlendirilenler
      }
    }
  }

  if (
    !baseData.muayeneKomisyonu ||
    (Array.isArray(baseData.muayeneKomisyonu) && baseData.muayeneKomisyonu.length === 0)
  ) {
    if (ctx.muayeneKomisyonu && ctx.muayeneKomisyonu.length > 0) {
      baseData.muayeneKomisyonu = ctx.muayeneKomisyonu
    }
  }
  if (!baseData.komisyon || (Array.isArray(baseData.komisyon) && baseData.komisyon.length === 0)) {
    if (ctx.komisyon && ctx.komisyon.length > 0) {
      baseData.komisyon = ctx.komisyon
    } else if (baseData.fiyatKomisyonu && baseData.fiyatKomisyonu.length > 0) {
      baseData.komisyon = baseData.fiyatKomisyonu
    }
  }

  // Deduplicate all commission member lists
  baseData.fiyatKomisyonu = Array.isArray(baseData.fiyatKomisyonu)
    ? dedupeMembers(baseData.fiyatKomisyonu)
    : []
  baseData.gorevlendirilenler = Array.isArray(baseData.gorevlendirilenler)
    ? dedupeMembers(baseData.gorevlendirilenler)
    : []
  baseData.gorevliler = Array.isArray(baseData.gorevliler) ? dedupeMembers(baseData.gorevliler) : []
  baseData.dagitimListesi = Array.isArray(baseData.dagitimListesi)
    ? dedupeMembers(baseData.dagitimListesi)
    : []
  baseData.muayeneKomisyonu = Array.isArray(baseData.muayeneKomisyonu)
    ? dedupeMembers(baseData.muayeneKomisyonu)
    : []
  baseData.komisyon = Array.isArray(baseData.komisyon) ? dedupeMembers(baseData.komisyon) : []
}
