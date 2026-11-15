/**
 * @fileoverview `@temin360/document-templates`
 *
 * Kamu İhale Kanunu (4734 sayılı KİK), Doğrudan Temin Tebliği (Mevzuat No: 40666) ve
 * Resmî Yazışma Yönetmeliği standartlarına tam uyumlu A4 belge şablonları, tip şemaları,
 * imza rota sicili ve belge çözümleme kütüphanesi.
 *
 * ---
 * ### 🏛️ TEMEL MİMARİ İLKELER & KURALLAR
 *
 * 1. **Sayfa Yönü (Page Orientation):**
 *    - Varsayılan olarak belgeler A4 Dikey (`portrait`) olarak üretilir (Genişlik: 210mm, Yükseklik: 297mm).
 *    - Çok kolonlu tablolar içeren belgeler (örneğin *Piyasa Fiyat Araştırma Tutanağı*, *Yaklaşık Maliyet Cetveli*)
 *      veya geniş cetveller A4 Yatay (`landscape`) yönünde çizilir (Genişlik: 297mm, Yükseklik: 210mm).
 *
 * 2. **Kurum İçi vs. Kurum Dışı Yazışma (`kurumIci` Kuralı):**
 *    - **Varsayılan Değer:** Kamu doğrudan temin süreçlerinde hazırlanan evrakların %90+'ı idare içi
 *      harcama birimleri arasında dolaştığı için genel olarak **`kurumIci: true` (varsayılan)** kabul edilir.
 *    - **Kurum İçi (`kurumIci: true`):** Harcama birimi ile Harcama Yetkilisi, Mali Hizmetler,
 *      Ambar ve Piyasa Araştırma Görevlileri arasındaki iç yazışmalardır. Resmî Yazışma Yönetmeliği
 *      uyarınca alt bilgiye (footer) dış iletişim bilgileri (KEP, telefon, web, faks) basılmaz; yalnızca
 *      sayfa numarası, paraf ve belge doğrulama kodu yer alır.
 *    - **Kurum Dışı (`kurumIci: false`):** Dış piyasadaki isteklilere ve firmalara gönderilen
 *      yazılardır (*Piyasa Fiyat Araştırma Mektubu*, *Teklif İsteme*, *Sözleşmeye Davet / Sipariş Mektubu*).
 *      Bu belgelerde idarenin iletişim adresleri, telefon, KEP ve e-posta anteti alt bilgide gösterilir.
 *
 * 3. **İmza Blokları & Rota Hiyerarşisi:**
 *    - Harcama Yetkilisi, Gerçekleştirme Görevlisi, Piyasa Araştırma Görevlileri, Ambar Memuru ve
 *      Muayene Kabul Komisyonu üyeleri `route.definition.ts` kontratları üzerinden çözümlenir.
 *
 * @packageDocumentation
 */

// ============================================================================
// 1. TEMEL ŞEMALAR, TİPLER VE TEMA KONFİGÜRASYONU
// ============================================================================

/**
 * Belge şablonlarının ortak taban veri şeması (`baseDocumentSchema`) ve tipleri.
 * `evrakSayisi`, `tarih`, `kurumIci`, `sayfaYonu`, `olurYazisi`, logolar ve antet alanlarını içerir.
 */
export * from "./base.schema";

/**
 * A4 sayfa ölçüleri (mm/pt), tipografi hiyerarşisi, satır aralıkları ve kurumsal tema ayarları.
 */
export * from "./theme.config";

/**
 * Şablon anahtar tipleri (`TemplateKey`), bileşen tanımları ve genel TypeScript arayüzleri.
 */
export * from "./types";


// ============================================================================
// 2. BELGE YAPITAŞLARI & ATOMİK BİLEŞENLER (DOCUMENT ATOMS)
// ============================================================================

/**
 * A4 sayfa çerçevesi, margin hesaplaması, `portrait`/`landscape` yönlendirme ve sayfa bölme konteyneri.
 */
export * from "./document/DocumentLayout";

/**
 * Resmî Yazışma Yönetmeliğine tam uyumlu T.C. anteti, harcama birimi başlığı ve kurum logoları.
 */
export * from "./document/DocumentHeader";

/**
 * Belge alt bilgisi. `kurumIci: false` durumunda kurum iletişim/KEP bilgilerini, `kurumIci: true` durumunda parafı çizer.
 */
export * from "./document/DocumentFooter";

/**
 * Resmî A4 tablo bileşeni, pozisyonlama ve hücre hizalama kuralları.
 */
export * from "./document/DocumentTable";

/**
 * Resmî imza blokları, Harcama Yetkilisi OLUR bloğu ve komisyon imza matrisi.
 */
export * from "./document/ApprovalSignature";

/**
 * Canlı A4 düzenleme modu (Live Inline Editing) metin ve sayı kutusu bileşeni.
 */
export * from "./document/EditableField";

/**
 * Canlı belge düzenleme context sağlayıcısı ve state köprüsü.
 */
export * from "./document/TemplateEditContext";

/**
 * Dinamik sayfa bölme ve satır dengeleme ayırıcı bileşeni (`TableRowSplitDivider`).
 */
export * from "./document/TableRowSplitDivider";

/**
 * Dinamik sayfalama motoru (`paginateData`) ve imza bloğunu koruyan akıllı limit algoritması (`resolveSignatureAwareLimits`).
 */
export * from "./document/DynamicPaginatedTable";

/**
 * Parasal tutarları Türkçe resmî evrak formatında yazıya çeviren yardımcı motor (örn: "YALNIZ ONİKİBİN TL").
 */
export * from "./document/sayiyiYaziyaCevir";

/**
 * Tarih biçimlendirme (`toTrDate`), metin temizleme ve ortak yardımcı fonksiyonlar.
 */
export * from "./utils";

/**
 * Kurumsal antet çözümleme otoritesi (`InstitutionalHeaderProvider`).
 */
export * from "./header";


// ============================================================================
// 3. DOĞRUDAN TEMİN BELGE ŞABLONLARI & ŞEMALARI (TEMPLATES & SCHEMAS)
// ============================================================================

// --- 1. Hazırlık & İhtiyaç Tespiti ---
export * from "./templates/ihtiyac-listesi/IhtiyacListesi.hook";
export * from "./templates/ihtiyac-listesi/IhtiyacListesi.schema";
export * from "./templates/ihtiyac-listesi/IhtiyacListesi.template";

export * from "./templates/ihtiyac-talep-formu/IhtiyacTalepFormu.schema";
export * from "./templates/ihtiyac-talep-formu/IhtiyacTalepFormu.template";

export * from "./templates/luzum-muzekkeresi/LuzumMuzekkeresi.schema";
export * from "./templates/luzum-muzekkeresi/LuzumMuzekkeresi.template";

export * from "./templates/luzum-muzekkeresi-onay-eki/LuzumMuzekkeresiOnayEki.schema";
export * from "./templates/luzum-muzekkeresi-onay-eki/LuzumMuzekkeresiOnayEki.template";

export * from "./templates/luzum-muzekkeresi-teslim-tesellum/LuzumMuzekkeresiTeslimTesellum.schema";
export * from "./templates/luzum-muzekkeresi-teslim-tesellum/LuzumMuzekkeresiTeslimTesellum.template";

export * from "./templates/tasinir-kayit-yetkilisi-gorusu/TasinirKayitYetkilisiGorusu.schema";
export * from "./templates/tasinir-kayit-yetkilisi-gorusu/TasinirKayitYetkilisiGorusu.template";

export * from "./templates/butce-sorgusu/ButceSorgusu.schema";
export * from "./templates/butce-sorgusu/ButceSorgusu.template";

export * from "./templates/teknik-sartname/TeknikSartname.schema";
export * from "./templates/teknik-sartname/TeknikSartname.template";

// --- 2. Yaklaşık Maliyet & Piyasa Fiyat Araştırması ---
export * from "./templates/yaklasik-maliyet-cetveli/YaklasikMaliyetCetveli.hook";
export * from "./templates/yaklasik-maliyet-cetveli/YaklasikMaliyetCetveli.schema";
export * from "./templates/yaklasik-maliyet-cetveli/YaklasikMaliyetCetveli.template";

export * from "./templates/son-alim-fiyat-cetveli/SonAlimFiyatCetveli.schema";
export * from "./templates/son-alim-fiyat-cetveli/SonAlimFiyatCetveli.template";

export * from "./templates/arastirma-mektubu/ArastirmaMektubu.schema";
export * from "./templates/arastirma-mektubu/ArastirmaMektubu.template";

export * from "./templates/fiyat-arastirma-mektubu/FiyatArastirmaMektubu.schema";
export * from "./templates/fiyat-arastirma-mektubu/FiyatArastirmaMektubu.template";

export * from "./templates/birim-fiyat-teklif-mektubu/BirimFiyatTeklifMektubu.schema";
export * from "./templates/birim-fiyat-teklif-mektubu/BirimFiyatTeklifMektubu.template";

export * from "./templates/piyasa-fiyat-arastirma-gorevlendirmesi/PiyasaFiyatArastirmaGorevlendirmesi.schema";
export * from "./templates/piyasa-fiyat-arastirma-gorevlendirmesi/PiyasaFiyatArastirmaGorevlendirmesi.template";

export * from "./templates/piyasa-fiyat-arastirma-tutanagi/PiyasaFiyatArastirmaTutanagi.hook";
export * from "./templates/piyasa-fiyat-arastirma-tutanagi/PiyasaFiyatArastirmaTutanagi.schema";
export * from "./templates/piyasa-fiyat-arastirma-tutanagi/PiyasaFiyatArastirmaTutanagi.template";

// --- 3. Harcama Talimatı, Onay & Sözleşme ---
export * from "./templates/harcama-talimati/HarcamaTalimati.schema";
export * from "./templates/harcama-talimati/HarcamaTalimati.template";

export * from "./templates/dogrudan-temin-onay-belgesi/DogrudanTeminOnayBelgesi.schema";
export * from "./templates/dogrudan-temin-onay-belgesi/DogrudanTeminOnayBelgesi.template";

export * from "./templates/kabul-edilen-teklif/KabulEdilenTeklif.schema";
export * from "./templates/kabul-edilen-teklif/KabulEdilenTeklif.template";

export * from "./templates/sozlesmeye-davet/SozlesmeyeDavet.schema";
export * from "./templates/sozlesmeye-davet/SozlesmeyeDavet.template";

export * from "./templates/dogrudan-temin-sozlesmesi/DogrudanTeminSozlesmesi.schema";
export * from "./templates/dogrudan-temin-sozlesmesi/DogrudanTeminSozlesmesi.template";

export * from "./templates/harcama-pusulasi/HarcamaPusulasi.schema";
export * from "./templates/harcama-pusulasi/HarcamaPusulasi.template";

// --- 4. Komisyon & Muayene Kabul ---
export * from "./templates/komisyon-gorevlendirme-onayi/KomisyonGorevlendirmeOnayi.schema";
export * from "./templates/komisyon-gorevlendirme-onayi/KomisyonGorevlendirmeOnayi.template";

export * from "./templates/komisyon-gorevlendirme-onayi-eki/KomisyonGorevlendirmeOnayiEki.schema";
export * from "./templates/komisyon-gorevlendirme-onayi-eki/KomisyonGorevlendirmeOnayiEki.template";

export * from "./templates/muayene-kabul-komisyonu/MuayeneKabulKomisyonu.schema";
export * from "./templates/muayene-kabul-komisyonu/MuayeneKabulKomisyonu.template";

export * from "./templates/muayene-kabul-tutanagi/MuayeneKabulTutanagi.schema";
export * from "./templates/muayene-kabul-tutanagi/MuayeneKabulTutanagi.template";

export * from "./templates/odeme-yazisi/OdemeYazisi.schema";
export * from "./templates/odeme-yazisi/OdemeYazisi.template";

// --- 5. Yapım İşleri Resmî Kabul Tutanakları (KİK Standart Formları) ---
export * from "./templates/kik048-yapim-gecici-kabul-teklif/Kik048YapimGeciciKabulTeklif.schema";
export * from "./templates/kik048-yapim-gecici-kabul-teklif/Kik048YapimGeciciKabulTeklif.template";

export * from "./templates/kik049-yapim-gecici-kabul-tutanagi/Kik049YapimGeciciKabulTutanagi.schema";
export * from "./templates/kik049-yapim-gecici-kabul-tutanagi/Kik049YapimGeciciKabulTutanagi.template";

export * from "./templates/kik050-yapim-kesin-kabul-teklif/Kik050YapimKesinKabulTeklif.schema";
export * from "./templates/kik050-yapim-kesin-kabul-teklif/Kik050YapimKesinKabulTeklif.template";

export * from "./templates/kik051-yapim-kesin-kabul-tutanagi/Kik051YapimKesinKabulTutanagi.schema";
export * from "./templates/kik051-yapim-kesin-kabul-tutanagi/Kik051YapimKesinKabulTutanagi.template";


// ============================================================================
// 4. VERİ ÇÖZÜMLEME HATTI & HARİTALAMA (RESOLVER ENGINE)
// ============================================================================

/**
 * Deklaratif SQL ve veri haritalama tipleri (`data.mapping.ts` sözleşmesi).
 */
export * from "./resolver/types";

/**
 * Genel şablon veri çözümleyicisi (`resolveTemplateData`).
 */
export * from "./resolver/mappingResolver";

/**
 * Şablon kayıt defteri üzerinden genel çözümleme yürüten `TemplateResolver` sınıfı.
 */
export * from "./resolver/TemplateResolver";


// ============================================================================
// 5. İŞ AKIŞI PROFİLLERİ, ROLLER VE MERKEZİ SABİTLER
// ============================================================================

export * from "./constants/workflowProfiles";
export * from "./constants/template-constants";
export * from "./constants/all-templates.mapping";
export * from "./constants/visibility.config";
export * from "./constants/editable-fields";
export * from "./constants/roles";
export * from "./constants/roleVisibility";
export * from "./constants/templateIds";
export * from "./constants/tableColumns.constants";


// ============================================================================
// 6. KOMİSYON, PERSONEL & BELGE DOĞRULAMA SERVİSLERİ
// ============================================================================

/**
 * Şablon kayıt defteri ve yetenek sorgulama servisi.
 */
export * from "./services/templateRegistryService";

/**
 * Komisyon üyelerinin görünürlük ve rol çözümleme mantığı.
 */
export * from "./services/memberVisibilityResolver";

/**
 * Piyasa araştırma ve muayene kabul komisyonu atama servisi.
 */
export * from "./services/commissionResolver";

/**
 * Belge mevzuat ve veri bütünlüğü doğrulama servisi.
 */
export * from "./services/documentValidationService";


// ============================================================================
// 7. MERKEZİ ŞABLON & ROTA KAYIT DEFTERİ (REGISTRIES)
// ============================================================================

/**
 * 33 standart belgenin KİK kodları, yetenekleri (`capabilities`) ve meta bilgilerini tutan tek otoriter sicil.
 */
export * from "./registry";

/**
 * Belge imza rotalarını, onay makamlarını ve yetkili personel eşleştirmelerini tutan rota sicili.
 */
export * from "./route-registry";

/**
 * Çok sayfalı A4 yazdırma ve sayfa kesim sarmalayıcısı (`DocumentPage`).
 */
export * from "./DocumentPage";


// ============================================================================
// 8. DOCUMENT ENGINE ENTEGRASYONU & ÖNİZLEME VERİ DERLEYİCİSİ (ENGINE BRIDGE)
// ============================================================================

export * from "./engine/resolvers/LuzumMuzekkeresiResolver";
export * from "./engine/resolvers/IhtiyacListesiResolver";
export * from "./engine/resolvers/IhtiyacTalepFormuResolver";
export * from "./engine/resolvers/DefaultDocumentResolver";
export * from "./engine/renderers/LuzumMuzekkeresiRenderer";
export * from "./engine/renderers/IhtiyacListesiRenderer";
export * from "./engine/renderers/IhtiyacTalepFormuRenderer";
export * from "./engine/renderers/DefaultDocumentRenderer";
export * from "./engine/registerTeminTemplates";
export * from "./previewData";
