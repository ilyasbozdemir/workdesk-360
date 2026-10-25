# Yedek Ayırıcı

DT yedeğini (JSON) genel veri ve dosyaya özel veri olarak ayırır, sıra numaralı dizileri adlı alanlara çevirir, sağlık raporu çıkarır ve `data.zip` üretir. Tarayıcıda çalışır, veri dışarı gitmez.

## Kullanım
`index.html` dosyasını çift tıklayıp tarayıcıda açın. Sunucu ve kurulum gerekmez.

## Dışarıdan Aktarma (Yeni Özellik)
- **A) Statik API'den Aktar:** Önceden üretilmiş `data.zip` arşivini veya `data/` klasörünü seçip round-trip (denormalize) ile DT yedeğine geri çevirin.
- **B) Genel Excel/CSV:** `.xlsx, .xls, .csv` dosyalarını seçin; sayfa, başlık satırı ve sütun eşleştirmesi ile malzemeleri, firmaları veya kataloğu önizleyip (dry-run) aktarın.

## Yapı
- `js/engine.js`: ayır, normalize, denormalize, sağlık kontrolleri (arayüzden bağımsız)
- `js/aktar-api.js`: Statik API okuma, manifest doğrulama ve denormalizasyon
- `js/aktar-excel.js`: SheetJS tabanlı Excel/CSV çözümleme, otomatik eşleme ve doğrulama
- `js/ornek.js`: uydurma örnek veri
- `js/app.js`: arayüz ve etkileşim mantığı
- `vendor/`: yerel bağımlılıklar (`jszip.min.js`, `xlsx.full.min.js`)

Betik sırası: jszip, xlsx, engine, aktar-api, aktar-excel, ornek, app.

## Gizlilik
Gerçek yedekte firma, vergi no ve personel adı olabilir. Üretilen zip’i herkese açık yere koyma.
