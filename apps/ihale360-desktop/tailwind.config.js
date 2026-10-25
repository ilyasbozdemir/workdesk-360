/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/renderer/index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        short: { raw: '(max-height: 720px)' },
        xshort: { raw: '(max-height: 540px)' }
      },
      colors: {
        'primary-100': 'var(--primary-100)',
        'primary-200': 'var(--primary-200)',
        'primary-300': 'var(--primary-300)',
        'accent-100': 'var(--accent-100)',
        'accent-200': 'var(--accent-200)',
        'text-100': 'var(--text-100)',
        'text-200': 'var(--text-200)',
        'bg-100': 'var(--bg-100)',
        'bg-200': 'var(--bg-200)',
        'bg-300': 'var(--bg-300)',
        'sidebar-bg': 'var(--sidebar-bg)',
        'sidebar-text': 'var(--sidebar-text)',
        'sidebar-border': 'var(--sidebar-border)',
        'sidebar-hover-bg': 'var(--sidebar-hover-bg)',
        'sidebar-hover-text': 'var(--sidebar-hover-text)',
        'sidebar-active-bg': 'var(--sidebar-active-bg)',
        'sidebar-active-text': 'var(--sidebar-active-text)',
        'sidebar-active-border': 'var(--sidebar-active-border)'
      }
    }
  },
  plugins: []
}
