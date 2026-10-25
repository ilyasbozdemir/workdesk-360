export interface ThemePreset {
  name: string
  color: string
  light: string
  dark: string
}

export const THEME_PRESETS: Record<string, ThemePreset> = {
  varsayilan: {
    name: 'Varsayılan (Siyah/Beyaz)',
    color: 'bg-zinc-800',
    light: '',
    dark: ''
  },
  turkuaz: {
    name: 'Turkuaz',
    color: 'bg-cyan-500',
    light: `--primary-100: #4dd0e1;\n--primary-200: #00bcd4;\n--primary-300: #006064;\n--accent-100: #00acc1;\n--accent-200: #00838f;\n--text-100: #001f20;\n--text-200: #004d40;\n--bg-100: #ffffff;\n--bg-200: #e0f7fa;\n--bg-300: #b2ebf2;\n--sidebar-bg: #0e292c;\n--sidebar-text: #b2ebf2;\n--sidebar-border: #153e42;\n--sidebar-hover-bg: #153e42;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(0, 229, 255, 0.15);\n--sidebar-active-text: #00e5ff;\n--sidebar-active-border: rgba(0, 229, 255, 0.25);`,
    dark: `--primary-100: #143d41;\n--primary-200: #225f66;\n--primary-300: #e0f7fa;\n--accent-100: #00e5ff;\n--accent-200: #00acc1;\n--text-100: #f0fbfb;\n--text-200: #80deea;\n--bg-100: #020a0b;\n--bg-200: #0a1c1e;\n--bg-300: #020a0b;\n--sidebar-bg: #020a0b;\n--sidebar-text: #90a4ae;\n--sidebar-border: #143d41;\n--sidebar-hover-bg: #143d41;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(0, 229, 255, 0.12);\n--sidebar-active-text: #00e5ff;\n--sidebar-active-border: rgba(0, 229, 255, 0.2);`
  },
  kirmizi: {
    name: 'Zarif Kırmızı',
    color: 'bg-red-600',
    light: `--primary-100: #ef9a9a;\n--primary-200: #e57373;\n--primary-300: #b71c1c;\n--accent-100: #f44336;\n--accent-200: #d32f2f;\n--text-100: #1a0000;\n--text-200: #5d4037;\n--bg-100: #ffffff;\n--bg-200: #ffebee;\n--bg-300: #ffcdd2;\n--sidebar-bg: #2a0c0c;\n--sidebar-text: #ffdad6;\n--sidebar-border: #421515;\n--sidebar-hover-bg: #421515;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(255, 137, 122, 0.15);\n--sidebar-active-text: #ff897a;\n--sidebar-active-border: rgba(255, 137, 122, 0.25);`,
    dark: `--primary-100: #451e1e;\n--primary-200: #662c2c;\n--primary-300: #ffdad6;\n--accent-100: #ff897a;\n--accent-200: #ba1a1a;\n--text-100: #fff5f5;\n--text-200: #c9a0a0;\n--bg-100: #0a0404;\n--bg-200: #1c0d0d;\n--bg-300: #0a0404;\n--sidebar-bg: #0a0404;\n--sidebar-text: #b09a99;\n--sidebar-border: #451e1e;\n--sidebar-hover-bg: #451e1e;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(255, 137, 122, 0.12);\n--sidebar-active-text: #ff897a;\n--sidebar-active-border: rgba(255, 137, 122, 0.2);`
  },
  yesil: {
    name: 'Zümrüt Yeşil',
    color: 'bg-emerald-600',
    light: `--primary-100: #a5d6a7;\n--primary-200: #81c784;\n--primary-300: #1b5e20;\n--accent-100: #4caf50;\n--accent-200: #2e7d32;\n--text-100: #001b00;\n--text-200: #33691e;\n--bg-100: #ffffff;\n--bg-200: #e8f5e9;\n--bg-300: #c8e6c9;\n--sidebar-bg: #0a2111;\n--sidebar-text: #c7ebd1;\n--sidebar-border: #13381e;\n--sidebar-hover-bg: #13381e;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(129, 201, 149, 0.15);\n--sidebar-active-text: #81c995;\n--sidebar-active-border: rgba(129, 201, 149, 0.25);`,
    dark: `--primary-100: #1c4a25;\n--primary-200: #2d7a3d;\n--primary-300: #e8f5e9;\n--accent-100: #66bb6a;\n--accent-200: #81c995;\n--text-100: #f1fbf3;\n--text-200: #a5d6a7;\n--bg-100: #030c05;\n--bg-200: #0b2110;\n--bg-300: #030c05;\n--sidebar-bg: #030c05;\n--sidebar-text: #9db0a2;\n--sidebar-border: #1c4a25;\n--sidebar-hover-bg: #1c4a25;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(129, 201, 149, 0.12);\n--sidebar-active-text: #81c995;\n--sidebar-active-border: rgba(129, 201, 149, 0.2);`
  },
  turuncu: {
    name: 'Canlı Turuncu',
    color: 'bg-orange-500',
    light: `--primary-100: #ffcc80;\n--primary-200: #ffb74d;\n--primary-300: #e65100;\n--accent-100: #ff9800;\n--accent-200: #f57c00;\n--text-100: #270e00;\n--text-200: #5d4037;\n--bg-100: #ffffff;\n--bg-200: #fff3e0;\n--bg-300: #ffe0b2;\n--sidebar-bg: #281404;\n--sidebar-text: #ffe3d1;\n--sidebar-border: #3e1f06;\n--sidebar-hover-bg: #3e1f06;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(255, 152, 0, 0.15);\n--sidebar-active-text: #ff9800;\n--sidebar-active-border: rgba(255, 152, 0, 0.25);`,
    dark: `--primary-100: #462912;\n--primary-200: #6a3f1b;\n--primary-300: #ffe0b2;\n--accent-100: #f57c00;\n--accent-200: #ff9800;\n--text-100: #fff8f2;\n--text-200: #ffcc80;\n--bg-100: #0c0702;\n--bg-200: #211308;\n--bg-300: #0c0702;\n--sidebar-bg: #0c0702;\n--sidebar-text: #b3a092;\n--sidebar-border: #462912;\n--sidebar-hover-bg: #462912;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(255, 152, 0, 0.12);\n--sidebar-active-text: #ff9800;\n--sidebar-active-border: rgba(255, 152, 0, 0.2);`
  },
  mor: {
    name: 'Görkemli Mor',
    color: 'bg-purple-600',
    light: `--primary-100: #ce93d8;\n--primary-200: #ba68c8;\n--primary-300: #4a148c;\n--accent-100: #9c27b0;\n--accent-200: #7b1fa2;\n--text-100: #1f0033;\n--text-200: #311b92;\n--bg-100: #ffffff;\n--bg-200: #f3e5f5;\n--bg-300: #e1bee7;\n--sidebar-bg: #1f0c2d;\n--sidebar-text: #eed6f7;\n--sidebar-border: #321447;\n--sidebar-hover-bg: #321447;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(216, 180, 254, 0.15);\n--sidebar-active-text: #d8b4fe;\n--sidebar-active-border: rgba(216, 180, 254, 0.25);`,
    dark: `--primary-100: #381959;\n--primary-200: #562887;\n--primary-300: #f3e5f5;\n--accent-100: #ab47bc;\n--accent-200: #d8b4fe;\n--text-100: #fbf2ff;\n--text-200: #ce93d8;\n--bg-100: #07020d;\n--bg-200: #180b26;\n--bg-300: #07020d;\n--sidebar-bg: #07020d;\n--sidebar-text: #ab9db3;\n--sidebar-border: #381959;\n--sidebar-hover-bg: #381959;\n--sidebar-hover-text: #ffffff;\n--sidebar-active-bg: rgba(216, 180, 254, 0.12);\n--sidebar-active-text: #d8b4fe;\n--sidebar-active-border: rgba(216, 180, 254, 0.2);`
  }
}
