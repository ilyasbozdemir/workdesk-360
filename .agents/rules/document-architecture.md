# Belge Motoru ve Şablon Mimari Kuralları

Bu kural seti, Temin 360 ve WorkDesk 360 genelinde belge oluşturma, şablon verisi bağlama ve önizleme süreçlerini düzenler.

## İlkeler
1. Şablon içine SQL yazılamaz.
2. Yeni şablon eklerken ayrı SQL resolver sınıfı YAZILMAZ; `data.mapping.ts` kullanılır.
3. Document Engine dışında ikinci bir paralel resolver veya registry oluşturulamaz.
4. `DocumentPreviewModalV3` içinde bağımsız veri yükleme mantığı barındırılamaz; `DocumentEngine` adaptörü kullanılır.
5. Snapshot ve smartMerge akışı atlanamaz; kullanıcının manuel düzenlemeleri silinemez.
6. Kurum anteti, birim ve personel hiyerarşisi `InstitutionalHeaderProvider` otoritesindedir.
7. Alım türü (Mal, Hizmet, Danışmanlık, Yapım İşleri) varyantları standart contract üzerinden desteklenir.
8. PDF üretimi Document Engine HTML çıktısı ve `pdf-generator` üzerinden yürütülür.

