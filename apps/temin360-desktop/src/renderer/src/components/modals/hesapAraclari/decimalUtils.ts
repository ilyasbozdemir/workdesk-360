import Decimal from 'decimal.js'

// İzole edilmiş Decimal yapılandırması (global Decimal constructor'ını kirletmez)
export const ToolDecimal = Decimal.clone({ precision: 50, toExpNeg: -40, toExpPos: 40 })

export const D = (x: Decimal.Value): Decimal => new ToolDecimal(x)
export const H = D(100)

export const parseDec = (s: unknown): Decimal | null => {
  if (s === null || s === undefined || s === '') return null
  try {
    const x = D(String(s).trim().replace(',', '.'))
    return x.isFinite() ? x : null
  } catch {
    return null
  }
}

export const isOk = (...args: unknown[]): boolean => args.every((x) => x instanceof Decimal)
export const zero = (x: Decimal | null): Decimal => x || D(0)

export const formatNum = (n: unknown, precision: string = 'auto'): string => {
  if (n === null || n === undefined) return ''
  try {
    const x = n instanceof Decimal ? n : D(String(n))
    let s = precision === 'auto' ? x.toDP(4).toFixed() : x.toFixed(+precision)
    if (/^-0(\.0+)?$/.test(s)) s = s.slice(1)
    const neg = s[0] === '-'
    if (neg) s = s.slice(1)
    const [i, fr] = s.split('.')
    const formattedInt = i.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
    return (neg ? '-' : '') + formattedInt + (fr ? ',' + fr : '')
  } catch {
    return String(n)
  }
}

export const formatPct = (n: unknown, precision: string = 'auto'): string =>
  '%' + formatNum(n, precision)

export const parseDecList = (s: string): Decimal[] => {
  if (!s) return []
  return s
    .split(/[;\s]+/)
    .map((x) => parseDec(x))
    .filter((x): x is Decimal => x !== null)
}

export const sumDec = (arr: Decimal[]): Decimal => {
  return arr.reduce((acc, curr) => acc.plus(curr), D(0))
}

export const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)

export const U: Record<string, [string, string]> = {
  ton: ['k', '1000'],
  kg: ['k', '1'],
  g: ['k', '0.001'],
  mg: ['k', '0.000001'],
  lb: ['k', '0.45359237'],
  oz: ['k', '0.028349523125'],
  km: ['u', '1000'],
  m: ['u', '1'],
  cm: ['u', '0.01'],
  mm: ['u', '0.001'],
  mil: ['u', '1609.344'],
  inç: ['u', '0.0254'],
  ft: ['u', '0.3048'],
  litre: ['h', '1'],
  ml: ['h', '0.001'],
  'm³': ['h', '1000'],
  galon: ['h', '3.785411784']
}
