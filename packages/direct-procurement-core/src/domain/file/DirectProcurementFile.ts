import { AggregateRoot } from "../shared/AggregateRoot";
import { DomainError } from "../shared/DomainError";
import { lineTotal, roundQty, withKdv } from "../shared/numeric";
import { DIRECT_PROCUREMENT_PROFILE } from "../profile/profiles";
import type { ProcurementProfile } from "../profile/ProcurementProfile";
import {
  ApproximateCostCalculator,
  type ApproximateCostResult,
} from "../pricing/ApproximateCostCalculator";
import type { PricingBasis } from "../pricing/PricingBasis";
import type {
  WinnerResult,
  WinnerSelectionStrategy,
} from "../winner/WinnerSelectionStrategy";
import { type AcceptanceLine, AcceptanceRecord } from "./AcceptanceRecord";
import type { Bidder } from "./Bidder";
import {
  AcceptanceApproved,
  QuoteChanged,
  ResultApproved,
  WinnerSelected,
} from "./events";
import type { NeedItem } from "./NeedItem";
import { QuoteMatrix } from "./QuoteMatrix";
import { Money } from "../money";

/**
 * Doğrudan temin sürecinin yaşam döngüsü aşamaları (Stage).
 * 
 * - `hazirlik`: İhtiyaç tespiti, kalemlerin tanımlanması ve yaklaşık maliyet ön hazırlığı.
 * - `arastirma`: Piyasa fiyat araştırması, firmalardan tekliflerin toplanması ve kazananın seçimi.
 * - `yuklenici`: Sonuç onayı, sipariş/sözleşme ve yüklenici bildirimleri.
 * - `kabul`: Muayene ve kabul tutanakları, parçalı/kesin mal/hizmet teslim alma süreci.
 */
export type FileStage = "hazirlik" | "arastirma" | "yuklenici" | "kabul";

/** 
 * UI ve mevzuat kuralı: "İstekli firmalar (en az 2, en fazla 3)".
 * 4734 sayılı Kanun ve Doğrudan Temin uygulamalarında piyasa araştırması için asgari firma sayısı.
 */
export const MIN_BIDDERS = 2;

/** 
 * Doğrudan temin fiyat araştırma formunda davet edilebilecek azami firma sayısı.
 */
export const MAX_BIDDERS = 3;

/**
 * Bir firmanın teklif ettiği toplam bedel (KDV Hariç ve KDV Dahil).
 */
export interface FileTotals {
  /** KDV hariç toplam tutar */
  haric: Money;
  /** KDV dahil toplam tutar */
  dahil: Money;
}

/** 
 * Kalıcılık için düz veri görüntüsü (Memento / Snapshot deseni).
 * Repository katmanı bu arayüz ile veritabanına okur/yazar; Aggregate'in iç alanlarına doğrudan dokunmaz.
 */
export interface FileSnapshot {
  /** Benzersiz dosya kimliği (DATA_TeminDosyasi.id) */
  id: number;
  /** Alımın / dosyanın konusu */
  subject: string;
  /** Dosya açılış tarihi (ISO YYYY-MM-DD) */
  openedOn: string;
  /** Alım profili (Mal, Hizmet, Danışmanlık, Yapım vb.) */
  profile: ProcurementProfile;
  /** Dosyaya ait ihtiyaç kalemleri */
  items: readonly NeedItem[];
  /** Fiyat teklifi istenen istekli firmalar */
  bidders: readonly Bidder[];
  /** Alınan birim fiyat teklifleri matrisi */
  quotes: readonly { itemId: number; bidderId: number; unitPrice: Money }[];
  /** Belirlenen kazanan firmanın ID'si (seçilmişse) */
  winnerId?: number;
  /** Sonuç onayının verildiği zaman damgası (ISO formatında) */
  resultApprovedAt?: string;
  /** Muayene kabul ve teslim alma kayıtları */
  acceptances: readonly AcceptanceRecord[];
  /** 
   * DATA_TeminDosyasi.is_locked = 1 durumunda dış kilit bilgisi.
   * (İmzalı aktarım, EKAP gönderimi veya manuel kilit; dosya tümüyle salt okunurdur).
   */
  externalLock?: { reason?: string };
}

/**
 * Doğrudan Temin Dosyası (Aggregate Root).
 * 
 * 4734 Sayılı Kamu İhale Kanunu Madde 22 kapsamında açılan bir alım dosyasının
 * tüm iş kurallarını (invariants) ve aşama geçişlerini koruyan merkezi varlıktır.
 * 
 * ### Temel İlkeler ve Kurallar:
 * 1. Dışarıdan hiçbir iç alan elle değiştirilemez (Encapsulation).
 * 2. Sonuç onaylandığında (`approveResult`) dosya kilitlenir; değişiklik yapılamaz.
 * 3. En az 2 firmadan teklif alınmadan sonuç onaylanamaz (`MIN_BIDDERS = 2`).
 * 4. Muayene kabul tutanakları yalnızca sonuç onayından sonra açılabilir ve toplam ihtiyaç miktarını aşamaz.
 */
export class DirectProcurementFile extends AggregateRoot {
  private readonly _items: NeedItem[] = [];
  private readonly _bidders: Bidder[] = [];
  private readonly _quotes = new QuoteMatrix();
  private readonly _acceptances: AcceptanceRecord[] = [];
  private _winnerId?: number;
  private _resultApproved = false;
  private _resultApprovedAt?: string;
  private _externalLock?: { reason?: string };

  private constructor(
    readonly id: number,
    readonly subject: string,
    readonly openedOn: string, // ISO YYYY-MM-DD
    readonly profile: ProcurementProfile,
  ) {
    super();
  }

  /**
   * Yeni bir Doğrudan Temin dosyası açar (Fabrika metodu).
   * 
   * @param id - Dosyanın veritabanındaki sayısal kimliği
   * @param subject - Dosyanın alım konusu
   * @param openedOn - Dosya açılış tarihi (ISO formatı YYYY-MM-DD)
   * @param profile - Alım profili (varsayılan: `DIRECT_PROCUREMENT_PROFILE`)
   * @throws {DomainError} `FILE_SUBJECT` konusu boşsa hata fırlatır
   * @returns Başlatılmış Doğrudan Temin dosyası nesnesi
   */
  static open(
    id: number,
    subject: string,
    openedOn: string,
    profile: ProcurementProfile = DIRECT_PROCUREMENT_PROFILE,
  ) {
    if (!subject.trim()) {
      throw new DomainError("FILE_SUBJECT", "Dosya konusu boş olamaz.");
    }
    return new DirectProcurementFile(id, subject, openedOn, profile);
  }

  /**
   * Veritabanından veya memento snapshot'ından dosyayı yeniden inşa eder.
   * Bu işlem geçmiş olayları tetiklemez ve kuralları baştan çalıştırmaz.
   * 
   * @param s - Dosyanın kalıcı durum görüntüsü
   * @returns Yeniden oluşturulan DirectProcurementFile nesnesi
   */
  static restore(s: FileSnapshot): DirectProcurementFile {
    const f = new DirectProcurementFile(s.id, s.subject, s.openedOn, s.profile);
    f._items.push(...s.items);
    f._bidders.push(...s.bidders);
    s.quotes.forEach((q) => f._quotes.set(q.itemId, q.bidderId, q.unitPrice));
    f._acceptances.push(...s.acceptances);
    f._winnerId = s.winnerId;
    f._resultApproved = s.resultApprovedAt !== undefined;
    f._resultApprovedAt = s.resultApprovedAt;
    f._externalLock = s.externalLock;
    return f;
  }

  /**
   * Dosyanın mevcut durumunu memento snapshot nesnesi olarak dışa aktarır.
   * 
   * @returns Değişmez FileSnapshot nesnesi
   */
  toSnapshot(): FileSnapshot {
    return {
      id: this.id,
      subject: this.subject,
      openedOn: this.openedOn,
      profile: this.profile,
      items: [...this._items],
      bidders: [...this._bidders],
      quotes: this._quotes.entries(),
      winnerId: this._winnerId,
      resultApprovedAt: this._resultApprovedAt,
      acceptances: [...this._acceptances],
      externalLock: this._externalLock,
    };
  }

  /* ---------- okuma ---------- */
  /** Dosyaya eklenmiş olan ihtiyaç kalemleri listesi */
  get items(): readonly NeedItem[] {
    return this._items;
  }
  /** Fiyat araştırmasına davet edilen firmalar listesi */
  get bidders(): readonly Bidder[] {
    return this._bidders;
  }
  /** Kalem ve firma bazında teklif fiyatları matrisi */
  get quotes(): QuoteMatrix {
    return this._quotes;
  }
  /** Muayene kabul ve teslim tutanakları listesi */
  get acceptances(): readonly AcceptanceRecord[] {
    return this._acceptances;
  }
  /** Kazanan olarak seçilen firmanın ID'si */
  get winnerId(): number | undefined {
    return this._winnerId;
  }
  /** Sonuç onayının verilip verilmediği */
  get isResultApproved(): boolean {
    return this._resultApproved;
  }
  /** Dosyanın dış bir sistem veya kilit nedeniyle salt okunur olup olmadığı */
  get isExternallyLocked(): boolean {
    return this._externalLock !== undefined;
  }

  /* ---------- Aşama 1-2: hazırlık ve araştırma ---------- */
  /**
   * Dosyaya yeni bir ihtiyaç kalemi ekler.
   * 
   * @param item - Eklenecek ihtiyaç kalemi
   * @throws {DomainError} `ITEM_DUP` aynı kimlikli kalem zaten varsa
   */
  addNeedItem(item: NeedItem): void {
    this.assertEditable();
    if (this._items.some((i) => i.id === item.id)) {
      throw new DomainError("ITEM_DUP", `Kalem zaten var: ${item.id}`);
    }
    this._items.push(item);
  }

  /**
   * Fiyat araştırmasına yeni bir istekli firma ekler.
   * 
   * @param bidder - Davet edilen istekli firma
   * @throws {DomainError} `BIDDER_MAX` azami sınır (3) aşılırsa
   * @throws {DomainError} `BIDDER_DUP` firma zaten ekliyse
   */
  addBidder(bidder: Bidder): void {
    this.assertEditable();
    if (this._bidders.length >= MAX_BIDDERS) {
      throw new DomainError(
        "BIDDER_MAX",
        `En fazla ${MAX_BIDDERS} firmadan fiyat istenebilir.`,
      );
    }
    if (this._bidders.some((b) => b.id === bidder.id)) {
      throw new DomainError("BIDDER_DUP", `Firma zaten ekli: ${bidder.title}`);
    }
    this._bidders.push(bidder);
  }

  /**
   * Bir istekli firmanın belirli bir kaleme verdiği birim fiyat teklifini kaydeder.
   * 
   * @param itemId - Fiyat verilen ihtiyaç kalemi ID'si
   * @param bidderId - Teklif veren firma ID'si
   * @param unitPriceKdvHaric - KDV hariç birim fiyat tutarı
   * @param at - Teklifin girildiği zaman damgası (ISO formatı)
   * @throws {DomainError} `ITEM_UNKNOWN` kalem dosyada yoksa
   * @throws {DomainError} `BIDDER_UNKNOWN` firma dosyada yoksa
   * @throws {DomainError} `PRICE_POSITIVE` birim fiyat sıfır veya negatifse
   */
  enterQuote(
    itemId: number,
    bidderId: number,
    unitPriceKdvHaric: Money,
    at: string,
  ): void {
    this.assertEditable();
    if (!this._items.some((i) => i.id === itemId)) {
      throw new DomainError("ITEM_UNKNOWN", `Bilinmeyen kalem: ${itemId}`);
    }
    if (!this._bidders.some((b) => b.id === bidderId)) {
      throw new DomainError("BIDDER_UNKNOWN", `Bilinmeyen firma: ${bidderId}`);
    }
    if (unitPriceKdvHaric.compareTo(Money.ZERO) <= 0) {
      throw new DomainError("PRICE_POSITIVE", "Birim fiyat pozitif olmalı.");
    }
    this._quotes.set(itemId, bidderId, unitPriceKdvHaric);
    this.raise(new QuoteChanged(this.id, at, itemId, bidderId));
  }

  /**
   * Verilen fiyatlandırma esasına göre yaklaşık maliyeti hesaplar.
   * 
   * @param basis - Fiyatlandırma esası (aritmetik ortalama, en düşük teklif, medyan vb.)
   * @param calculator - Kullanılacak hesaplama servisi
   * @returns Kalem bazında ve dosya genelinde yaklaşık maliyet sonucu
   */
  approximateCost(
    basis: PricingBasis,
    calculator: ApproximateCostCalculator = new ApproximateCostCalculator(),
  ): ApproximateCostResult {
    return calculator.calculate(
      this._items,
      this._bidders.map((b) => b.id),
      this._quotes,
      basis,
    );
  }

  /**
   * Belirtilen kazanan seçme stratejisini çalıştırarak en uygun teklifi veren yükleniciyi belirler.
   * 
   * @param strategy - Kazanan belirleme stratejisi (en düşük toplam teklif vb.)
   * @param at - Karar tarihi/zaman damgası
   * @returns Kazanan seçimi sonucu ve toplam tutar
   */
  selectWinner(strategy: WinnerSelectionStrategy, at: string): WinnerResult {
    this.assertEditable();
    const result = strategy.select(this._items, this._bidders, this._quotes);
    this._winnerId = result.bidderId;
    this.raise(new WinnerSelected(this.id, at, result.bidderId));
    return result;
  }

  /**
   * Belirtilen firmanın tüm kalemlere verdiği toplam teklif tutarını hesaplar.
   * 
   * @param bidderId - İstekli firma kimliği
   * @returns Firma tüm kalemlere fiyat vermişse toplam tutarlar; eksik kalem varsa `undefined`
   */
  totalsOf(bidderId: number): FileTotals | undefined {
    if (!this._quotes.isCompleteFor(bidderId, this._items)) return undefined;
    let haric = Money.ZERO;
    let dahil = Money.ZERO;
    for (const i of this._items) {
      const line = lineTotal(this._quotes.get(i.id, bidderId)!, i.quantity);
      haric = haric.plus(line);
      dahil = dahil.plus(withKdv(line, i.kdvPercent));
    }
    return { haric, dahil };
  }

  /* ---------- Aşama 3: sonuç onayı ---------- */
  /**
   * Piyasa fiyat araştırması sonucunu ve kazanan firmayı onaylar.
   * Onay verildiğinde dosya kilitlenir; kalemler ve teklifler üzerinde değişiklik yapılamaz.
   * 
   * @param at - Onay zaman damgası (ISO formatı)
   * @throws {DomainError} `RESULT_BLOCKED` araştırma aşaması gereksinimleri (en az 2 firma, kazanan seçimi) tamamlanmamışsa
   */
  approveResult(at: string): void {
    this.assertEditable();
    const blockers = this.exitBlockers("arastirma");
    if (blockers.length > 0) {
      throw new DomainError("RESULT_BLOCKED", blockers.join(" "));
    }
    this._resultApproved = true;
    this._resultApprovedAt = at;
    this.raise(new ResultApproved(this.id, at, this._winnerId!));
  }

  /* ---------- Aşama 4: muayene kabul (parçalı, birikimli) ---------- */
  /**
   * Onaylanmış kabul tutanakları düşüldükten sonra teslim alınmayı bekleyen kalan miktarları döndürür.
   * 
   * @returns Kalem ID -> Kalan teslim miktarı haritası
   */
  remainingQuantities(): Map<number, number> {
    const remaining = new Map(this._items.map((i) => [i.id, i.quantity]));
    for (const rec of this._acceptances) {
      if (rec.status !== "approved") continue;
      for (const l of rec.lines) {
        remaining.set(
          l.itemId,
          roundQty((remaining.get(l.itemId) ?? 0) - l.quantity),
        );
      }
    }
    return remaining;
  }

  /**
   * Yeni bir muayene ve kabul tutanağı kaydı (parçalı veya kesin teslim) oluşturur.
   * 
   * @param lines - Teslim alınan kalemler ve miktarları
   * @param date - Kabul tarihi (ISO formatı YYYY-MM-DD)
   * @throws {DomainError} `ACC_NO_ORDER` sonuç onaylanmadan kabul tutanağı açılmaya çalışılırsa
   * @throws {DomainError} `ACC_EMPTY` tutanakta kalem yoksa
   * @throws {DomainError} `ACC_OVERRUN` teslim alınan miktar ihtiyaç miktarını aşarsa
   */
  recordAcceptance(lines: AcceptanceLine[], date: string): AcceptanceRecord {
    this.assertNotExternallyLocked();
    if (!this._resultApproved) {
      throw new DomainError(
        "ACC_NO_ORDER",
        "Sonuç onaylanmadan kabul tutanağı açılamaz.",
      );
    }
    if (lines.length === 0) {
      throw new DomainError("ACC_EMPTY", "Tutanakta en az bir kalem olmalı.");
    }
    this.assertWithinRemaining(lines);
    const seqNo = this._acceptances.reduce((m, r) => Math.max(m, r.seqNo), 0) +
      1;
    const rec = new AcceptanceRecord(seqNo, date, lines);
    this._acceptances.push(rec);
    return rec;
  }

  /**
   * Belirtilen sıra numaralı muayene kabul tutanağını onaylar.
   * 
   * @param seqNo - Tutanak sıra numarası
   * @param at - Onay zaman damgası (ISO formatı)
   * @throws {DomainError} `ACC_UNKNOWN` tutanak bulunamazsa
   * @throws {DomainError} `ACC_OVERRUN` kalan miktar aşılmışsa
   */
  approveAcceptance(seqNo: number, at: string): void {
    this.assertNotExternallyLocked();
    const rec = this._acceptances.find((r) => r.seqNo === seqNo);
    if (!rec) {
      throw new DomainError("ACC_UNKNOWN", `Tutanak bulunamadı: #${seqNo}`);
    }
    this.assertWithinRemaining(rec.lines); // taslaklar fazla rezerve etmiş olabilir; onayda tekrar doğrula
    rec.approve(at);
    this.raise(new AcceptanceApproved(this.id, at, seqNo));
  }

  /* ---------- aşama kapıları ve köprü ---------- */
  /**
   * Belirtilen aşamadan bir sonraki aşamaya geçişi engelleyen eksiklikleri denetler.
   * Dönen dizi boş ise ilgili aşama tamamlanmış kabul edilir.
   * 
   * @param stage - Denetlenecek aşama
   * @returns Engellerin listesi (boş ise geçişe izin verilir)
   */
  exitBlockers(stage: FileStage): string[] {
    const b: string[] = [];
    switch (stage) {
      case "hazirlik":
        if (this._items.length === 0) {
          b.push("En az bir ihtiyaç kalemi gerekli.");
        }
        break;
      case "arastirma":
        if (this._bidders.length < MIN_BIDDERS) {
          b.push(`En az ${MIN_BIDDERS} firmadan fiyat alınmalı.`);
        }
        if (this._winnerId === undefined) b.push("Kazanan firma belirlenmedi.");
        else if (!this._quotes.isCompleteFor(this._winnerId, this._items)) {
          b.push("Kazanan firmanın tüm kalemleri fiyatlanmamış.");
        }
        break;
      case "yuklenici":
        if (!this._resultApproved) b.push("Sonuç onayı verilmedi.");
        break;
      case "kabul":
        if (!this._acceptances.some((r) => r.status === "approved")) {
          b.push("Onaylı kabul tutanağı yok.");
        }
        break;
    }
    return b;
  }

  /**
   * Mevcut `@temin360/workflow-engine` WorkflowContext'ine uyumlu alanlar.
   * Böylece kural motoru dosyayı tanır, domain ise workflow paketine bağımlı olmaz.
   */
  toWorkflowFacts(basis: PricingBasis) {
    const cost = this.approximateCost(basis).total;
    return {
      dosyaId: this.id,
      konu: this.subject,
      tur: "mal" as const,
      yaklasikMaliyet: cost.toKurusNumber() / 100,
      teklifSayisi: this._bidders.length,
      kazananFirmaId: this._winnerId,
      hasOnayBelgesi: this._resultApproved,
      hasMuayeneKabul: this._acceptances.some((r) => r.status === "approved"),
    };
  }

  /* ---------- iç kurallar ---------- */
  private assertNotExternallyLocked(): void {
    if (this._externalLock) {
      throw new DomainError(
        "FILE_LOCKED",
        `Dosya kilitli${
          this._externalLock.reason ? ` (${this._externalLock.reason})` : ""
        }, değiştirilemez.`,
      );
    }
  }

  private assertEditable(): void {
    this.assertNotExternallyLocked();
    if (this._resultApproved) {
      throw new DomainError(
        "LOCKED",
        "Sonuç onaylandı, dosya kilitli. Değişiklik için onay geri alınmalı.",
      );
    }
  }

  private assertWithinRemaining(lines: readonly AcceptanceLine[]): void {
    const remaining = this.remainingQuantities();
    const errors: string[] = [];
    for (const l of lines) {
      const left = remaining.get(l.itemId);
      if (left === undefined) errors.push(`Dosyada olmayan kalem: ${l.itemId}`);
      else if (!(l.quantity > 0)) {
        errors.push(`Miktar pozitif olmalı: ${l.itemId}`);
      } else if (l.quantity > left) {
        errors.push(
          `Kalan miktar aşıldı: kalem ${l.itemId} (kalan ${left}, istenen ${l.quantity})`,
        );
      }
    }
    if (errors.length > 0) {
      throw new DomainError("ACC_OVERRUN", errors.join(" "));
    }
  }
}
