import { describe, it, expect } from 'vitest'
import {
  compileToMustache,
  evaluateSingleRule,
  evaluateCondition,
  evaluateAllConditions,
  resolvePlaceholders,
  extractUsedPlaceholderKeys,
  sanitizeHtml,
  renderBelge,
  YerTutucuTanimi,
  KosulKurali,
  KosulGrubu
} from '../index'

describe('Belgelerim Çekirdek Motoru (Faz 1)', () => {
  describe('1. Compiler (Kanonik HTML -> Mustache Derleyicisi)', () => {
    it('yer tutucu işaretlerini (data-ph) {{anahtar}} formatına derler', () => {
      const input = '<p>Sayın <span data-ph="yetkiliAdi">Yetkili</span>, hoşgeldiniz.</p>'
      const output = compileToMustache(input)
      expect(output).toBe('<p>Sayın {{yetkiliAdi}}, hoşgeldiniz.</p>')
    })

    it('koşullu blokları (data-cond) {{#bayrak}}...{{/bayrak}} formatına derler', () => {
      const input = '<div data-cond="kdvVar"><p>KDV Dahildir.</p></div>'
      const output = compileToMustache(input)
      expect(output).toBe('{{#kdvVar}}<p>KDV Dahildir.</p>{{/kdvVar}}')
    })

    it('liste bloklarını (data-each) {{#liste}}...{{/liste}} formatına derler', () => {
      const input =
        '<div data-each="uyeler"><p><span data-ph="adSoyad">İsim</span> - <span data-ph="unvan">Unvan</span></p></div>'
      const output = compileToMustache(input)
      expect(output).toBe('{{#uyeler}}<p>{{adSoyad}} - {{unvan}}</p>{{/uyeler}}')
    })

    it('iç içe koşullu ve liste bloklarını hatasız derler', () => {
      const input =
        '<div data-cond="komisyonVar"><div data-each="uyeler"><p><span data-ph="ad">Ad</span></p></div></div>'
      const output = compileToMustache(input)
      expect(output).toBe('{{#komisyonVar}}{{#uyeler}}<p>{{ad}}</p>{{/uyeler}}{{/komisyonVar}}')
    })
  })

  describe('2. Evaluator (Koşul Değerlendiricisi & Operatörler)', () => {
    it('eq operatörü: eşitlik denetimi', () => {
      const rule: KosulKurali = { ad: 'c1', kaynak: 'alimTuru', op: 'eq', deger: 'Mal' }
      expect(evaluateSingleRule(rule, { alimTuru: 'Mal' })).toBe(true)
      expect(evaluateSingleRule(rule, { alimTuru: 'Hizmet' })).toBe(false)
    })

    it('ne operatörü: eşit olmama denetimi', () => {
      const rule: KosulKurali = { ad: 'c2', kaynak: 'durum', op: 'ne', deger: 'Iptal' }
      expect(evaluateSingleRule(rule, { durum: 'Aktif' })).toBe(true)
      expect(evaluateSingleRule(rule, { durum: 'Iptal' })).toBe(false)
    })

    it('gt / gte / lt / lte sayısal operatörleri', () => {
      const gtRule: KosulKurali = { ad: 'c3', kaynak: 'tutar', op: 'gt', deger: 5000 }
      const gteRule: KosulKurali = { ad: 'c4', kaynak: 'tutar', op: 'gte', deger: 5000 }
      const ltRule: KosulKurali = { ad: 'c5', kaynak: 'tutar', op: 'lt', deger: 5000 }
      const lteRule: KosulKurali = { ad: 'c6', kaynak: 'tutar', op: 'lte', deger: 5000 }

      expect(evaluateSingleRule(gtRule, { tutar: 6000 })).toBe(true)
      expect(evaluateSingleRule(gtRule, { tutar: 5000 })).toBe(false)

      expect(evaluateSingleRule(gteRule, { tutar: 5000 })).toBe(true)
      expect(evaluateSingleRule(gteRule, { tutar: 4999 })).toBe(false)

      expect(evaluateSingleRule(ltRule, { tutar: 4000 })).toBe(true)
      expect(evaluateSingleRule(ltRule, { tutar: 5000 })).toBe(false)

      expect(evaluateSingleRule(lteRule, { tutar: 5000 })).toBe(true)
      expect(evaluateSingleRule(lteRule, { tutar: 5001 })).toBe(false)
    })

    it('dolu ve bos operatörleri (metin ve dizi)', () => {
      const doluRule: KosulKurali = { ad: 'c7', kaynak: 'aciklama', op: 'dolu' }
      const bosRule: KosulKurali = { ad: 'c8', kaynak: 'ekler', op: 'bos' }

      expect(evaluateSingleRule(doluRule, { aciklama: 'Var' })).toBe(true)
      expect(evaluateSingleRule(doluRule, { aciklama: '' })).toBe(false)
      expect(evaluateSingleRule(doluRule, { aciklama: null })).toBe(false)

      expect(evaluateSingleRule(bosRule, { ekler: [] })).toBe(true)
      expect(evaluateSingleRule(bosRule, { ekler: ['Ek 1'] })).toBe(false)
      expect(evaluateSingleRule(bosRule, {})).toBe(true)
    })

    it('icerir operatörü (metin içinde arama ve dizi elemanı)', () => {
      const icerirMetin: KosulKurali = {
        ad: 'c9',
        kaynak: 'konu',
        op: 'icerir',
        deger: 'kırtasiye'
      }
      const icerirDizi: KosulKurali = {
        ad: 'c10',
        kaynak: 'etiketler',
        op: 'icerir',
        deger: 'acil'
      }

      expect(evaluateSingleRule(icerirMetin, { konu: 'Yıllık Kırtasiye Alımı' })).toBe(true)
      expect(evaluateSingleRule(icerirMetin, { konu: 'Bilgisayar Alımı' })).toBe(false)

      expect(evaluateSingleRule(icerirDizi, { etiketler: ['önemli', 'acil'] })).toBe(true)
      expect(evaluateSingleRule(icerirDizi, { etiketler: ['rutin'] })).toBe(false)
    })

    it('VE grubu: tüm kurallar sağlanmalı', () => {
      const group: KosulGrubu = {
        ad: 'onayGerekli',
        baglac: 'VE',
        kurallar: [
          { ad: 'r1', kaynak: 'tutar', op: 'gt', deger: 100000 },
          { ad: 'r2', kaynak: 'birim', op: 'eq', deger: 'FenIsleri' }
        ]
      }

      expect(evaluateCondition(group, { tutar: 150000, birim: 'FenIsleri' })).toBe(true)
      expect(evaluateCondition(group, { tutar: 50000, birim: 'FenIsleri' })).toBe(false)
      expect(evaluateCondition(group, { tutar: 150000, birim: 'Kultur' })).toBe(false)
    })

    it('VEYA grubu: kurallardan en az biri sağlanmalı', () => {
      const group: KosulGrubu = {
        ad: 'muafiyetVar',
        baglac: 'VEYA',
        kurallar: [
          { ad: 'r1', kaynak: 'istisna', op: 'eq', deger: '22b' },
          { ad: 'r2', kaynak: 'istisna', op: 'eq', deger: '22c' }
        ]
      }

      expect(evaluateCondition(group, { istisna: '22b' })).toBe(true)
      expect(evaluateCondition(group, { istisna: '22c' })).toBe(true)
      expect(evaluateCondition(group, { istisna: '22d' })).toBe(false)
    })
  })

  describe('3. Scope Resolver (Kapsam Çözümleme: Belge > Grup > Genel)', () => {
    it('aynı anahtara sahip yer tutucularda öncelik kuralını uygular (belge > grup > genel)', () => {
      const genel: YerTutucuTanimi[] = [
        {
          anahtar: 'makam',
          etiket: 'Genel Makam',
          tip: 'metin',
          kapsam: 'genel',
          varsayilan: 'Genel Değer'
        },
        { anahtar: 'tarih', etiket: 'Belge Tarihi', tip: 'tarih', kapsam: 'genel' }
      ]

      const grup: YerTutucuTanimi[] = [
        {
          anahtar: 'makam',
          etiket: 'Grup Makamı',
          tip: 'metin',
          kapsam: 'grup',
          varsayilan: 'Grup Değeri'
        },
        { anahtar: 'grupKodu', etiket: 'Grup Kodu', tip: 'metin', kapsam: 'grup' }
      ]

      const belge: YerTutucuTanimi[] = [
        {
          anahtar: 'makam',
          etiket: 'Özel Makam',
          tip: 'metin',
          kapsam: 'belge',
          varsayilan: 'Özel Değer'
        }
      ]

      const resolved = resolvePlaceholders(genel, grup, belge)

      // makam yer tutucusu belge kapsamındaki tanımı almalı
      const makamField = resolved.find((f) => f.anahtar === 'makam')
      expect(makamField?.etiket).toBe('Özel Makam')
      expect(makamField?.varsayilan).toBe('Özel Değer')
      expect(makamField?.kapsam).toBe('belge')

      // grupKodu grup kapsamından gelmeli
      const grupField = resolved.find((f) => f.anahtar === 'grupKodu')
      expect(grupField?.kapsam).toBe('grup')

      // tarih genel kapsamından gelmeli
      const tarihField = resolved.find((f) => f.anahtar === 'tarih')
      expect(tarihField?.kapsam).toBe('genel')
    })

    it('belgeden kullanılan yer tutucu anahtarlarını ayıklar', () => {
      const html = '<p><span data-ph="ad">A</span> ve <span data-ph="soyad">B</span></p>'
      const keys = extractUsedPlaceholderKeys(html)
      expect(keys).toEqual(['ad', 'soyad'])
    })
  })

  describe('4. Sanitizer (XSS ve Güvenlik)', () => {
    it('script etiketlerini ve içeriğini temizler', () => {
      const malicious = '<p>Normal</p><script>alert("hacked")</script>'
      expect(sanitizeHtml(malicious)).toBe('<p>Normal</p>')
    })

    it('on* olay işleyicilerini (onerror, onclick vb.) temizler', () => {
      const malicious = '<img src="resim.jpg" onerror="alert(1)" onclick="steal()">'
      expect(sanitizeHtml(malicious)).toBe('<img src="resim.jpg">')
    })

    it('javascript: bağlantılarını etkisiz hale getirir', () => {
      const malicious = '<a href="javascript:alert(1)">Tıkla</a>'
      expect(sanitizeHtml(malicious)).toContain('href="blocked:')
    })
  })

  describe('5. RenderBelge (Uçtan Uca Render)', () => {
    it('yer tutucuları ve koşulları doğru bağlayıp render eder', () => {
      const templateHtml = `
        <p>Sayın <span data-ph="muhatap">Müdürlük</span>,</p>
        <div data-cond="onayGoster">
          <p>Onay Belgesi Ektedir.</p>
        </div>
        <div data-each="kalemler">
          <p>- <span data-ph="ad">Kalem</span>: <span data-ph="fiyat">0</span> TL</p>
        </div>
      `

      const context = {
        muhatap: 'Destek Hizmetleri',
        tutar: 15000,
        kalemler: [
          { ad: 'A4 Kağıt', fiyat: 120 },
          { ad: 'Toner', fiyat: 850 }
        ]
      }

      const conditions: KosulKurali[] = [
        { ad: 'onayGoster', kaynak: 'tutar', op: 'gt', deger: 10000 }
      ]

      const result = renderBelge(templateHtml, context, conditions)

      expect(result).toContain('Sayın Destek Hizmetleri,')
      expect(result).toContain('Onay Belgesi Ektedir.')
      expect(result).toContain('- A4 Kağıt: 120 TL')
      expect(result).toContain('- Toner: 850 TL')
    })

    it('koşul sağlanmadığında koşullu blok gizlenir', () => {
      const templateHtml = '<div data-cond="indirimVar"><p>Özel İndirim!</p></div>'
      const context = { oran: 0 }
      const conditions: KosulKurali[] = [{ ad: 'indirimVar', kaynak: 'oran', op: 'gt', deger: 0 }]

      const result = renderBelge(templateHtml, context, conditions)
      expect(result).not.toContain('Özel İndirim!')
    })

    it('Mustache HTML kaçışı kullanıcı girdilerindeki zararlı etiketleri kaçışlar', () => {
      const templateHtml = '<p>Açıklama: <span data-ph="aciklama">Test</span></p>'
      const context = {
        aciklama: '<b>Kalın</b> & <img src=x onerror=alert(1)>'
      }

      const result = renderBelge(templateHtml, context)
      // Mustache HTML kaçışı devrede olmalı: < -> &lt;, / -> &#x2F;
      expect(result).toContain('&lt;b&gt;Kalın&lt;&#x2F;b&gt;')
      expect(result).not.toContain('<img src=x')
    })
  })
})
