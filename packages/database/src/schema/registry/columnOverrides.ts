import type { LogicalColumnType } from '../types';

export interface ColumnOverride {
  readonly logicalType: LogicalColumnType;
  readonly scale?: number;
  readonly precision?: number;
  readonly isFinancial?: boolean;
  readonly description?: string;
}

/**
 * 55 tablonun fiziksel SQLite tiplerinden çıkarılamayan veya hassasiyet gerektiren
 * tüm kolonlarının açık eşleme defteri (TableName -> ColumnName -> ColumnOverride).
 */
export const COLUMN_OVERRIDE_REGISTRY: Record<string, Record<string, ColumnOverride>> = {
  // 1. AMBAR VE DEPO YÖNETİMİ
  DATA_AmbarHareket: {
    miktar: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false, description: 'İşlem Miktarı' },
    birim_fiyat: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true, description: 'Birim Fiyat' },
    toplam_tutar: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true, description: 'Toplam Tutar' },
  },
  DATA_AmbarStok: {
    toplam_miktar: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false, description: 'Toplam stok miktarı' },
    birim_fiyat: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true, description: 'Son birim fiyat' },
  },

  // 2. İHALE DOSYALARI (İHALE 360)
  DATA_IhaleDosyasi: {
    yaklasik_maliyet: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    sozlesme_bedeli: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    kesinti_damga: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    kesinti_karar_pulu: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    kesinti_kdv_tevkifat: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    net_odenen: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    dosya_tarihi: { logicalType: 'date' },
    sozlesme_tarihi: { logicalType: 'date' },
    ihale_tarihi: { logicalType: 'datetime' },
  },
  DATA_IhaleFirma: {
    toplam_teklif: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    indirim_orani: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    gecici_teminat_tutari: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    kesin_teminat_tutari: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    teklif_verdi_mi: { logicalType: 'boolean' },
    kazandi_mi: { logicalType: 'boolean' },
  },
  DATA_IhaleKalem: {
    miktar: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    kdv_orani: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
  },

  // 3. İHTİYAÇ RAPORLARI
  DATA_IhtiyacRaporu: {
    tahmini_toplam_tutar: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    rapor_tarihi: { logicalType: 'date' },
  },
  DATA_IhtiyacRaporuKalem: {
    miktar: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    kdv_orani: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    tahmini_birim_fiyat: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
  },

  // 4. DOĞRUDAN TEMİN (TEMİN 360)
  DATA_TeminDosyasi: {
    yaklasik_maliyet: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    dosya_acilis_tarihi: { logicalType: 'date' },
    tamamlandi_mi: { logicalType: 'boolean' },
    tags: { logicalType: 'json' },
  },
  DATA_TeminFirma: {
    teklif_toplami: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    teklif_verdi_mi: { logicalType: 'boolean' },
    kazandi_mi: { logicalType: 'boolean' },
  },
  DATA_TeminKalem: {
    miktar: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    kdv_orani: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
  },
  DATA_TeminKalemTeklif: {
    birim_fiyat: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    kdv_tutari: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    teklif_verildi_mi: { logicalType: 'boolean' },
  },
  DATA_TeminBelgeSnapshot: {
    veri_json: { logicalType: 'json' },
    is_active: { logicalType: 'boolean' },
    is_deleted: { logicalType: 'boolean' },
  },
  DATA_DosyaRevizyon: {
    veri_json: { logicalType: 'json' },
  },
  DATA_DosyaSablonVeri: {
    veri_json: { logicalType: 'json' },
  },
  DATA_NotVeGorev: {
    tamamlandi_mi: { logicalType: 'boolean' },
    sabitlendi_mi: { logicalType: 'boolean' },
    hatirlatici_tarihi: { logicalType: 'datetime' },
  },
  DATA_KutuphaneBelge: {
    etiketler: { logicalType: 'json' },
    favori_mi: { logicalType: 'boolean' },
    arsiv_mi: { logicalType: 'boolean' },
  },
  DATA_KutuphaneBelgeSurum: {
    kosullar_json: { logicalType: 'json' },
  },

  // 5. TAŞINIR İŞLEM FİŞİ (TİF)
  DATA_TIF: {
    tif_tarihi: { logicalType: 'date' },
  },
  DATA_TIF_Kalem: {
    miktar: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    birim_fiyat: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
  },

  // 6. TANIMLAR VE PARAMETRELER
  TANIM_BirimDonusum: {
    donusum_faktoru: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
  },
  TANIM_ButceOdenek: {
    yillik_odenek: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
  },
  TANIM_Kalem: {
    kdv_orani: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    personel_asgari_fark_oran: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_KikLimitDonemleri: {
    buyuksehir_limit: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    diger_limit: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    md21f_limit: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    baslangic_tarihi: { logicalType: 'date' },
    bitis_tarihi: { logicalType: 'date' },
  },
  TANIM_Mevzuat: {
    limit_buyuksehir: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    limit_diger: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    kdv_oran_1: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    kdv_oran_2: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    kdv_oran_3: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
    gecerlilik_baslangic: { logicalType: 'date' },
    gecerlilik_bitis: { logicalType: 'date' },
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_OlcuBirimi: {
    donusum_faktoru: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: false },
  },
  TANIM_Poz: {
    birim_fiyat: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
  },
  TANIM_Proje: {
    toplam_butce: { logicalType: 'decimal', scale: 4, precision: 18, isFinancial: true },
    baslangic_tarihi: { logicalType: 'date' },
    bitis_tarihi: { logicalType: 'date' },
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_Firma: {
    kara_listede_mi: { logicalType: 'boolean' },
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_Kurum: {
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_Personel: {
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_Asama: {
    zorunlu_mu: { logicalType: 'boolean' },
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_AlimTuru: {
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_Ambar: {
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_Komisyon: {
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_Komisyon_Sablon: {
    aktif_mi: { logicalType: 'boolean' },
  },
  TANIM_Sablon: {
    aktif_mi: { logicalType: 'boolean' },
  },
  LOG_SystemLog: {
    detay_json: { logicalType: 'json' },
    created_at: { logicalType: 'datetime' },
  },
};
