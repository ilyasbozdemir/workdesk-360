# WORKFLOW ENGINE & SÜREÇ YÖNETİMİ UYGULAMA RAPORU
## TEMİN 360 / KAMU 360 MİMARİ ENTEGRASYON DOKÜMANI

---

### 1. YÖNETİCİ ÖZETİ

Bu çalışma kapsamında, **Temin 360** uygulamasının mevcut belge üretim ve masa yapıları (`ProcurementWorkspace`, `FinanceWorkspace`, `Document Engine`, `PDF Generator`, `SQLite`) korunarak; dosya yaşam döngüsünü baştan sona denetleyen, kural tabanlı, görev atayan ve bildirim üreten bağımsız **Workflow Engine + Rule Engine + Task Management + Notification Engine + Process Assistant** mimarisi başarıyla hayata geçirilmiştir.

---

### 2. MEVCUT MİMARİ ANALİZİ VE ENTEGRASYON NOKTALARI

1. **Document Engine ile Workflow Engine Ayrımı:**
   - **Document Engine:** Belge JSON verisini derler, React tabanlı `.template.tsx` şablonlarını render eder, snapshot alır ve PDF Generator ile matbu çıktı üretir. Belge üretimi, sürecin bir parçasıdır ancak sürecin kendisi değildir.
   - **Workflow Engine:** Dosyanın hangi aşamada olduğunu (`current_state`), hangi kurallarla ilerleyebileceğini, eksik onay/evrakları ve sonraki sorumluyu belirler.
2. **Çalışma Masaları:**
   - **Satın Alma Masası (4734):** Dosya hazırlık, yaklaşık maliyet, teklif, sipariş ve muayene kabul adımlarını yönetir.
   - **Mali Hizmetler Masası (5018):** Ödenek kontrolü, KİK %10 limiti, yasal kesintiler ve gelen doğrudan temin dosyalarının incelenmesi.
   - **Muhasebe Masası (5018):** MİF ve ÖEB düzenleme, tahakkuk ve banka ödeme işlemleri.
3. **Güvenlik Katmanı:**
   - IPC kanalları `senderGuard.ts` ile frame doğrulamasından geçirilir.
   - Renderer'daki Zustand rolleri yalnızca UI görünürlük filtresidir; yetki denetimi Main Process ve Rule Engine seviyesinde uygulanır.

---

### 3. EKLENEN YENİ PAKET VE DOSYALAR

#### Yeni Paket: `packages/workflow-engine`
Sıfır React, sıfır Electron ve sıfır SQLite bağımlılığına sahip saf TypeScript motor paketi.
```text
packages/workflow-engine/
├── package.json
├── tsconfig.json
└── src/
    ├── types/
    │   └── index.ts                 (Workflow, Rule, Task, Notification tip tanımları)
    ├── rules/
    │   └── standardRules.ts         (Mevzuat, Kurum ve Tavsiye kuralları)
    ├── definitions/
    │   └── directProcurementWorkflow.ts (4734 22/d Doğrudan Temin pilot akışı)
    ├── engine/
    │   ├── evaluateRules.ts         (Kural değerlendirme ve özetleyici)
    │   ├── evaluateTransition.ts    (Geçiş önkoşul ve yetki doğrulayıcı)
    │   ├── resolveNextActions.ts    (Kullanıcının yapabileceği sonraki aksiyonlar)
    │   └── resolveAssignee.ts       (Sonraki sorumlu rol ve birim çözümleyici)
    ├── __tests__/
    │   └── workflowEngine.test.ts   (Motor unit testleri - 8 test)
    └── index.ts
```

#### Uygulama İçi Eklenen ve Entegre Edilen Dosyalar:
1. **Veritabanı Şeması (`apps/temin360-desktop/src/main/database/workspace/schemaIntegrity.ts`):**
   - `WORKFLOW_Instance`
   - `WORKFLOW_TransitionHistory`
   - `WORKFLOW_Task`
   - `WORKFLOW_Notification`
   - `WORKFLOW_NotificationOutbox`
   - `WORKFLOW_RuleEvaluation`
2. **Main Process Servis & IPC Katmanı:**
   - `apps/temin360-desktop/src/main/ipc/workflow/workflowService.ts`: SQLite transaction yönetimi, context derleme, idempotency ve senkronizasyon.
   - `apps/temin360-desktop/src/main/ipc/workflow/workflowHandlers.ts`: 8 adet güvenli IPC kanalı (`workflow:*`).
   - `apps/temin360-desktop/src/main/ipc/index.ts`: IPC handler kaydı.
3. **Preload Köprüsü:**
   - `apps/temin360-desktop/src/preload/index.ts`: Güvenli kanal allowlist'i ve `window.api.workflow` API nesnesi.
   - `apps/temin360-desktop/src/preload/index.d.ts`: TypeScript tip tanımları.
4. **Kullanıcı Arayüzü Bileşenleri (UI):**
   - `apps/temin360-desktop/src/renderer/src/screens/dosya/components/DosyaSurecAsistani.tsx`: Dosya Süreç Asistanı & Kural Motoru paneli.
   - `apps/temin360-desktop/src/renderer/src/screens/dosya/index.screen.tsx`: Dosya ekranına entegre süreç asistanı.
   - `apps/temin360-desktop/src/renderer/src/components/layout/header/NotificationPopover.tsx`: Ortak Bildirim Merkezi & Görevler açılır paneli.
   - `apps/temin360-desktop/src/renderer/src/workspaces/finance/modules/financial-services/pages/IncomingProcurementsPage.tsx`: Mali Hizmetler iş kuyruğu için "Eksik Evrakla İade Et" ve ödeme onay workflow entegrasyonu.

---

### 4. WORKFLOW VERİ MODELİ (SQLITE)

```text
DATA_TeminDosyasi (id)
       │
       ├── WORKFLOW_Instance (id, dosya_id, current_state, status, assigned_role)
       │      │
       │      ├── WORKFLOW_TransitionHistory (instance_id, from_state, to_state, actor_role, reason)
       │      ├── WORKFLOW_Task (instance_id, title, status, required_role, idempotency_key)
       │      ├── WORKFLOW_RuleEvaluation (instance_id, rule_id, category, passed, severity)
       │      └── WORKFLOW_Notification (dosya_id, task_id, title, message, channel, read_at)
       │
       └── WORKFLOW_NotificationOutbox (id, channel, recipient, payload_json, status, attempts)
```

---

### 5. SÜREÇ DURUMLARI (PİLOT: 4734 22/d DOĞRUDAN TEMİN)

| Aşama ID | Aşama Adı | Sorumlu Rol | Geçiş Kuralı / Ön Koşul |
|---|---|---|---|
| `PROCUREMENT_DRAFT` | 1. İhtiyaç & Dosya Hazırlığı | `satin_alma` | Başlangıç aşaması |
| `MARKET_RESEARCH` | 2. Piyasa Fiyat Araştırması | `satin_alma` | `RULE_ONAY_BELGESI_REQUIRED` (Onay Belgesi şarttır) |
| `ORDER_CONTRACT` | 3. Sipariş & Sözleşme | `satin_alma` | `RULE_WINNER_FIRM_ASSIGNED` & `RULE_MIN_QUOTES_RECOMMENDED` |
| `INSPECTION_ACCEPTANCE` | 4. Muayene & Kabul | `satin_alma` | Teslimat kaydı |
| `FINANCE_REVIEW` | 5. Mali Hizmetler İncelemesi | `mali_hizmetler` | `RULE_MUAYENE_KABUL_REQUIRED` & `RULE_FATURA_INFORMATION_RECORDED` |
| `ACCOUNTING_PAYMENT` | 6. Muhasebe & Ödeme (MİF/ÖEB) | `muhasebe` | Mali vize ve ödenek uygunluğu |
| `COMPLETED` | 7. Süreç Tamamlandı | `muhasebe` / `admin` | Dosya kapatıldı |
| `RETURNED` | İade Edildi / Eksik Evrak | `satin_alma` | Gerekçeli iade (Satın Alma düzeltme bekler) |

---

### 6. RULE ENGINE (KURAL MOTORU) SINIFLANDIRMASI

Sistem kuralları arayüzde açıkça 3 kategoriye ayrılarak gösterilir:

1. 🛑 **Mevzuat Kuralları (LEGAL - BLOCKING):**
   - `RULE_ONAY_BELGESI_REQUIRED`: 4734 KİK Madde 22 gereğince harcama yetkilisi onay belgesi olmadan piyasa araştırmasına başlanamaz.
   - `RULE_WINNER_FIRM_ASSIGNED`: Teklif değerlendirmesi yapılmadan sipariş verilemez.
   - `RULE_MUAYENE_KABUL_REQUIRED`: 5018 Sayılı Kanun Madde 33 uyarınca kabul tutanağı olmadan mali inceleme veya ödemeye sevk edilemez.
2. ⚠️ **Kurum İş Akışı Kuralları (ORGANIZATIONAL - WARNING):**
   - `RULE_MIN_QUOTES_RECOMMENDED`: Kurum iç kontrol yönergeleri gereği piyasa araştırmasında en az 3 teklif alınması tavsiye edilir (işlemi engellemez, uyarı verir).
   - `RULE_FATURA_INFORMATION_RECORDED`: Fatura ve hak ediş bilgisi kontrolü.
3. ℹ️ **Sistem Önerileri (ADVISORY - INFO):**
   - `RULE_BUDGET_CODE_CHECK`: 5018 analitik bütçe ekonomik kodunun alım türüyle uyumu ve raporlama kolaylığı.

---

### 7. TRANSACTIONAL OUTBOX & BİLDİRİM MİMARİSİ

```text
Workflow Geçiş Olayı
         ↓
  SQLite Transaction (Atomik)
  ├── 1. WORKFLOW_Instance Durum Güncelleme
  ├── 2. WORKFLOW_TransitionHistory Kaydı
  ├── 3. WORKFLOW_RuleEvaluation Denetim Kayıtları
  ├── 4. Önceki Açık Görevlerin Kapatılması
  ├── 5. Yeni Görev Kaydı (Idempotency Key ile Çift Kayıt Engeli)
  ├── 6. In-App Bildirim Kaydı (WORKFLOW_Notification)
  ├── 7. E-posta Outbox Kaydı (WORKFLOW_NotificationOutbox: PENDING)
  └── 8. DATA_TeminDosyasi Durum Senkronizasyonu
         ↓
  Transaction Commit
         ↓
  Notification Worker (Uygulama İçi / SMTP Gönderimi)
```

- **Idempotency Güvencesi:** Aynı geçiş veya olay tekrar işlense dahi `idempotency_key` benzersizliği sayesinde mükerrer görev ve bildirim üretilmez.
- **Gizlilik:** E-posta outbox içeriğine gereksiz kişisel ve mali detaylar yazılmaz; yalnızca görev başlığı, dosya numarası ve uygulama içi yönlendirme bilgisi konur.

---

### 8. TEST KOMUTLARI VE GERÇEK SONUÇLAR

Tüm testler ve tip denetimleri sıfır hata ile tamamlanmıştır:

1. **`pnpm --filter @workdesk-360/workflow-engine test`:**
   - **8/8 unit test BAŞARILI** (Geçiş doğrulaması, blocking kural engeli, durum uyuşmazlığı, yetki denetimi, admin bypass, uyarı toleransı, muayene zorunluluğu, sonraki aksiyon listeleme).
2. **`pnpm --filter temin360-desktop typecheck:node`:**
   - **BAŞARILI** (0 hata).
3. **`pnpm --filter temin360-desktop typecheck:web`:**
   - **BAŞARILI** (0 hata).
4. **`pnpm --filter temin360-desktop test`:**
   - **73 test dosyasının tümü geçti (660 başarılı test, 0 hata, 0 regresyon).**

---

### 9. KAMU 360 GELECEK ENTEGRASYON NOKTALARI

- **Çoklu Kurum ve Dış Entegrasyon:** İleride BKMYBS, MYS ve EKAP doğrudan entegrasyonu sağlandığında kural motoruna harici servis doğrulayıcıları eklenebilir.
- **Genişletilebilir Süreçler:** `WorkflowDefinition` arayüzü sayesinde İhale (Açık/Belli İstekliler), Hakediş Kabul ve Doğrudan Temin 22/a, 22/b, 22/c akışları sadece yeni tanım dosyası yazılarak sisteme eklenebilir.
