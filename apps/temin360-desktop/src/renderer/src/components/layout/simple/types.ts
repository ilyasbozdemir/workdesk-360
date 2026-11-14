export interface SimpleFile {
  id: string
  name: string
  type: string
  date: string
  status: string
  amount: number
  unit: string
}

export interface ItemRecord {
  name: string
  qty: number
  unit: string
  price: number
}

export interface OfferRecord {
  company: string
  price: number
  valid: string
}

export type SimpleViewMode = 'simple-dashboard' | 'tab-view'
