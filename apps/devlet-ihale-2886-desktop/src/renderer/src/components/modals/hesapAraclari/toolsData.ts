import Decimal from 'decimal.js'
import { ToolGroup } from './types'
import {
  D,
  H,
  parseDec,
  isOk,
  zero,
  formatNum,
  formatPct,
  parseDecList,
  sumDec,
  gcd,
  U
} from './decimalUtils'
import { amountToWordsTL } from '../../../utils/sayiyiYaziyaCevir'
import { yaziyiSayiyaCevir, formatTL } from '../../../utils/ihale/paraVeYuvarlamaUtils'

export const TOOLS: ToolGroup[] = [
  {
    id: 'temel',
    grp: 'Yüzde',
    name: 'Temel Yüzde Hesaplayıcı',
    hint: 'İki sayıyı yazın; düzden ve tersten tüm yüzde oranlarını anında görün.',
    in: [
      { k: 'a', l: '1. Sayı (Matrah / Bütün)', ph: '1000' },
      { k: 'b', l: '2. Sayı (Pay / Tutar)', ph: '200' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.a, v.b)) return null
      const a = v.a as Decimal
      const b = v.b as Decimal
      const ratio = a.isZero() ? null : b.div(a).times(100)
      const diff = a.isZero() ? null : b.minus(a).div(a).times(100)
      const pc = a.times(b).div(100)
      const up = a.times(H.plus(b)).div(100)
      const dn = a.times(H.minus(b)).div(100)
      const inv = b.isZero() ? null : a.times(100).div(b)

      return {
        g: [
          {
            t: 'Düzden Hesaplama (1. Sayı Baz Alınır)',
            s: `${formatNum(a, prec)} sayısı temeliyle`,
            r: [
              [
                `${formatNum(a, prec)} sayısına göre ${formatNum(b, prec)} yüzde kaç?`,
                ratio ? formatPct(ratio, prec) : null
              ],
              [
                `${formatNum(a, prec)} sayısına göre ${formatNum(b, prec)} yüzde kaç ${diff && diff.isNeg() ? 'az' : 'fazla'}?`,
                diff ? formatPct(diff.abs(), prec) : null
              ],
              [
                `${formatNum(a, prec)} sayısının %${formatNum(b, prec)} değeri`,
                formatNum(pc, prec)
              ],
              [
                `${formatNum(a, prec)} sayısına %${formatNum(b, prec)} eklersen`,
                formatNum(up, prec)
              ],
              [
                `${formatNum(a, prec)} sayısından %${formatNum(b, prec)} çıkarırsan`,
                formatNum(dn, prec)
              ],
              [
                `Yüzde %${formatNum(b, prec)} değeri ${formatNum(a, prec)} olan asıl sayı`,
                inv ? formatNum(inv, prec) : null
              ]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'sayiyuzde',
    grp: 'Yüzde',
    name: 'Sayı ve Yüzde Oranı',
    hint: 'Sayı ve yüzde girin; yüzdesini, artırılmış ve azaltılmış halini geriye doğru hesaplayın.',
    in: [
      { k: 'n', l: 'Tutar / Sayı', ph: '50000' },
      { k: 'r', l: 'Yüzde Oranı (%)', ph: '20', chips: [1, 10, 18, 20, 25] }
    ],
    calc: (v, prec) => {
      if (!isOk(v.n, v.r)) return null
      const n = v.n as Decimal
      const r = v.r as Decimal
      const a = H.plus(r)
      const b = H.minus(r)
      const valPct = n.times(r).div(100)
      const valUp = n.times(a).div(100)
      const valDn = n.times(b).div(100)

      return {
        g: [
          {
            t: 'İleri Doğru Hesaplama',
            s: `${formatNum(n, prec)} tutarı ve %${formatNum(r, prec)} oranı`,
            r: [
              [`Sayının %${formatNum(r, prec)} tutarı`, formatNum(valPct, prec)],
              [`%${formatNum(r, prec)} eklenmiş tutar (Artış)`, formatNum(valUp, prec)],
              [`%${formatNum(r, prec)} düşülmüş tutar (İndirim)`, formatNum(valDn, prec)]
            ]
          },
          {
            t: 'Geriye Doğru Matrah Tespiti',
            s: `Elimizdeki net tutar ${formatNum(n, prec)}`,
            r: [
              [
                `${formatNum(n, prec)} tutarı bütünün %${formatNum(r, prec)} kadarıysa asıl bütün`,
                r.isZero() ? null : formatNum(n.times(100).div(r), prec)
              ],
              [
                `${formatNum(n, prec)} tutarı %${formatNum(r, prec)} eklenmiş hali ise net matrah`,
                a.gt(0) ? formatNum(n.times(100).div(a), prec) : null
              ],
              [
                `${formatNum(n, prec)} tutarı %${formatNum(r, prec)} indirilmiş hali ise net matrah`,
                b.gt(0) ? formatNum(n.times(100).div(b), prec) : null
              ]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'geridonus',
    grp: 'Yüzde',
    name: 'Geri Dönüş Yüzdesi',
    hint: 'Bir değer %x arttıktan sonra eski değerine dönmek için yüzde kaç azalmalı?',
    in: [
      { k: 'r', l: 'Değişim Oranı (%)', ph: '25', chips: [10, 20, 25, 50] },
      { k: 'n', l: 'Başlangıç Değeri (Opsiyonel)', ph: '1000' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.r) || (v.r as Decimal).lte(0)) return null
      const r = v.r as Decimal
      const b = H.minus(r)
      const retUp = r.div(H.plus(r)).times(100)
      const retDn = b.gt(0) ? r.div(b).times(100) : null
      const netChange = r.times(r).div(100).neg()

      const g = [
        {
          t: 'Geri Dönüş Oranları',
          s: `%${formatNum(r, prec)} değişim sonrası`,
          r: [
            [
              `%${formatNum(r, prec)} arttıktan sonra eski değere dönmek için gereken azalış`,
              formatPct(retUp, prec)
            ],
            [
              `%${formatNum(r, prec)} azaldıktan sonra eski değere dönmek için gereken artış`,
              retDn ? formatPct(retDn, prec) : null
            ],
            [
              `Önce %${formatNum(r, prec)} artıp sonra %${formatNum(r, prec)} azalırsa net değişim`,
              formatPct(netChange, prec)
            ]
          ] as [string, string | null][]
        }
      ]

      if (isOk(v.n)) {
        const n = v.n as Decimal
        const valUp = n.times(H.plus(r)).div(100)
        const valNet = n.times(H.plus(r)).times(b).div(10000)
        const valDn = n.times(b).div(100)
        g.push({
          t: 'Değer Simülasyonu',
          s: `Başlangıç tutarı ${formatNum(n, prec)}`,
          r: [
            [`%${formatNum(r, prec)} artınca yeni tutar`, formatNum(valUp, prec)],
            [`Önce artıp sonra %${formatNum(r, prec)} azalınca son tutar`, formatNum(valNet, prec)],
            [`%${formatNum(r, prec)} azalınca yeni tutar`, formatNum(valDn, prec)]
          ]
        })
      }
      return { g }
    }
  },
  {
    id: 'ardisik',
    grp: 'Yüzde',
    name: 'Ardışık Yüzde Değişimi',
    hint: 'Art arda gelen artış ve azalışların net etkisini bulun. Artış için +20, azalış için -10 yazın.',
    in: [
      { k: 'l', l: 'Değişim Listesi (örn. +20 -10 +5)', ph: '20 -10 5', text: true },
      { k: 'n', l: 'Başlangıç Değeri (Opsiyonel)', ph: '10000' }
    ],
    calc: (v, prec) => {
      const list = parseDecList(v.l || '')
      if (!list.length) return null
      const factor = list.reduce((s, x) => s.times(H.plus(x)).div(100), D(1))
      const totalChangePct = factor.minus(1).times(100)
      const simpleSumPct = sumDec(list)
      const avgPeriodPct = factor.gt(0)
        ? factor.pow(D(1).div(list.length)).minus(1).times(100)
        : null

      const r: [string, string | null][] = [
        ['Bileşik Net Toplam Değişim', formatPct(totalChangePct, prec)],
        ['Toplam Çarpan Katsayısı', formatNum(factor, prec)],
        ['Basit Toplam (Bileşiksiz)', formatPct(simpleSumPct, prec)],
        ['Dönem Başı Ortalama Değişim', avgPeriodPct ? formatPct(avgPeriodPct, prec) : null]
      ]

      if (isOk(v.n)) {
        const n = v.n as Decimal
        const finalVal = n.times(factor)
        const diffVal = finalVal.minus(n)
        r.push(['Son Tutar', formatNum(finalVal, prec)], ['Net Fark', formatNum(diffVal, prec)])
      }

      return { g: [{ t: 'Ardışık Değişim Analizi', s: `${list.length} adet dönem değişimi`, r }] }
    }
  },
  {
    id: 'yuzdeyuzde',
    grp: 'Yüzde',
    name: 'Yüzdenin Yüzdesi',
    hint: 'İki yüzdeyi üst üste uygulayın: Önce %a, ardından çıkan tutarın %b kadarını hesaplayın.',
    in: [
      { k: 'a', l: '1. Yüzde Oranı (%)', ph: '40' },
      { k: 'b', l: '2. Yüzde Oranı (%)', ph: '25' },
      { k: 'n', l: 'Matrah / Tutarı (Opsiyonel)', ph: '1000' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.a, v.b)) return null
      const a = v.a as Decimal
      const b = v.b as Decimal
      const combinedPct = a.times(b).div(100)

      const r: [string, string | null][] = [
        ['Bileşik Net Yüzde Oranı', formatPct(combinedPct, prec)]
      ]

      if (isOk(v.n)) {
        const n = v.n as Decimal
        const valA = n.times(a).div(100)
        const valFinal = valA.times(b).div(100)
        r.push(
          [`${formatNum(n, prec)} tutarının %${formatNum(a, prec)} değeri`, formatNum(valA, prec)],
          ['Sonuç (2. Yüzde Uygulanmış Tutar)', formatNum(valFinal, prec)]
        )
      }

      return {
        g: [{ t: 'Bileşik Yüzde Sonucu', s: `%${formatNum(a, prec)} ve %${formatNum(b, prec)}`, r }]
      }
    }
  },
  {
    id: 'pay',
    grp: 'Yüzde',
    name: 'Yüzdeyle Paylaştırma',
    hint: 'Bir toplam tutarı yüzdelere göre paylara bölün. Yüzdeleri boşlukla yazın (örn. 50 30 20).',
    in: [
      { k: 't', l: 'Dağıtılacak Toplam Tutar', ph: '120000' },
      { k: 'l', l: 'Yüzde Oranları (örn. 50 30 20)', ph: '50 30 20', text: true }
    ],
    calc: (v, prec) => {
      const list = parseDecList(v.l || '')
      if (!isOk(v.t) || !list.length) return null
      const t = v.t as Decimal
      const sp = sumDec(list)
      const r: [string, string | null][] = list.map((x, i) => [
        `${i + 1}. Pay (%${formatNum(x, prec)})`,
        formatNum(t.times(x).div(100), prec)
      ])

      const unallocatedPct = H.minus(sp)
      const unallocatedVal = t.times(unallocatedPct.abs()).div(100)
      r.push(
        ['Dağıtılan Toplam Yüzde', formatPct(sp, prec)],
        [
          sp.lt(100)
            ? `Dağıtılmayan Kalan (%${formatNum(unallocatedPct, prec)})`
            : sp.gt(100)
              ? `Fazla Dağıtılan Kısım (%${formatNum(sp.minus(100), prec)})`
              : 'Tam Dağıtıldı',
          formatNum(unallocatedVal, prec)
        ]
      )

      return {
        g: [{ t: 'Paylaştırma Sonuçları', s: `${formatNum(t, prec)} toplam tutar üzerinden`, r }]
      }
    }
  },
  {
    id: 'puan',
    grp: 'Yüzde',
    name: 'Yüzde Puan Farkı',
    hint: 'Oran değişimlerinde mutlak yüzde puanı farkı ile bağıl artış/azalış yüzdesini ayrı ayrı görün.',
    in: [
      { k: 'e', l: 'Eski Oran (%)', ph: '20' },
      { k: 'y', l: 'Yeni Oran (%)', ph: '25' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.e, v.y)) return null
      const e = v.e as Decimal
      const y = v.y as Decimal
      const diffPuan = y.minus(e)
      const relPct = e.isZero() ? null : y.minus(e).div(e).times(100)

      return {
        g: [
          {
            t: 'Oran Farkı Analizi',
            s: `%${formatNum(e, prec)} → %${formatNum(y, prec)}`,
            r: [
              ['Mutlak Yüzde Puan Farkı', formatNum(diffPuan, prec) + ' Puan'],
              [
                `Göreli Değişim Oranı (${y.lt(e) ? 'Azalış' : 'Artış'})`,
                relPct ? formatPct(relPct.abs(), prec) : null
              ]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'zam',
    grp: 'Yüzde',
    name: 'Zam & Enflasyon Hesaplayıcı',
    hint: 'Eski/yeni değerden zam oranını veya eski değer ve orandan yeni zamlı tutarı hesaplayın.',
    in: [
      { k: 'e', l: 'Eski Tutar (Maaş/Fiyat)', ph: '25000' },
      { k: 'y', l: 'Yeni Tutar', ph: '32500' },
      { k: 'r', l: 'Zam / Enflasyon Oranı (%)', ph: '30' }
    ],
    calc: (v, prec) => {
      const r: [string, string | null][] = []
      if (isOk(v.e, v.y) && !(v.e as Decimal).isZero()) {
        const e = v.e as Decimal
        const y = v.y as Decimal
        const rate = y.minus(e).div(e).times(100)
        r.push(
          ['Hesaplanan Zam Oranı', formatPct(rate, prec)],
          ['Fark Tutarı', formatNum(y.minus(e), prec)]
        )
      }
      if (isOk(v.e, v.r)) {
        const e = v.e as Decimal
        const rate = v.r as Decimal
        r.push([
          `%${formatNum(rate, prec)} Zam Uygulanmış Yeni Tutar`,
          formatNum(e.times(H.plus(rate)).div(100), prec)
        ])
      }
      if (isOk(v.y, v.r) && H.plus(v.r as Decimal).gt(0)) {
        const y = v.y as Decimal
        const rate = v.r as Decimal
        r.push([
          `%${formatNum(rate, prec)} Zamlı Hali ${formatNum(y, prec)} ise Eski Tutar`,
          formatNum(y.times(100).div(H.plus(rate)), prec)
        ])
      }
      return r.length ? { g: [{ t: 'Zam ve Artış Analizi', s: 'Girilen alanlara göre', r }] } : null
    }
  },
  {
    id: 'oranti',
    grp: 'Yüzde',
    name: 'Düz & Ters Orantı',
    hint: '"A için B ise, C için kaç?" sorusunu düz ve ters orantı mantığıyla hassas çözün.',
    in: [
      { k: 'a', l: 'A Değeri (örn. 3 birim)', ph: '3' },
      { k: 'b', l: 'B Değeri (örn. 450 ₺)', ph: '450' },
      { k: 'c', l: 'C Değeri (örn. 5 birim)', ph: '5' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.a, v.b, v.c)) return null
      const a = v.a as Decimal
      const b = v.b as Decimal
      const c = v.c as Decimal

      const direct = a.isZero() ? null : c.times(b).div(a)
      const inverse = c.isZero() ? null : a.times(b).div(c)

      return {
        g: [
          {
            t: 'Orantı Hesaplama',
            s: `${formatNum(a, prec)} için ${formatNum(b, prec)} ise ${formatNum(c, prec)} için:`,
            r: [
              ['Düz Orantı Sonucu (Doğru Orantı)', direct ? formatNum(direct, prec) : null],
              ['Ters Orantı Sonucu', inverse ? formatNum(inverse, prec) : null]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'damga',
    grp: 'Mevzuat & İhale',
    name: 'Damga Vergisi & KİK Payı',
    hint: 'Sözleşme (%0,948), Karar (%0,569) Damga Vergisi ve KİK Payı (%0,05) hesabı.',
    in: [{ k: 't', l: 'İhale / Sözleşme Bedeli (KDV Hariç ₺)', ph: '1000000' }],
    calc: (v, prec) => {
      if (!isOk(v.t)) return null
      const t = v.t as Decimal

      const sozlesmeDamga = t.times(D('0.00948'))
      const kararDamga = t.times(D('0.00569'))
      const kikPayi = t.times(D('0.0005'))
      const toplamKesinti = sozlesmeDamga.plus(kararDamga).plus(kikPayi)
      const netOdenecek = t.minus(toplamKesinti)

      return {
        g: [
          {
            t: 'Kamu İhale Yasal Kesinti Detayı',
            s: `${formatNum(t, prec)} ₺ matrah üzerinden`,
            r: [
              ['Sözleşme Damga Vergisi (‰ 9,48)', formatNum(sozlesmeDamga, prec) + ' ₺'],
              ['İhale Karar Damga Vergisi (‰ 5,69)', formatNum(kararDamga, prec) + ' ₺'],
              ['Kamu İhale Kurumu Payı (‱ 5)', formatNum(kikPayi, prec) + ' ₺'],
              ['Toplam Yasal Kesinti', formatNum(toplamKesinti, prec) + ' ₺'],
              ['Kesintiler Sonrası Net Ödenecek Bedel', formatNum(netOdenecek, prec) + ' ₺']
            ]
          }
        ]
      }
    }
  },
  {
    id: 'teminat',
    grp: 'Mevzuat & İhale',
    name: 'Geçici & Kesin Teminat Miktarları',
    hint: 'Kamu ihalelerinde asgari %3 geçici ve %6 kesin teminat mektubu tutarlarını hesaplayın.',
    in: [{ k: 't', l: 'Teklif Bedeli / Sözleşme Bedeli (₺)', ph: '500000' }],
    calc: (v, prec) => {
      if (!isOk(v.t)) return null
      const t = v.t as Decimal

      const gecici = t.times(3).div(100)
      const kesin = t.times(6).div(100)

      return {
        g: [
          {
            t: 'Teminat Mektubu Tutar Analizi',
            s: `${formatNum(t, prec)} ₺ bedel üzerinden`,
            r: [
              ['Asgari Geçici Teminat Miktarı (En az %3)', formatNum(gecici, prec) + ' ₺'],
              ['Kesin Teminat Miktarı (%6)', formatNum(kesin, prec) + ' ₺']
            ]
          }
        ]
      }
    }
  },
  {
    id: 'ekap22d',
    grp: 'Mevzuat & İhale',
    name: 'EKAP 22/d Doğrudan Temin Limit Kontrolü',
    hint: '22/d* (Büyükşehir 1.021.827 TL) ve 22/d** (Diğer 340.391 TL) limit ve tavan takibi.',
    in: [
      {
        k: 'm',
        l: 'İdare Türü',
        sel: ['Büyükşehir İdaresi (22/d*) - 1.021.827 TL', 'Diğer İdareler (22/d**) - 340.391 TL']
      },
      { k: 't', l: 'Alım Bedeli (KDV Hariç ₺)', ph: '250000' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.t)) return null
      const t = v.t as Decimal
      const isBs = (v.m || '').includes('Büyükşehir')
      const limit = isBs ? D('1021827') : D('340391')
      const kalan = limit.minus(t)
      const oran = t.div(limit).times(100)

      return {
        g: [
          {
            t: '22/d Doğrudan Temin Limit Durumu',
            s: `Yasal Limit: ${formatNum(limit, prec)} ₺`,
            r: [
              ['Girilen Alım Bedeli', formatNum(t, prec) + ' ₺'],
              ['Yasal Limit Kullanım Oranı', formatPct(oran, prec)],
              [
                kalan.gte(0) ? 'Limitten Kalan Kullanılabilir Tutar' : 'YASAL LİMİT AŞILDI! (Fark)',
                formatNum(kalan.abs(), prec) + ' ₺'
              ],
              [
                'Mevzuat Uygunluk Durumu',
                kalan.gte(0)
                  ? '✅ 22/d Doğrudan Temin Usulüne Uygun'
                  : '❌ YASAL LİMİT AŞILMIŞTIR! İhale usulü gereklidir.'
              ]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'tevkifat',
    grp: 'Mevzuat & İhale',
    name: 'KDV Tevkifat Hesaplayıcı',
    hint: 'Faturada uygulanacak KDV tevkifat oranına göre alıcı ve satıcı paylarını ayırt edin.',
    in: [
      { k: 't', l: 'Net Matrah (KDV Hariç ₺)', ph: '100000' },
      { k: 'r', l: 'KDV Oranı (%)', ph: '20', chips: [10, 20] },
      {
        k: 'or',
        l: 'Tevkifat Oranı',
        sel: ['2/10', '3/10', '4/10', '5/10', '7/10', '9/10', '10/10 (Tam Tevkifat)']
      }
    ],
    calc: (v, prec) => {
      if (!isOk(v.t, v.r)) return null
      const t = v.t as Decimal
      const r = v.r as Decimal
      const kdv = t.times(r).div(100)

      const parts = (v.or || '5/10').split('/')
      const pay = D(parts[0] || '5')
      const payda = D(parts[1] || '10')

      const tevkifatKdv = kdv.times(pay).div(payda)
      const beyanKdv = kdv.minus(tevkifatKdv)
      const saticiyaOdenecek = t.plus(beyanKdv)

      return {
        g: [
          {
            t: 'Tevkifatlı Fatura Özeti',
            s: `${formatNum(t, prec)} ₺ matrah / %${formatNum(r, prec)} KDV / ${v.or} Tevkifat`,
            r: [
              ['Hesaplanan Toplam KDV', formatNum(kdv, prec) + ' ₺'],
              [
                `Alıcı Tarafından Tevkif Edilecek KDV (${v.or})`,
                formatNum(tevkifatKdv, prec) + ' ₺'
              ],
              ['Satıcıya Ödenecek KDV', formatNum(beyanKdv, prec) + ' ₺'],
              ['Satıcıya Ödenecek Toplam Tutar', formatNum(saticiyaOdenecek, prec) + ' ₺']
            ]
          }
        ]
      }
    }
  },
  {
    id: 'tenzilat',
    grp: 'Mevzuat & İhale',
    name: 'İhale Tenzilat & Katsayı K',
    hint: 'Yaklaşık maliyet ile teklif fiyatı arasındaki indirim (tenzilat) oranını ve Katsayı K değerini bulun.',
    in: [
      { k: 'ym', l: 'Yaklaşık Maliyet (₺)', ph: '1500000' },
      { k: 'tf', l: 'Teklif Bedeli (₺)', ph: '1275000' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.ym, v.tf) || (v.ym as Decimal).isZero()) return null
      const ym = v.ym as Decimal
      const tf = v.tf as Decimal

      const indirimTutar = ym.minus(tf)
      const tenzilatPct = indirimTutar.div(ym).times(100)
      const katsayiK = tf.div(ym)

      return {
        g: [
          {
            t: 'İhale İndirim & K Katsayısı Analizi',
            s: `${formatNum(ym, prec)} ₺ yaklaşık maliyet üzerinden`,
            r: [
              ['Net İndirim Tutarı', formatNum(indirimTutar, prec) + ' ₺'],
              ['Tenzilat / İndirim Oranı', formatPct(tenzilatPct, prec)],
              ['Katsayı K (Teklif / YM)', formatNum(katsayiK, '4')]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'ihale2886',
    grp: 'Mevzuat & İhale',
    name: '2886 Devlet İhale & Ecrimisil',
    hint: '2886 Sayılı Kanun kiralama, satış teminatı ve fuzuli şagil ecrimisil artış hesabı.',
    in: [
      { k: 't', l: 'Muhammen Bedel / Ecrimisil Tutarı (₺)', ph: '200000' },
      { k: 'g', l: 'Gecikme / İşgal Süresi (Ay Sayısı)', ph: '6' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.t)) return null
      const t = v.t as Decimal
      const ay = isOk(v.g) ? (v.g as Decimal) : D(1)

      const gecici2886 = t.times(3).div(100)
      const kesin2886 = t.times(6).div(100)
      const kararDamga = t.times(D('0.00569'))
      const ecrimisilZam = t.times(D('0.025')).times(ay)

      return {
        g: [
          {
            t: '2886 İhale ve Ecrimisil Hesaplama',
            s: `${formatNum(t, prec)} ₺ muhammen bedel`,
            r: [
              ['Geçici Teminat (%3)', formatNum(gecici2886, prec) + ' ₺'],
              ['Kesin Teminat (%6)', formatNum(kesin2886, prec) + ' ₺'],
              ['İhale Karar Damga Vergisi (‰ 5,69)', formatNum(kararDamga, prec) + ' ₺'],
              [
                `${formatNum(ay, '0')} Aylık Tahmini Ecrimisil Fuzuli Şagil Zammı (%2,5/ay)`,
                formatNum(ecrimisilZam, prec) + ' ₺'
              ]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'sayiyazi',
    grp: 'Mevzuat & İhale',
    name: 'Çift Yönlü Sayı ↔ Yazı (Mevzuat)',
    hint: 'Rakamı mevzuat standart yazısına veya okunuşu tekrar rakama dönüştürün.',
    in: [
      { k: 'n', l: 'Rakam ile Tutar (örn. 282.112,00 veya 1500000)', ph: '282.112,00', text: true },
      {
        k: 'txt',
        l: 'veya Metin ile Tutar (örn. İKİYÜZSEKSENİKİBİN YÜZONİKİ TL)',
        ph: 'İKİYÜZSEKSENİKİBİN YÜZONİKİ TL',
        text: true
      }
    ],
    calc: (v) => {
      const res: [string, string | null][] = []
      if (v.n && typeof v.n === 'string' && v.n.trim()) {
        const words = amountToWordsTL(v.n.trim(), {
          paraBirimi: 'TL',
          altBirim: 'KURUŞ',
          harfTipi: 'buyuk'
        })
        res.push(['BÜYÜK HARF (Resmi Evrak Standart)', words])
        const wordsBaslik = amountToWordsTL(v.n.trim(), {
          paraBirimi: 'TL',
          altBirim: 'KURUŞ',
          harfTipi: 'baslik'
        })
        res.push(['Baş Harfler Büyük', wordsBaslik])
        const wordsKucuk = amountToWordsTL(v.n.trim(), {
          paraBirimi: 'TL',
          altBirim: 'KURUŞ',
          harfTipi: 'kucuk'
        })
        res.push(['Küçük Harfler', wordsKucuk])
      }
      if (v.txt && typeof v.txt === 'string' && v.txt.trim()) {
        const parsed = yaziyiSayiyaCevir(v.txt.trim())
        if (parsed !== null) {
          res.push(
            ['Ayrıştırılan Rakam Tutarı', formatTL(parsed)],
            ['Düz Sayısal Değer', String(parsed)]
          )
        }
      }
      return res.length
        ? {
            g: [{ t: 'Sayı ↔ Yazı Dönüştürme Sonuçları', s: '4734 & Muhasebat Standartı', r: res }]
          }
        : null
    }
  },
  {
    id: 'kdv',
    grp: 'Ticaret',
    name: 'KDV Hariç / Dahil Hesaplayıcı',
    hint: 'KDV hariç tutardan dahil tutarı, KDV dahil tutardan matrahı ve KDV tutarını ayırın.',
    in: [
      { k: 'm', l: 'Tutar Türü', sel: ['KDV Hariç', 'KDV Dahil'] },
      { k: 't', l: 'Tutar (₺)', ph: '100000' },
      { k: 'r', l: 'KDV Oranı (%)', ph: '20', chips: [1, 10, 20] }
    ],
    calc: (v, prec) => {
      if (!isOk(v.t, v.r)) return null
      const t = v.t as Decimal
      const r = v.r as Decimal
      const div = H.plus(r)

      if (v.m === 'KDV Dahil') {
        if (div.isZero()) return null
        const net = t.times(100).div(div)
        const kdv = t.minus(net)
        return {
          g: [
            {
              t: 'KDV Dahil Tutardan Ayrıştırma',
              s: `${formatNum(t, prec)} ₺ (%${formatNum(r, prec)} KDV Dahil)`,
              r: [
                ['Net Matrah (KDV Hariç Tutar)', formatNum(net, prec) + ' ₺'],
                ['Hesaplanan KDV Tutarı', formatNum(kdv, prec) + ' ₺'],
                ['Genel Toplam (KDV Dahil)', formatNum(t, prec) + ' ₺']
              ]
            }
          ]
        }
      }

      const kdv = t.times(r).div(100)
      const gross = t.plus(kdv)
      return {
        g: [
          {
            t: 'KDV Hariç Tutara KDV Ekleme',
            s: `${formatNum(t, prec)} ₺ (%${formatNum(r, prec)} KDV Hariç)`,
            r: [
              ['Net Matrah (KDV Hariç)', formatNum(t, prec) + ' ₺'],
              ['Hesaplanan KDV Tutarı', formatNum(kdv, prec) + ' ₺'],
              ['Fatura Genel Toplamı (KDV Dahil)', formatNum(gross, prec) + ' ₺']
            ]
          }
        ]
      }
    }
  },
  {
    id: 'indirim',
    grp: 'Ticaret',
    name: 'İndirim & İskonto Hesaplayıcı',
    hint: 'Etiket fiyatı üzerinden birinci ve isteğe bağlı ikinci iskonto sonrası net fiyatı bulun.',
    in: [
      { k: 'p', l: 'Etiket Fiyatı / Liste Fiyatı', ph: '15000' },
      { k: 'd1', l: '1. İskonto / İndirim (%)', ph: '20' },
      { k: 'd2', l: '2. İskonto (%) [Opsiyonel]', ph: '10' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.p, v.d1)) return null
      const p = v.p as Decimal
      const d1 = v.d1 as Decimal
      const d2 = zero(v.d2 as Decimal | null)

      const afterD1 = p.times(H.minus(d1)).div(100)
      const finalPrice = afterD1.times(H.minus(d2)).div(100)
      const totalSavings = p.minus(finalPrice)
      const effectivePct = p.isZero() ? D(0) : totalSavings.div(p).times(100)

      return {
        g: [
          {
            t: 'İskonto Sonucu',
            s: `${formatNum(p, prec)} ₺ tutar üzerinden`,
            r: [
              ['Net Ödenecek Fiyat', formatNum(finalPrice, prec) + ' ₺'],
              ['Toplam İskonto / Tasarruf Tutarı', formatNum(totalSavings, prec) + ' ₺'],
              ['Efektif Toplam İndirim Oranı', formatPct(effectivePct, prec)]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'komisyon',
    grp: 'Ticaret',
    name: 'Komisyon & Kesinti Hesaplayıcı',
    hint: 'Satış tutarı, komisyon oranı ve sabit kesintiler sonrası net hakedişinizi hesaplayın.',
    in: [
      { k: 's', l: 'Satış Tutarı (₺)', ph: '10000' },
      { k: 'r', l: 'Komisyon Oranı (%)', ph: '12', chips: [5, 10, 15] },
      { k: 'x', l: 'Sabit Kesinti (Kargo/Hizmet ₺)', ph: '50' },
      { k: 'c', l: 'Ürün Maliyeti (₺) [Opsiyonel]', ph: '6000' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.s, v.r)) return null
      const s = v.s as Decimal
      const r = v.r as Decimal
      const x = zero(v.x as Decimal | null)

      const kom = s.times(r).div(100)
      const totalCut = kom.plus(x)
      const net = s.minus(totalCut)

      const res: [string, string | null][] = [
        ['Oransal Komisyon Tutarı', formatNum(kom, prec) + ' ₺'],
        ['Toplam Kesinti (Komisyon + Sabit)', formatNum(totalCut, prec) + ' ₺'],
        ['Hesaba Geçecek Net Tutar', formatNum(net, prec) + ' ₺']
      ]

      if (isOk(v.c)) {
        const c = v.c as Decimal
        res.push(['Net Kâr (Maliyet Düşüldükten Sonra)', formatNum(net.minus(c), prec) + ' ₺'])
      }

      return {
        g: [{ t: 'Komisyon ve Hakediş Analizi', s: `${formatNum(s, prec)} ₺ brüt satış`, r: res }]
      }
    }
  },
  {
    id: 'kar',
    grp: 'Ticaret',
    name: 'Kâr & Kar Marjı Hesaplama',
    hint: 'Maliyet ve satış fiyatından net kârı ve marjı, veya hedef kârdan satış tutarını hesaplayın.',
    in: [
      { k: 'c', l: 'Maliyet Tutarı (₺)', ph: '8000' },
      { k: 's', l: 'Satış Fiyatı (₺)', ph: '10000' },
      { k: 'h', l: 'Hedef Kâr Oranı (%)', ph: '25' }
    ],
    calc: (v, prec) => {
      const r: [string, string | null][] = []
      if (isOk(v.c, v.s)) {
        const c = v.c as Decimal
        const s = v.s as Decimal
        const kar = s.minus(c)
        r.push(['Net Kâr Tutarı', formatNum(kar, prec) + ' ₺'])
        if (!c.isZero()) {
          r.push(['Maliyet Üzerinden Kâr Oranı', formatPct(kar.div(c).times(100), prec)])
        }
        if (!s.isZero()) {
          r.push(['Satış Üzerinden Kâr Marjı', formatPct(kar.div(s).times(100), prec)])
        }
      }
      if (isOk(v.c, v.h)) {
        const c = v.c as Decimal
        const h = v.h as Decimal
        const targetSelling = c.times(H.plus(h)).div(100)
        r.push([
          `%${formatNum(h, prec)} Maliyet Kârı ile Satış Fiyatı`,
          formatNum(targetSelling, prec) + ' ₺'
        ])
        if (h.lt(100)) {
          const targetMarginSelling = c.times(100).div(H.minus(h))
          r.push([
            `%${formatNum(h, prec)} Satış Marjı ile Satış Fiyatı`,
            formatNum(targetMarginSelling, prec) + ' ₺'
          ])
        }
      }
      return r.length ? { g: [{ t: 'Kâr & Marj Analizi', s: 'Girilen değerlere göre', r }] } : null
    }
  },
  {
    id: 'hesap',
    grp: 'Ticaret',
    name: 'Hesap Bölme & Bahşiş',
    hint: 'Hesap tutarı, bahşiş oranı ve kişi sayısına göre kişi başı ödenecek tutarı bulun.',
    in: [
      { k: 't', l: 'Toplam Hesap Tutarı (₺)', ph: '2400' },
      { k: 'r', l: 'Bahşiş Oranı (%)', ph: '10', chips: [5, 10, 15] },
      { k: 'k', l: 'Kişi Sayısı', ph: '4' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.t)) return null
      const t = v.t as Decimal
      const r = zero(v.r as Decimal | null)
      const k = v.k as Decimal | null
      const count = k && k.gt(0) ? k : D(1)

      const bahsis = t.times(r).div(100)
      const total = t.plus(bahsis)
      const perPerson = total.div(count)

      return {
        g: [
          {
            t: 'Hesap Paylaşım Detayı',
            s: `${formatNum(count, '0')} Kişi Arasında`,
            r: [
              ['Hesaplanan Bahşiş Tutarı', formatNum(bahsis, prec) + ' ₺'],
              ['Bahşiş Dahil Toplam', formatNum(total, prec) + ' ₺'],
              ['Kişi Başı Düşen Tutar', formatNum(perPerson, prec) + ' ₺']
            ]
          }
        ]
      }
    }
  },
  {
    id: 'kredi',
    grp: 'Finans',
    name: 'Kredi Taksit Hesaplayıcı',
    hint: 'Aylık faiz oranı ve vade sayısı ile eşit taksitli kredinin aylık ödemesini bulun.',
    in: [
      { k: 't', l: 'Kredi Tutarı (₺)', ph: '100000' },
      { k: 'r', l: 'Aylık Akdi Faiz Oranı (%)', ph: '3.5' },
      { k: 'n', l: 'Vade (Ay Sayısı)', ph: '12' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.t, v.r, v.n) || (v.n as Decimal).lte(0)) return null
      const t = v.t as Decimal
      const r = v.r as Decimal
      const n = v.n as Decimal
      const i = r.div(100)

      const taksit = i.isZero() ? t.div(n) : t.times(i).div(D(1).minus(D(1).plus(i).pow(n.neg())))
      const totalRepay = taksit.times(n)
      const totalInterest = totalRepay.minus(t)

      return {
        g: [
          {
            t: 'Kredi Ödeme Planı Özeti',
            s: `${formatNum(t, prec)} ₺ kredi / ${formatNum(n, '0')} ay vade`,
            r: [
              ['Aylık Eşit Taksit Tutarı', formatNum(taksit, prec) + ' ₺'],
              ['Toplam Geri Ödeme Tutarı', formatNum(totalRepay, prec) + ' ₺'],
              ['Toplam Faiz Yükü', formatNum(totalInterest, prec) + ' ₺']
            ]
          }
        ]
      }
    }
  },
  {
    id: 'mevduat',
    grp: 'Finans',
    name: 'Mevduat Getirisi Hesaplayıcı',
    hint: 'Anapara, yıllık brüt faiz, vade günü ve stopaj oranıyla net mevduat getirisini bulun.',
    in: [
      { k: 'p', l: 'Anapara Tutarı (₺)', ph: '500000' },
      { k: 'r', l: 'Yıllık Brüt Faiz (%)', ph: '45' },
      { k: 'g', l: 'Vade (Gün Sayısı)', ph: '32' },
      { k: 's', l: 'Stopaj Oranı (%)', ph: '17.5' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.p, v.r, v.g)) return null
      const p = v.p as Decimal
      const r = v.r as Decimal
      const g = v.g as Decimal
      const s = zero(v.s as Decimal | null)

      const brut = p.times(r).div(100).times(g).div(365)
      const stopaj = brut.times(s).div(100)
      const net = brut.minus(stopaj)
      const totalEnd = p.plus(net)

      return {
        g: [
          {
            t: 'Mevduat Kazanç Özeti',
            s: `${formatNum(g, '0')} günlük vade sonunda`,
            r: [
              ['Brüt Faiz Getirisi', formatNum(brut, prec) + ' ₺'],
              ['Kesilen Stopaj Vergisi', formatNum(stopaj, prec) + ' ₺'],
              ['Net Faiz Kazancı', formatNum(net, prec) + ' ₺'],
              ['Vade Sonu Ele Geçen Toplam', formatNum(totalEnd, prec) + ' ₺']
            ]
          }
        ]
      }
    }
  },
  {
    id: 'bilesik',
    grp: 'Finans',
    name: 'Bileşik Getiri / Büyüme',
    hint: 'Her dönem belirlenen sabit bir oranla büyüyen değerin dönemler sonundaki değerini hesaplayın.',
    in: [
      { k: 's', l: 'Başlangıç Değeri', ph: '50000' },
      { k: 'r', l: 'Dönemlik Büyüme Oranı (%)', ph: '3' },
      { k: 'n', l: 'Dönem Sayısı (Ay/Yıl)', ph: '12' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.s, v.r, v.n)) return null
      const s = v.s as Decimal
      const r = v.r as Decimal
      const n = v.n as Decimal

      const factor = D(1).plus(r.div(100)).pow(n)
      const finalVal = s.times(factor)
      const pctGain = factor.minus(1).times(100)
      const gainVal = finalVal.minus(s)

      return {
        g: [
          {
            t: 'Bileşik Büyüme Sonucu',
            s: `${formatNum(n, '0')} dönem sonunda`,
            r: [
              ['Ulaşılan Son Değer', formatNum(finalVal, prec)],
              ['Toplam Büyüme Oranı', formatPct(pctGain, prec)],
              ['Net Değer Artışı / Kazanç', formatNum(gainVal, prec)]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'doviz',
    grp: 'Finans',
    name: 'Döviz Dönüştürücü',
    hint: 'Manuel girilen kur üzerinden döviz/TL çevirimi ve kur değişim simülasyonu yapın.',
    in: [
      { k: 't', l: 'İşlem Tutarı', ph: '1000' },
      { k: 'k', l: 'Güncel Kur (1 Döviz = kaç TL)', ph: '34.50' },
      { k: 'e', l: 'Eski Kur [Opsiyonel]', ph: '32.00' }
    ],
    calc: (v, prec) => {
      if (!isOk(v.t, v.k) || (v.k as Decimal).isZero()) return null
      const t = v.t as Decimal
      const k = v.k as Decimal
      const toTL = t.times(k)
      const toDoviz = t.div(k)

      const res: [string, string | null][] = [
        [`${formatNum(t, prec)} Döviz ➔ TL Karşılığı`, formatNum(toTL, prec) + ' ₺'],
        [`${formatNum(t, prec)} TL ➔ Döviz Karşılığı`, formatNum(toDoviz, prec)]
      ]

      if (isOk(v.e) && !(v.e as Decimal).isZero()) {
        const e = v.e as Decimal
        const kurChange = k.minus(e).div(e).times(100)
        res.push(['Kur Değişim Oranı', formatPct(kurChange, prec)])
      }

      return {
        g: [{ t: 'Döviz Dönüşüm Detayı', s: `Döviz Kuru: ${formatNum(k, prec)} ₺`, r: res }]
      }
    }
  },
  {
    id: 'not',
    grp: 'Diğer',
    name: 'Not & Ağırlıklı Ortalama',
    hint: 'Puanı 100 ve 5 üzerinden oranlayın; ağırlıklı ortalama için "80x3, 70x2" yazın.',
    in: [
      { k: 'p', l: 'Alınan Puan', ph: '85' },
      { k: 'tp', l: 'Tam Puan', ph: '100' },
      { k: 'w', l: 'Ağırlıklı Notlar (örn. 80x3, 90x2)', ph: '80x3, 90x2', text: true }
    ],
    calc: (v, prec) => {
      const res: [string, string | null][] = []
      if (isOk(v.p, v.tp) && !(v.tp as Decimal).isZero()) {
        const p = v.p as Decimal
        const tp = v.tp as Decimal
        const pct = p.div(tp).times(100)
        res.push(
          ['Yüzdelik Başarı Oranı', formatPct(pct, prec)],
          ['100 Lik Sistem Notu', formatNum(pct, prec)],
          ['5 Lik Sistem Notu', formatNum(p.div(tp).times(5), prec)]
        )
      }

      if (v.w && typeof v.w === 'string') {
        const items = v.w
          .split(',')
          .map((s) => {
            const parts = s
              .trim()
              .split(/[x*×]/)
              .map((x) => parseDec(x))
            return parts[0] ? [parts[0], parts[1] || D(1)] : null
          })
          .filter((x): x is [Decimal, Decimal] => x !== null)

        const totalWeight = items.reduce((acc, curr) => acc.plus(curr[1]), D(0))
        if (totalWeight.gt(0)) {
          const weightedSum = items.reduce((acc, curr) => acc.plus(curr[0].times(curr[1])), D(0))
          const avg = weightedSum.div(totalWeight)
          res.push(
            ['Hesaplanan Ağırlıklı Ortalama', formatNum(avg, prec)],
            ['Toplam Ders Kredisi / Ağırlık', formatNum(totalWeight, '0')]
          )
        }
      }

      return res.length
        ? { g: [{ t: 'Not ve Ortalama Analizi', s: 'Girilen bilgilere göre', r: res }] }
        : null
    }
  },
  {
    id: 'tarih',
    grp: 'Diğer',
    name: 'Tarih Farkı Hesaplayıcı',
    hint: 'İki tarih arasındaki gün, hafta, ay ve yıl farkını hassas hesaplayın.',
    in: [
      { k: 'd1', l: 'Başlangıç Tarihi', date: true },
      { k: 'd2', l: 'Bitiş Tarihi', date: true }
    ],
    calc: (v, prec) => {
      if (!v.d1 || !v.d2) return null
      let a = new Date(v.d1 + 'T00:00:00')
      let b = new Date(v.d2 + 'T00:00:00')
      if (a > b) [a, b] = [b, a]

      const gun = Math.round((b.getTime() - a.getTime()) / 864e5)
      let y = b.getFullYear() - a.getFullYear()
      let m = b.getMonth() - a.getMonth()
      let d = b.getDate() - a.getDate()
      if (d < 0) {
        m--
        d += new Date(b.getFullYear(), b.getMonth(), 0).getDate()
      }
      if (m < 0) {
        y--
        m += 12
      }
      const yz = D(gun).div(365).times(100)

      return {
        g: [
          {
            t: 'Tarih Farkı Sonuçları',
            s: `${v.d1} — ${v.d2}`,
            r: [
              ['Toplam Gün Farkı', formatNum(D(gun), '0') + ' Gün'],
              [
                'Hafta ve Gün',
                `${formatNum(D(Math.floor(gun / 7)), '0')} Hafta ${formatNum(D(gun % 7), '0')} Gün`
              ],
              ['Takvim Farkı (Yıl / Ay / Gün)', `${y} Yıl ${m} Ay ${d} Gün`],
              ['1 Yıl (365 Gün) İçindeki Oranı', formatPct(yz, prec)]
            ]
          }
        ]
      }
    }
  },
  {
    id: 'birim',
    grp: 'Diğer',
    name: 'Birim & Kesir Dönüştürücü',
    hint: 'Ağırlık, uzunluk, hacim birimleri ile yüzde/ondalık/kesir dönüştürme yapın.',
    in: [
      { k: 'v', l: 'Dönüştürülecek Değer', ph: '25' },
      { k: 'a', l: 'Kaynak Birim', sel: Object.keys(U), def: 1 },
      { k: 'b', l: 'Hedef Birim', sel: Object.keys(U), def: 0 }
    ],
    calc: (v, prec) => {
      if (!isOk(v.v)) return null
      const val = v.v as Decimal
      const A = U[v.a as string]
      const B = U[v.b as string]

      const res: [string, string | null][] = []

      if (A && B && A[0] === B[0]) {
        const converted = val.times(D(A[1])).div(D(B[1]))
        res.push([
          `${formatNum(val, prec)} ${v.a} kaç ${v.b}?`,
          `${formatNum(converted, prec)} ${v.b}`
        ])
      }

      res.push(
        [`%${formatNum(val, prec)} Ondalık Karşılığı`, formatNum(val.div(100), prec)],
        [`${formatNum(val, prec)} Ondalığın Yüzde Karşılığı`, formatPct(val.times(100), prec)]
      )

      if (val.isInteger() && val.gt(0) && val.lt(1e9)) {
        const n = val.toNumber()
        const g = gcd(n, 100)
        res.push([`%${n} Sadeleşmiş Kesir Karşılığı`, `${n / g} / ${100 / g}`])
      }

      return {
        g: [{ t: 'Birim Dönüşüm Sonuçları', s: `${formatNum(val, prec)} değeri için`, r: res }]
      }
    }
  }
]
