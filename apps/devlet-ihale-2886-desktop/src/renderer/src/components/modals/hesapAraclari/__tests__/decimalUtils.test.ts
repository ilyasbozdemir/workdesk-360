import { describe, it, expect } from 'vitest'
import { parseDec, formatNum, formatPct, gcd, sumDec, parseDecList, D } from '../decimalUtils'
import { TOOLS } from '../toolsData'

describe('decimalUtils & hesapAraclari', () => {
  it('parseDec correctly parses valid decimal strings and returns null on invalid', () => {
    expect(parseDec('123.45')?.toNumber()).toBe(123.45)
    expect(parseDec('123,45')?.toNumber()).toBe(123.45)
    expect(parseDec('')).toBeNull()
    expect(parseDec('abc')).toBeNull()
  })

  it('formatNum formats decimal values with thousand separators', () => {
    const val = D('1234567.89')
    expect(formatNum(val, '2')).toBe('1.234.567,89')
    expect(formatPct(D('18'), '0')).toBe('%18')
  })

  it('gcd, sumDec, parseDecList work as expected', () => {
    expect(gcd(12, 18)).toBe(6)
    const list = parseDecList('10 20 30')
    expect(list.length).toBe(3)
    expect(sumDec(list).toNumber()).toBe(60)
  })

  it('TOOLS array has loaded calculation tools and calculates temel yuzde correctly', () => {
    expect(TOOLS.length).toBeGreaterThan(10)
    const temel = TOOLS.find((t) => t.id === 'temel')
    expect(temel).toBeDefined()
    const result = temel?.calc({ a: D(1000), b: D(200) }, '2')
    expect(result).not.toBeNull()
    expect(result?.g.length).toBeGreaterThan(0)
    // 200 / 1000 is 20%
    const rows = result?.g[0].r || []
    const ratioRow = rows.find(([lbl]) => lbl.includes('yüzde kaç?'))
    expect(ratioRow?.[1]).toBe('%20,00')
  })
})
