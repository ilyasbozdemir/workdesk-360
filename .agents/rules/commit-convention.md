# Commit Mesajı Formatı ve Standartları (Conventional Commits + Scope)

Bu kural, Workdesk 360 monoreposunda oluşturulan tüm git commit mesajları için **ZORUNLUDUR**.

---

## 📌 Format Kuralı

Her commit mesajı aşağıdaki standart formata tam olarak uymalıdır:

```
<tip>(<uygulama-veya-paket-kapsamı>): <açıklama>
```

---

## 🏷️ 1. Tip (Type) Listesi
- **`feat`**: Yeni bir özellik veya kabiliyet eklendiğinde
- **`fix`**: Bir hata (bug), UI/UX problemi veya beklenmeyen davranış düzeltildiğinde
- **`refactor`**: Özellik eklemeden veya hata düzeltmeden kod yapısı iyileştirildiğinde
- **`chore`**: Sürüm artırımı, paket bağımlılıkları, manifest güncellemeleri veya bakım işlerinde
- **`perf`**: Performans iyileştirmelerinde
- **`style`**: Kod formatı, boşluklar, yazım düzenlemelerinde (iş mantığını etkilemeyen)
- **`docs`**: Dokümantasyon veya README güncellemelerinde
- **`test`**: Birim, entegrasyon veya E2E testleri eklendiğinde/güncellendiğinde

---

## 📦 2. Kapsam (Scope) - Parantez İçindeki Apps/Packages Adı
Commit yapılan ilgili monorepo projesi parantez içinde açıkça belirtilmelidir:

### Uygulamalar (Apps):
- **`temin360`**: `apps/temin360-desktop` (Temin 360 - Doğrudan Temin & Kamu İhale)
- **`personel360`**: `apps/personel360-desktop` (Personel 360)
- **`flowdesk`**: `apps/flowdesk-desktop`
- **`disk-analiz`**: `apps/disk-analiz-360-desktop`
- **`landing`**: `apps/app-landing`
- **`workspace`**: `apps/app-workspace`

### Paketler (Packages):
- **`database`**: `packages/database` (@dt/database)
- **`document-engine`**: `packages/document-engine`
- **`document-templates`**: `packages/document-templates`
- **`domain`**: `packages/domain`

---

## 🎯 3. Örnek Commit Mesajları
- `feat(temin360): modül mağazasına doğrudan temin paketleri eklendi`
- `fix(temin360): hesaplama araçlarındaki çift sidebar kaldırıldı`
- `chore(database): rc.11 schema manifest kayıtları donduruldu`
- `fix(temin360): recharts responsive container boyutlandırma uyarısı giderildi`
- `feat(personel360): yıllık izin hakediş ve bakiye hesabı eklendi`
- `refactor(document-engine): şablon render motoru optimize edildi`

