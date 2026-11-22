import { describe, expect, it } from "vitest";
import { createRequire } from "node:module";
import {
  trKey,
  trSortKey,
  trCollator,
  matchesSearch,
  normalizeInput,
  registerSqliteTextFunctions,
} from "../index";

const require = createRequire(import.meta.url);
const { DatabaseSync } = require("node:sqlite");

describe("ADIM 1 — Ortak Türkçe Metin Katmanı (shared/text)", () => {
  describe("1. trKey() — Arama ve Filtreleme Anahtarı", () => {
    it("büyük/küçük harf ve Türkçe karakter varyantlarını aynı kanonik anahtara indirger", () => {
      expect(trKey("ASİL ÜYE")).toBe("asil uye");
      expect(trKey("Asil Üye")).toBe("asil uye");
      expect(trKey("asil uye")).toBe("asil uye");
      expect(trKey("ASIL UYE")).toBe("asil uye");
    });

    it("Türkçe İ, ı, I, i karakterlerini ASCII 'i' harfine dönüştürür", () => {
      expect(trKey("İSMET")).toBe("ismet");
      expect(trKey("ısmet")).toBe("ismet");
      expect(trKey("Ismet")).toBe("ismet");
      expect(trKey("ismet")).toBe("ismet");
    });

    it("Ç, Ğ, Ö, Ş, Ü karakterlerini doğru ASCII karşılıklarına çevirir", () => {
      expect(trKey("ÇALIŞKAN")).toBe("caliskan");
      expect(trKey("ÖĞRETMEN")).toBe("ogretmen");
      expect(trKey("ŞÜPHELİ")).toBe("supheli");
    });

    it("NFC ve NFD birleşik/ayrık 'İ' karakterlerini aynı sonuca ulaştırır", () => {
      const ayrıkI = "I\u0307smet"; // NFD (I + combining dot above)
      const birlesikI = "İsmet"; // NFC
      expect(trKey(ayrıkI)).toBe("ismet");
      expect(trKey(birlesikI)).toBe("ismet");
      expect(trKey(ayrıkI)).toBe(trKey(birlesikI));
    });

    it("özel karakterleri, sembolleri ve gereksiz boşlukları temizler", () => {
      expect(trKey("  Personel - A (Tekniker)  ")).toBe("personel a tekniker");
    });

    it("null ve undefined girdilerde hata fırlatmaz, boş string döner", () => {
      expect(trKey(null)).toBe("");
      expect(trKey(undefined)).toBe("");
      expect(trKey("")).toBe("");
    });
  });

  describe("2. trSortKey() — Türk Alfabesi Sırasını Koruyan Sıralama Anahtarı", () => {
    it("C < Ç < D, I < İ, O < Ö, S < Ş, U < Ü sıralama kuralını sağlar", () => {
      expect(trSortKey("C").localeCompare(trSortKey("Ç"))).toBeLessThan(0);
      expect(trSortKey("Ç").localeCompare(trSortKey("D"))).toBeLessThan(0);
      expect(trSortKey("I").localeCompare(trSortKey("İ"))).toBeLessThan(0);
      expect(trSortKey("O").localeCompare(trSortKey("Ö"))).toBeLessThan(0);
      expect(trSortKey("S").localeCompare(trSortKey("Ş"))).toBeLessThan(0);
      expect(trSortKey("U").localeCompare(trSortKey("Ü"))).toBeLessThan(0);
    });

    it("kullanıcı tarafından sağlanan örnek listeyi doğru Türk alfabesi sırasıyla dizer", () => {
      const sampleList = [
        "Sevgi",
        "Cemal",
        "Ömer",
        "Çağla",
        "İsmet",
        "ÇALIŞKAN",
        "Şener",
        "Ilgaz",
        "Oya",
        "Zeynep",
      ];

      const sorted = [...sampleList].sort((a, b) =>
        trSortKey(a).localeCompare(trSortKey(b))
      );

      expect(sorted).toEqual([
        "Cemal",
        "Çağla",
        "ÇALIŞKAN",
        "Ilgaz",
        "İsmet",
        "Oya",
        "Ömer",
        "Sevgi",
        "Şener",
        "Zeynep",
      ]);
    });

    it("null ve undefined değerlerde güvenli boş string döner", () => {
      expect(trSortKey(null)).toBe("");
      expect(trSortKey(undefined)).toBe("");
    });
  });

  describe("3. trCollator — Yalnızca Sıralama İçin Intl.Collator", () => {
    it("Türkçe kurallarına göre doğru sıralama karşılaştırması yapar", () => {
      const list = ["Şener", "Sevgi", "Çetin", "Can"];
      list.sort((a, b) => trCollator.compare(a, b));
      expect(list).toEqual(["Can", "Çetin", "Sevgi", "Şener"]);
    });

    it("sensitivity: base nedeniyle eşitlik/kimlik kontrolünde kullanılmamalıdır (Ali === ali eşit çıkar)", () => {
      // Bu test 'sensitivity: base' nedeniyle kimlik kontrolünde kullanılamayacağını belgeler
      const diffCaseEqual = trCollator.compare("Ali", "ali") === 0;
      expect(diffCaseEqual).toBe(true);
    });
  });

  describe("4. matchesSearch() — Çok Kelimeli ve Kısmi Arama", () => {
    it("kısmi eşleşmeyi Türkçe karakter duyarsız olarak bulur", () => {
      expect(matchesSearch("deere", "John Deere (Çalışan)")).toBe(true);
      expect(matchesSearch("calis", "John Deere (Çalışan)")).toBe(true);
      expect(matchesSearch("çalış", "John Deere (Çalışan)")).toBe(true);
      expect(matchesSearch("CALIS", "John Deere (Çalışan)")).toBe(true);
    });

    it("çok kelimeli parçalı aramayı (john cal) sıradan bağımsız bulur", () => {
      expect(matchesSearch("john cal", "John Deere (Çalışan)")).toBe(true);
      expect(matchesSearch("cal john", "John Deere (Çalışan)")).toBe(true);
      expect(matchesSearch("san john", "John Deere (Çalışan)")).toBe(true);
    });

    it("boş veya boşluklardan oluşan sorguda tüm kayıtları kabul eder", () => {
      expect(matchesSearch("", "Personel A")).toBe(true);
      expect(matchesSearch("   ", "Personel A")).toBe(true);
      expect(matchesSearch(null, "Personel A")).toBe(true);
    });

    it("birden fazla alan verildiğinde alanların herhangi birindeki eşleşmeyi yakalar", () => {
      expect(matchesSearch("teknik", "Personel A", "Tekniker")).toBe(true);
      expect(matchesSearch("pers tekn", "Personel A", "Tekniker")).toBe(true);
    });

    it("null ve undefined alanlar verildiğinde güvenli çalışır", () => {
      expect(matchesSearch("calis", null, undefined, "Mustafa ÇALIŞKAN")).toBe(true);
      expect(matchesSearch("bulunamaz", null, undefined)).toBe(false);
    });
  });

  describe("5. normalizeInput() — NFC ve Boşluk Normalizasyonu", () => {
    it("NFD ayrık karakterleri NFC birleşik forma dönüştürür ve kenar boşluklarını kırpar", () => {
      const decomposed = "I\u0307lyas  ";
      expect(normalizeInput(decomposed)).toBe("İlyas");
      expect(normalizeInput(null)).toBe("");
      expect(normalizeInput(undefined)).toBe("");
    });
  });

  describe("6. SQLite better-sqlite3 Entegrasyonu (In-Memory Veritabanı Testi)", () => {
    it("tr_key ve tr_sort fonksiyonları in-memory SQLite üzerinde kayıt edilip çalışır", () => {
      const db = new DatabaseSync(":memory:");
      registerSqliteTextFunctions(db as any);

      db.exec(`
        CREATE TABLE test_personel (
          id INTEGER PRIMARY KEY,
          ad_soyad TEXT NOT NULL
        );
      `);

      const insert = db.prepare("INSERT INTO test_personel (id, ad_soyad) VALUES (?, ?)");
      insert.run(1, "Cemal");
      insert.run(2, "Çağla");
      insert.run(3, "ÇALIŞKAN");
      insert.run(4, "Ilgaz");
      insert.run(5, "İsmet");
      insert.run(6, "Oya");
      insert.run(7, "Ömer");
      insert.run(8, "Sevgi");
      insert.run(9, "Şener");
      insert.run(10, "Zeynep");

      // 6.1: Varsayılan SQLite LIKE'ın Türkçe karakterlerde bozuk olduğunu gösteren karşılaştırma
      // SQLite LIKE ASCII duyarsızdır ama Türkçe 'ç' ile 'ÇALIŞKAN'ı bulamaz
      const defaultLikeQuery = db.prepare("SELECT * FROM test_personel WHERE ad_soyad LIKE '%çalışkan%'").all();
      expect(defaultLikeQuery.length).toBe(0); // Varsayılan SQLite LIKE ÇALIŞKAN'ı bulamaz!

      // 6.2: tr_key ile arama ("İSMET", "ismet", "ısmet" aynı kaydı bulur)
      const qIsmetUpper = db.prepare("SELECT * FROM test_personel WHERE instr(tr_key(ad_soyad), tr_key(?)) > 0").all("İSMET") as any[];
      const qIsmetLower = db.prepare("SELECT * FROM test_personel WHERE instr(tr_key(ad_soyad), tr_key(?)) > 0").all("ismet") as any[];
      const qIsmetDotless = db.prepare("SELECT * FROM test_personel WHERE instr(tr_key(ad_soyad), tr_key(?)) > 0").all("ısmet") as any[];

      expect(qIsmetUpper.length).toBe(1);
      expect(qIsmetUpper[0].ad_soyad).toBe("İsmet");
      expect(qIsmetLower.length).toBe(1);
      expect(qIsmetDotless.length).toBe(1);

      // 6.3: tr_key ile ÇALIŞKAN araması
      const qCaliskan = db.prepare("SELECT * FROM test_personel WHERE instr(tr_key(ad_soyad), tr_key(?)) > 0").all("caliskan") as any[];
      expect(qCaliskan.length).toBe(1);
      expect(qCaliskan[0].ad_soyad).toBe("ÇALIŞKAN");

      // 6.4: Varsayılan ORDER BY ad'ın Türkçe karakterlerde bozuk olduğunu gösteren test
      // SQLite varsayılan sıralamasında Ç, Ö, Ş gibi karakterler Z'den sonra (ASCII 128+) gelir!
      const defaultOrderRows = db.prepare("SELECT ad_soyad FROM test_personel ORDER BY ad_soyad ASC").all() as any[];
      const defaultNames = defaultOrderRows.map((r) => r.ad_soyad);
      expect(defaultNames[defaultNames.length - 1]).not.toBe("Zeynep"); // Bozuk: Şener veya Ömer en sona atılır

      // 6.5: ORDER BY tr_sort(ad_soyad) ile doğru Türkçe alfabetik sıralama
      const sortedRows = db.prepare("SELECT ad_soyad FROM test_personel ORDER BY tr_sort(ad_soyad) ASC").all() as any[];
      const sortedNames = sortedRows.map((r) => r.ad_soyad);

      expect(sortedNames).toEqual([
        "Cemal",
        "Çağla",
        "ÇALIŞKAN",
        "Ilgaz",
        "İsmet",
        "Oya",
        "Ömer",
        "Sevgi",
        "Şener",
        "Zeynep",
      ]);

      db.close();
    });
  });
});
