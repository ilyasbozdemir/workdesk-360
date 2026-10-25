# Veri Aktarım & Dönüştürme Aracı (Workdesk 360)

Doğrudan Temin kök şemasına (`dosyalar.schema.json`) uygun yedekleri, Excel/CSV listelerini ve Statik API (`data.zip`) arşivlerini iki yönlü dönüştüren, doğrulayan ve ayrıştıran modern TypeScript tabanlı yerel araç.

## Özellikler

1. **TypeScript Tip Güvenliği**: Tüm modeller `dosyalar.schema.json` spesifikasyonuna göre derlenir (`tsc`).
2. **Kolay ve Modern Arayüz**: Sürükle-bırak desteği, otomatik kolon eşleme, sağlık ve şema uyarıları.
3. **Round-Trip Destek**:
   - `DT Yedeği (JSON)` &rarr; `Ayrıştırılmış Statik API (data.zip)`
   - `data.zip` veya `data/` &rarr; `Doğrudan Temin Kök Modeli`
   - `Excel (.xlsx, .xls) / CSV` &rarr; `Otomatik Malzeme ve Dosya Paketleme`
4. **Çevrimdışı Çalışma**: Dışarı veri sızmaz, sunucu gerekmez.

## Kullanım

1. `index.html` dosyasını doğrudan tarayıcınızda açın.
2. Kaynak dosyayı sürükleyip bırakın veya "Örnek Veri Yükle"ye tıklayın.
3. Şema ve sağlık raporunu inceleyin.
4. "data.zip İndir" veya "JSON Kopyala" ile aktarımı tamamlayın.

## Geliştirme ve Derleme

```bash
# TypeScript kontrolü
node ./apps/app-desktop/node_modules/typescript/bin/tsc --project tsconfig.json --noEmit

# Derleme (dist klasörüne JS ve d.ts üretir)
node ./apps/app-desktop/node_modules/typescript/bin/tsc --project tsconfig.json
```
