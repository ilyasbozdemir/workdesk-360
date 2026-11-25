# WorkDesk 360 - Test Suite

Merkezi test dizinidir.

## Structure

- fixtures: Test verileri ve dosyaları.
- packages: Paylaşılan paketlerin testleri.
- apps: Uygulama bazlı testler.
- helpers: Ortak test yardımcıları.

## Rules

- Testler gerçek kullanıcı verilerini değiştirmemelidir.
- Fixture verileri kurgusal olmalıdır.
- Geçici dosyalar test sonrasında temizlenmelidir.
- Her paket ve uygulama kendi test kapsamını korumalıdır.
- Testler birbirlerinin verilerine bağımlı olmamalıdır.

## Test Data

ACME test verileri tamamen kurgusaldır.

.temin fixture dosyaları gerçek uygulama formatına uygun
olarak ayrıca hazırlanmalıdır.
