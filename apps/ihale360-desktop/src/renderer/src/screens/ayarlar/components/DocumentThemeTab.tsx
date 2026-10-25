import React from 'react'
import { useDocumentTheme } from './document-theme/useDocumentTheme'
import { DocumentThemeHeader } from './document-theme/DocumentThemeHeader'
import { DocumentThemeSections } from './document-theme/DocumentThemeSections'
import { DocumentThemePreview } from './document-theme/DocumentThemePreview'
import { DocumentThemeJsonModal } from './document-theme/DocumentThemeJsonModal'

export function DocumentThemeTab(): React.JSX.Element {
  const docTheme = useDocumentTheme()

  return (
    <div className="space-y-6">
      <DocumentThemeHeader {...docTheme} />

      {/* Main Grid: Controls (Left 7 Cols) & Live Preview (Right 5 Cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <DocumentThemeSections {...docTheme} />
        <DocumentThemePreview {...docTheme} />
      </div>

      <DocumentThemeJsonModal {...docTheme} />
    </div>
  )
}
