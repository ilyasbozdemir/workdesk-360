import React from 'react'

export class TemplateErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Template rendering error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div style={{ padding: '2rem', textAlign: 'center', color: '#b45309', backgroundColor: '#fef3c7', borderRadius: '0.75rem', border: '1px solid #fde68a', margin: '1rem' }}>
            ⚠️ Belge şablonu çizilirken bir hata oluştu. Değişkenleri kontrol edip tekrar deneyiniz.
          </div>
        )
      )
    }
    return this.props.children
  }
}
