# WorkDesk 360 – Branch Rulesets ve Koruma Politikası

## Amaç

WorkDesk 360 monorepo'sunda `main` ve `module/*` dallarını korumak için GitHub
Rulesets yapılandırmalarını ve bunları açıklayan kalıcı dokümantasyonu hazırla.

Bu çalışma yalnızca yapılandırma dosyalarını ve dokümantasyonu hazırlamayı
kapsar. GitHub üzerinde Ruleset etkinleştirme, API üzerinden ayar değiştirme,
branch oluşturma/silme, commit veya push işlemi yapma.

## 1. Önce mevcut yapıyı incele

Çalışmaya başlamadan önce:

- `.github/` dizinini incele.
- Mevcut Ruleset JSON dosyalarını bul.
- GitHub Actions workflow dosyalarını incele.
- `main` ve `module/*` dalları için çalışan CI işlerini belirle.
- Workflow ve job isimlerini kontrol et.
- Gerçek GitHub Actions kontrol isimlerini mümkünse mevcut PR/check geçmişinden
  doğrula.
- Mevcut yapılandırmaların geçerli GitHub Repository Rulesets API şemasıyla
  uyumunu kontrol et.

Mevcut dosyaları incelemeden varsayımsal yapılandırma oluşturma.

## 2. Hedef dosya yapısı

Aşağıdaki yapıyı oluştur:

```text
.github/
├── rulesets/
│   ├── main.ruleset.json
│   └── module-branches.ruleset.json
└── BRANCH_PROTECTION.md
```

Mevcut dosyalar varsa önce incele ve gerekli düzenlemeleri yap. Gereksiz
kopyalar oluşturma.

## 3. Ortak koruma politikası

WorkDesk 360 tek geliştirici tarafından yönetildiği için aşağıdaki politikayı
uygula:

| Kural                        | Politika              |
| ---------------------------- | --------------------- |
| Pull Request                 | Zorunlu               |
| Gerekli onay sayısı          | 0                     |
| CI kontrolleri               | Zorunlu               |
| Eski onayları geçersiz kılma | Açık                  |
| Review thread çözümü         | Zorunlu               |
| Code Owner onayı             | Zorunlu değil         |
| Son push için ayrı onay      | Zorunlu değil         |
| Merge yöntemleri             | Merge, Squash, Rebase |
| Linear history               | Zorunlu               |
| Force push                   | Yasak                 |
| Branch silme                 | Yasak                 |
| Bypass actors                | Boş                   |

Önemli: `required_approving_review_count: 0` kullanılması PR zorunluluğunu
kaldırmaz. Yalnızca başka bir kullanıcının onay verme şartını kaldırır.

`require_extra_approval_for_unattributed_changes` ayarını etkisi ve API desteği
doğrulanmadan etkinleştirme. Tek geliştiricili çalışma düzeninde beklenmedik bir
onay zorunluluğu oluşturmasına izin verme.

## 4. Main Ruleset

Dosya:

`.github/rulesets/main.ruleset.json`

Hedef:

`refs/heads/main`

Kurallar:

- Enforcement: active
- Pull Request zorunlu
- Onay sayısı: 0
- Eski onayları push sonrasında geçersiz kıl
- Review thread çözümü zorunlu
- Gerçek CI kontrolü zorunlu
- Strict status check politikası açık
- Linear history zorunlu
- Force push yasak
- Branch silme yasak
- Bypass actor tanımlama

Mevcut CI kontrolü olarak şu isim daha önce önerilmiştir:

`Monorepo Schema, Typecheck & Tests (Apps & Packages)`

Ancak bunu doğrudan doğru kabul etme. Workflow ve GitHub Actions üzerindeki
gerçek check adıyla eşleştiğini doğrula. Eşleşmiyorsa doğru adı belirle veya
doğrulanamadığını dokümante et.

## 5. Module Branch Ruleset

Dosya:

`.github/rulesets/module-branches.ruleset.json`

Hedef:

`refs/heads/module/*`

Bu kurallar aşağıdaki gibi mevcut ve gelecekte oluşturulacak modül dallarını
kapsamalı:

- `module/temin360`
- `module/ihale360`
- `module/flowdesk`
- `module/personel360`
- `module/disk-analiz`

Kurallar:

- Enforcement: active
- Pull Request zorunlu
- Onay sayısı: 0
- Eski onayları push sonrasında geçersiz kıl
- Review thread çözümü zorunlu
- Gerçek ve doğrulanmış CI kontrolleri zorunlu
- Strict status check politikası açık
- Linear history zorunlu
- Force push yasak
- Branch silme yasak
- Bypass actor tanımlama

Önemli noktalar:

1. `module/*` eşleşmesinin GitHub Rulesets tarafından doğru yorumlandığını
   doğrula.
2. Her modülün farklı CI workflow'u varsa bütün dallar için çalışmayan ortak bir
   check'i zorunlu kılma.
3. Ortak CI kontrolü bulunmuyorsa bunu raporla. Gerekirse gelecekte ortak bir CI
   gate oluşturulmasını öner.
4. Yeni modül branch'lerinin oluşturulmasını engelleme. Bu nedenle `creation`
   kuralını module ruleset'e ekleme.
5. Mevcut ve gelecekteki modül dallarının aynı koruma politikasına tabi olmasını
   sağla.

## 6. BRANCH_PROTECTION.md dokümantasyonu

`.github/BRANCH_PROTECTION.md` dosyasını kapsamlı ve anlaşılır şekilde oluştur.

Dokümanda şu başlıklar yer almalı:

### 1. Amaç ve kapsam

Branch korumasının neden kullanıldığı ve hangi dalları kapsadığı.

### 2. Branch stratejisi

`main` ile `module/*` dallarının görevleri ve aralarındaki ilişki.

### 3. Koruma kuralları

Her kuralın ne işe yaradığını, neden kullanıldığını ve hangi riski önlediğini
açıkla.

### 4. Tek geliştirici politikası

Neden onay sayısının 0 olduğu, bunun PR zorunluluğunu neden kaldırmadığı ve CI
kontrollerinin neden zorunlu olduğu.

### 5. CI ve Status Checks

Hangi workflow ve job kontrollerinin zorunlu olduğu, isimlerinin nereden
doğrulandığı ve bir check değişirse ne yapılması gerektiği.

### 6. Pull Request süreci

Geliştirme dalından PR açılması, CI kontrollerinin geçmesi ve birleştirme
adımlarını açıkla.

### 7. Merge stratejisi

Merge, Squash ve Rebase seçeneklerinin anlamını açıkla.

### 8. Yeni modül ekleme

Yeni bir modül branch'i açıldığında `module/*` ruleset kapsamına nasıl girdiğini
açıkla. Manuel olarak her yeni modüle ayrı koruma eklenmesi gerekip
gerekmediğini belirt.

### 9. GitHub üzerinde uygulama

JSON dosyalarının depoda bulunmasının tek başına GitHub'da kuralları
etkinleştirmediğini açıkla.

GitHub Repository Rulesets ekranından veya API üzerinden nasıl uygulanacağını
anlat. Ancak bu çalışma sırasında uygulama yapma.

### 10. Değişiklik ve bakım prosedürü

Workflow isimleri, branch stratejisi veya koruma kuralları değiştiğinde JSON ve
MD dosyalarının birlikte güncellenmesi gerektiğini açıkla.

### 11. Güvenlik ve istisnalar

Bypass actor, force push, branch silme ve koruma kurallarının yanlış
yapılandırılması risklerini açıkla.

### 12. Kontrol listesi

Uygulama öncesi ve sonrası doğrulanacak maddeleri listele.

## 7. Teknik doğrulama

Hazırlanan dosyalar için:

- JSON syntax kontrolü yap.
- GitHub Rulesets API şemasını kontrol et.
- Desteklenmeyen parametre kullanma.
- Status check isimlerini gerçek CI sonuçlarıyla karşılaştır.
- `main` ve `module/*` hedeflerini kontrol et.
- Dokümantasyondaki kuralların JSON dosyalarıyla tutarlı olduğunu doğrula.
- Tek geliştirici politikasına aykırı onay zorunluluğu bırakma.
- Yeni modül branch'lerinin oluşturulmasını engelleyecek bir kural ekleme.

## 8. Kesinlikle yapılmayacak işlemler

- GitHub API üzerinden Ruleset oluşturma veya güncelleme.
- GitHub ayarlarını değiştirme.
- Branch korumasını etkinleştirme.
- Workflow dosyalarını değiştirme.
- Kod dosyalarını değiştirme.
- Branch oluşturma veya silme.
- Commit veya push yapma.
- Mevcut TEMİN 360 RC.10 sürümünü etkileyecek işlem yapma.

## 9. Tamamlanma raporu

İşlem sonunda:

1. Oluşturulan/değiştirilen dosyaları listele.
2. Main ve module ruleset kurallarını özetle.
3. Doğrulanan gerçek CI check isimlerini belirt.
4. Doğrulanamayan veya eksik CI kontrollerini belirt.
5. JSON ve API şema doğrulama sonucunu raporla.
6. GitHub üzerinde manuel uygulanması gereken adımları açıkla.
7. Henüz GitHub üzerinde hiçbir ayarın değiştirilmediğini açıkça belirt.

Çalışmayı tamamla ve raporla. Sonraki aşama için benden onay bekle.
