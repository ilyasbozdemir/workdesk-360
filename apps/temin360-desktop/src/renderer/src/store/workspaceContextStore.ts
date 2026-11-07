import { create } from 'zustand'

export type ActiveWorkspace = 'procurement' | 'finance'
export type FinanceSection = 'financial-services' | 'accounting'

export type KamuUserRole =
  | 'satin_alma'
  | 'mali_hizmetler'
  | 'muhasebe'
  | 'harcama_yetkilisi'
  | 'admin'

export interface UserRoleDefinition {
  key: KamuUserRole
  name: string
  code: string
  law: string
  color: string
  badgeBg: string
  description: string
}

export const KAMU_USER_ROLES: Record<KamuUserRole, UserRoleDefinition> = {
  satin_alma: {
    key: 'satin_alma',
    name: 'Satın Alma & İhale Yetkilisi',
    code: '4734',
    law: '4734 Sayılı Kamu İhale Kanunu',
    color: '#2563eb',
    badgeBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    description: 'İhtiyaç tespiti, yaklaşık maliyet, teklifler ve satın alma belgeleri.'
  },
  mali_hizmetler: {
    key: 'mali_hizmetler',
    name: 'Mali Hizmetler & Bütçe Mutemedi',
    code: '5018 / BÜTÇE',
    law: '5018 Sayılı Kanun & BKMYBS',
    color: '#059669',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    description: 'Ödenek bloke, KİK %10 limit, vergi ve kesinti hesaplamaları.'
  },
  muhasebe: {
    key: 'muhasebe',
    name: 'Muhasebe Yetkilisi & Vezne',
    code: '5018 / MUHASEBE',
    law: 'Merkezi Yönetim Muhasebe Yönetmeliği',
    color: '#0284c7',
    badgeBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
    description: 'MİF ve ÖEB düzenleme, teminat/emanet mektupları ve yevmiye kayıtları.'
  },
  harcama_yetkilisi: {
    key: 'harcama_yetkilisi',
    name: 'Harcama Yetkilisi & Gerçekleştirme',
    code: '5018 Md. 31/33',
    law: '5018 Sayılı Kanun Md. 31/33',
    color: '#d97706',
    badgeBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    description: 'Mali uygunluk onayı, tahakkuk müzekkeresi ve e-imza onay zinciri.'
  },
  admin: {
    key: 'admin',
    name: 'Sistem Yöneticisi (Tam Yetkili)',
    code: '360° MASTER',
    law: 'Tüm Mevzuat ve Modüller',
    color: '#8b5cf6',
    badgeBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    description: 'Tüm çalışma masaları, modüller ve yetkiler üzerinde tam yönetim.'
  }
}

interface WorkspaceContextState {
  activeWorkspace: ActiveWorkspace
  activeFinanceSection: FinanceSection
  userRoles: KamuUserRole[]
  activeFinanceTab: string

  setActiveWorkspace: (ws: ActiveWorkspace) => void
  setActiveFinanceSection: (sec: FinanceSection) => void
  setUserRoles: (roles: KamuUserRole[]) => void
  setActiveFinanceTab: (tab: string) => void

  hasRole: (role: KamuUserRole) => boolean
  canAccessProcurement: () => boolean
  canAccessFinance: () => boolean
  canAccessFinancialServices: () => boolean
  canAccessAccounting: () => boolean
}

const getStoredWorkspace = (): ActiveWorkspace => {
  const saved = localStorage.getItem('temin_active_workspace')
  if (saved === 'finance' || saved === 'procurement') return saved
  return 'procurement'
}

const getStoredSection = (): FinanceSection => {
  const saved = localStorage.getItem('temin_finance_section')
  if (saved === 'accounting' || saved === 'financial-services') return saved
  return 'financial-services'
}

export const useWorkspaceContextStore = create<WorkspaceContextState>((set, get) => ({
  activeWorkspace: getStoredWorkspace(),
  activeFinanceSection: getStoredSection(),
  // Varsayılan olarak yönetici / tam yetkili rol (kullanıcı switcher üzerinden simüle edebilir)
  userRoles: ['admin', 'satin_alma', 'mali_hizmetler', 'muhasebe', 'harcama_yetkilisi'],
  activeFinanceTab: 'dashboard',

  setActiveWorkspace: (ws) => {
    localStorage.setItem('temin_active_workspace', ws)
    set({ activeWorkspace: ws })
    window.dispatchEvent(new CustomEvent('workspace-switched', { detail: { workspace: ws } }))
  },

  setActiveFinanceSection: (sec) => {
    localStorage.setItem('temin_finance_section', sec)
    set({ activeFinanceSection: sec })
  },

  setUserRoles: (roles) => {
    set({ userRoles: roles })
  },

  setActiveFinanceTab: (tab) => {
    set({ activeFinanceTab: tab })
  },

  hasRole: (role) => {
    const roles = get().userRoles
    return roles.includes('admin') || roles.includes(role)
  },

  canAccessProcurement: () => {
    const roles = get().userRoles
    return roles.includes('admin') || roles.includes('satin_alma') || roles.includes('harcama_yetkilisi')
  },

  canAccessFinance: () => {
    const roles = get().userRoles
    return (
      roles.includes('admin') ||
      roles.includes('mali_hizmetler') ||
      roles.includes('muhasebe') ||
      roles.includes('harcama_yetkilisi')
    )
  },

  canAccessFinancialServices: () => {
    const roles = get().userRoles
    return roles.includes('admin') || roles.includes('mali_hizmetler') || roles.includes('harcama_yetkilisi')
  },

  canAccessAccounting: () => {
    const roles = get().userRoles
    return roles.includes('admin') || roles.includes('muhasebe') || roles.includes('harcama_yetkilisi')
  }
}))

