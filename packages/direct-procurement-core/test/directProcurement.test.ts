import { describe, it, expect } from 'vitest'
import { Money } from '@temin360/domain'
import {
  AveragePricing, LowestPricing, MedianPricing, BASE_PROFILE, DIRECT_PROCUREMENT_PROFILE, OPEN_TENDER_PROFILE,
  DeductionCalculator, Md22dLimitPolicy, DomainError, InMemoryFileRepository, CollectingEventPublisher,
  OpenFileUseCase, EnterQuoteUseCase, SelectWinnerUseCase, ApproveResultUseCase, RecordAcceptanceUseCase,
  ApproveAcceptanceUseCase, CalculateDeductionsUseCase, SqliteMevzuatRateProvider,
  DirectProcurementFile, NeedItem, Bidder, type RateProvider,
} from '../src'

const AT = '2026-11-17'
const RATES = { kararPuluBinde: 5.69, damgaVergisiBinde: 9.48 }
const fixedRates: RateProvider = { ratesFor: async () => RATES }

function setup() {
  const repo = new InMemoryFileRepository()
  const events = new CollectingEventPublisher()
  return { repo, events }
}

async function fileWithQuotes(repo: InMemoryFileRepository, events: CollectingEventPublisher) {
  await new OpenFileUseCase(repo, events).execute({
    id: 348, subject: 'Yedek parça', date: AT,
    items: [
      { id: 1, name: 'King Post Keçesi', quantity: 1, unit: 'Adet', kdvPercent: 20 },
      { id: 2, name: 'Kapı Amortisörü', quantity: 2, unit: 'Adet', kdvPercent: 20 },
    ],
    bidders: [{ id: 10, title: 'A Ltd' }, { id: 11, title: 'B Ltd' }, { id: 12, title: 'C Ltd' }],
  })
  const q = new EnterQuoteUseCase(repo, events)
  const put = (item: number, bidder: number, tl: string) => q.execute({ fileId: 348, itemId: item, bidderId: bidder, unitPriceTL: tl, at: AT })
  await put(1, 10, '22970.00'); await put(2, 10, '400.00')
  await put(1, 11, '23000.00'); await put(2, 11, '450.00')
  await put(1, 12, '24150.00') // C, 2. kaleme fiyat vermedi -> eksik teklif
}

describe('profil', () => {
  it('doğrudan teminde kesinti kuralı yok, genel ihalede karar pulu var', () => {
    expect(DIRECT_PROCUREMENT_PROFILE.deductions).toHaveLength(0)
    expect(OPEN_TENDER_PROFILE.hasDeduction('karar-pulu')).toBe(true)
    expect(BASE_PROFILE.deductions).toHaveLength(0) // üst profil değişmedi
    expect(OPEN_TENDER_PROFILE.lineage).toEqual(['base', 'acik-ihale'])
  })

  it('extend: remove üstten çıkarır, add aynı id ile ezer', () => {
    const p = OPEN_TENDER_PROFILE.extend('pazarlik', 'Pazarlık', { removeDeductions: ['karar-pulu'], removeDocuments: ['sozlesme'] })
    expect(p.deductions).toHaveLength(0)
    expect(p.documents).not.toContain('sozlesme')
    expect(p.documents).toContain('muayene-kabul-tutanagi')
  })
})

describe('kesinti hesabı (regresyon: 858,04 TL)', () => {
  const ctx = {
    totalKdvHaric: Money.fromTL('150798.33'),
    totalKdvDahil: Money.fromTL('180958.00'),
    rates: RATES,
  }
  const calc = new DeductionCalculator()

  it('genel ihale: karar pulu 858,04 TL', () => {
    const lines = calc.calculate(OPEN_TENDER_PROFILE, ctx)
    expect(lines[0]!.amount.toTLString()).toBe('858,04 TL')
  })
  it('doğrudan temin: hiç kesinti çıkmaz', () => {
    expect(calc.calculate(DIRECT_PROCUREMENT_PROFILE, ctx)).toHaveLength(0)
  })
})

describe('fiyat esasları', () => {
  const m = (s: string) => Money.fromTL(s)
  it('ortalama / en düşük / medyan', () => {
    const prices = [m('100'), m('200'), m('600')]
    expect(new AveragePricing().unitPrice(prices)!.toTLString()).toBe('300,00 TL')
    expect(new LowestPricing().unitPrice(prices)!.toTLString()).toBe('100,00 TL')
    expect(new MedianPricing().unitPrice(prices)!.toTLString()).toBe('200,00 TL')
    expect(new MedianPricing().unitPrice([m('100'), m('200')])!.toTLString()).toBe('150,00 TL')
    expect(new AveragePricing().unitPrice([])).toBeUndefined()
  })
})

describe('dosya yaşam döngüsü (use-case katmanı)', () => {
  it('eksik teklifli firma kazanamaz, en düşük tam teklif seçilir, yaklaşık maliyet hesaplanır', async () => {
    const { repo, events } = setup()
    await fileWithQuotes(repo, events)
    const result = await new SelectWinnerUseCase(repo, events).execute({ fileId: 348, at: AT })
    expect(result.bidderId).toBe(10)
    expect(result.total.toTLString()).toBe('23.770,00 TL') // 22970 + 2×400

    const file = (await repo.findById(348))!
    const approx = file.approximateCost(new AveragePricing())
    expect(approx.missingItemIds).toEqual([])
    expect(events.published.map((e) => e.name)).toContain('WinnerSelected')
    expect(events.published.filter((e) => e.name === 'QuoteChanged')).toHaveLength(5)
  })

  it('sonuç onayından sonra dosya kilitlenir; kabul kalan miktarı aşamaz', async () => {
    const { repo, events } = setup()
    await fileWithQuotes(repo, events)
    await new SelectWinnerUseCase(repo, events).execute({ fileId: 348, at: AT })
    await new ApproveResultUseCase(repo, events).execute({ fileId: 348, at: AT })

    await expect(
      new EnterQuoteUseCase(repo, events).execute({ fileId: 348, itemId: 1, bidderId: 10, unitPriceTL: '1.00', at: AT }),
    ).rejects.toMatchObject({ code: 'LOCKED' })

    const acc = new RecordAcceptanceUseCase(repo, events)
    const seq1 = await acc.execute({ fileId: 348, date: AT, lines: [{ itemId: 2, quantity: 1 }] })
    await new ApproveAcceptanceUseCase(repo, events).execute({ fileId: 348, seqNo: seq1, at: AT })

    const file = (await repo.findById(348))!
    expect(file.remainingQuantities().get(2)).toBe(1)
    await expect(acc.execute({ fileId: 348, date: AT, lines: [{ itemId: 2, quantity: 2 }] }))
      .rejects.toMatchObject({ code: 'ACC_OVERRUN' })
  })

  it('iki taslak aynı kalemi aşıyorsa ikincisinin onayı reddedilir', async () => {
    const { repo, events } = setup()
    await fileWithQuotes(repo, events)
    await new SelectWinnerUseCase(repo, events).execute({ fileId: 348, at: AT })
    await new ApproveResultUseCase(repo, events).execute({ fileId: 348, at: AT })
    const acc = new RecordAcceptanceUseCase(repo, events)
    const a = await acc.execute({ fileId: 348, date: AT, lines: [{ itemId: 2, quantity: 2 }] })
    const b = await acc.execute({ fileId: 348, date: AT, lines: [{ itemId: 2, quantity: 2 }] }) // taslak düşmez, geçer
    const approve = new ApproveAcceptanceUseCase(repo, events)
    await approve.execute({ fileId: 348, seqNo: a, at: AT })
    await expect(approve.execute({ fileId: 348, seqNo: b, at: AT })).rejects.toMatchObject({ code: 'ACC_OVERRUN' })
  })

  it('doğrudan temin dosyasında kesinti hesabı boş döner', async () => {
    const { repo, events } = setup()
    await fileWithQuotes(repo, events)
    await new SelectWinnerUseCase(repo, events).execute({ fileId: 348, at: AT })
    const lines = await new CalculateDeductionsUseCase(repo, fixedRates).execute({ fileId: 348, date: AT })
    expect(lines).toEqual([])
  })

  it('aşama kapıları ve workflow köprüsü', async () => {
    const { repo, events } = setup()
    await fileWithQuotes(repo, events)
    const file = (await repo.findById(348))!
    expect(file.exitBlockers('hazirlik')).toEqual([])
    expect(file.exitBlockers('arastirma')).toContain('Kazanan firma belirlenmedi.')
    const facts = file.toWorkflowFacts(new AveragePricing())
    expect(facts).toMatchObject({ dosyaId: 348, teklifSayisi: 3, hasOnayBelgesi: false })
  })
})

describe('domain kuralları', () => {
  it('en fazla 3 firma, pozitif fiyat, bilinmeyen kalem', () => {
    const f = DirectProcurementFile.open(1, 'x', AT)
    ;[1, 2, 3].forEach((i) => f.addBidder(new Bidder(i, `F${i}`)))
    expect(() => f.addBidder(new Bidder(4, 'F4'))).toThrow(DomainError)
    f.addNeedItem(new NeedItem(1, 'k', 1, 'Adet', 20))
    expect(() => f.enterQuote(1, 1, Money.ZERO, AT)).toThrow(/pozitif/)
    expect(() => f.enterQuote(99, 1, Money.fromTL('5'), AT)).toThrow(/Bilinmeyen kalem/)
  })

  it('22/d limiti: 2026 küçük belediye limiti aşımı', () => {
    const policy = new Md22dLimitPolicy()
    const over = policy.evaluate(Money.fromTL('400000'), AT, 'diger')
    expect(over.withinLimit).toBe(false)
    expect(over.margin.isNegative()).toBe(true)
    expect(policy.evaluate(Money.fromTL('180928'), AT, 'diger').withinLimit).toBe(true)
  })
})

describe('infrastructure', () => {
  it('SqliteMevzuatRateProvider oranı TANIM_Mevzuat satırından okur', async () => {
    const row = { karar_pulu_orani: 5.69, damga_vergisi_orani: 9.48 }
    const db = { query: async <T>() => [row] as unknown as T[], transaction: async () => {} }
    expect(await new SqliteMevzuatRateProvider(db).ratesFor('2026-11-17')).toEqual(RATES)
    const empty = { query: async <T>() => [] as T[], transaction: async () => {} }
    await expect(new SqliteMevzuatRateProvider(empty).ratesFor('2031-01-01')).rejects.toThrow(/2031/)
  })
})
