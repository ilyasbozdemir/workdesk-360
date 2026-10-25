export interface CalculationInput {
  k: string
  l: string
  ph?: string
  chips?: number[]
  sel?: string[]
  def?: number
  text?: boolean
  date?: boolean
}

export interface CalculationGroup {
  t: string
  s: string
  r: [string, string | null][]
}

export interface CalculationResult {
  g: CalculationGroup[]
}

export interface ToolGroup {
  id: string
  grp: string
  name: string
  hint: string
  in: CalculationInput[]
  calc: (v: Record<string, any>, precision: string) => CalculationResult | null
}

export interface HesapAraclariViewProps {
  onOpenSayiYaziModal?: () => void
  onClose?: () => void
}

export interface HesapAraclariModalProps {
  isOpen: boolean
  onClose: () => void
  onOpenSayiYaziModal?: () => void
}
