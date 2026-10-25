import React from 'react'
import { Sparkles } from 'lucide-react'
import { useDocumentTheme } from './useDocumentTheme'

type PreviewProps = ReturnType<typeof useDocumentTheme>

export function DocumentThemePreview(props: PreviewProps): React.JSX.Element {
  const { theme } = props

  return (
    <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden sticky top-6">
      <div className="p-3.5 bg-slate-50 dark:bg-slate-950/80 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>Canlı Şablon Görünüm Önizlemesi</span>
        </span>
        <span className="text-[10px] font-mono font-extrabold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          {theme.page.format}
        </span>
      </div>

      <div className="p-5 bg-slate-100 dark:bg-slate-950 flex justify-center items-center">
        {/* Simulated Miniature A4 Page */}
        <div
          className="w-full bg-white shadow-lg rounded-sm transition-all overflow-hidden"
          style={{
            fontFamily: theme.typography.fontFamily,
            color: theme.colors.text,
            padding: `${theme.page.margins.top * 6}px ${theme.page.margins.right * 6}px ${theme.page.margins.bottom * 6}px ${theme.page.margins.left * 6}px`,
            border: `1px solid ${theme.colors.border}`,
            minHeight: '420px',
            fontSize: theme.typography.baseFontSize,
            lineHeight: theme.typography.lineHeight
          }}
        >
          {/* Header Box */}
          <div
            className="text-center pb-2 border-b mb-3"
            style={{
              borderBottomColor: theme.colors.accentLine,
              borderBottomWidth: '2px',
              backgroundColor: theme.colors.headerBg
            }}
          >
            <div className="font-extrabold text-[10px] uppercase tracking-wider">
              T.C. ANKARA VALİLİĞİ
            </div>
            <div className="font-bold text-[9px] text-slate-600">
              İl Sağlık Müdürlüğü • Destek Hizmetleri Başkanlığı
            </div>
          </div>

          {/* Title */}
          <div
            className="text-center font-extrabold text-[11px] uppercase my-2 tracking-wide"
            style={{ color: theme.colors.text }}
          >
            İHTİYAÇ TALEP LİSTESİ & ONAY BELGESİ
          </div>

          {/* Sample Table */}
          <table
            className="w-full my-2"
            style={{
              borderCollapse: theme.table.borderCollapse as any,
              fontSize: theme.table.fontSize,
              borderColor: theme.table.borderColor
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: theme.table.headerBgColor,
                  border: `${theme.table.borderWidth} solid ${theme.table.borderColor}`
                }}
              >
                <th
                  className="p-1 text-center font-bold border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  S.No
                </th>
                <th
                  className="p-1 text-left font-bold border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  Mal / Malzeme Adı
                </th>
                <th
                  className="p-1 text-center font-bold border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  Miktar
                </th>
                <th
                  className="p-1 text-center font-bold border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  Birim
                </th>
              </tr>
            </thead>
            <tbody>
              <tr
                style={{
                  border: `${theme.table.borderWidth} solid ${theme.table.borderColor}`
                }}
              >
                <td
                  className="p-1 text-center border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  1
                </td>
                <td className="p-1 border" style={{ borderColor: theme.table.borderColor }}>
                  A4 Fotokopi Kağıdı (80 gr)
                </td>
                <td
                  className="p-1 text-center border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  50
                </td>
                <td
                  className="p-1 text-center border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  Paket
                </td>
              </tr>
              <tr
                style={{
                  border: `${theme.table.borderWidth} solid ${theme.table.borderColor}`
                }}
              >
                <td
                  className="p-1 text-center border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  2
                </td>
                <td className="p-1 border" style={{ borderColor: theme.table.borderColor }}>
                  Mavi Tükenmez Kalem (0.7 mm)
                </td>
                <td
                  className="p-1 text-center border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  100
                </td>
                <td
                  className="p-1 text-center border"
                  style={{ borderColor: theme.table.borderColor }}
                >
                  Adet
                </td>
              </tr>
            </tbody>
          </table>

          {/* Sample Paragraph */}
          <p
            className="text-[9px] text-justify my-2 leading-relaxed"
            style={{ color: theme.colors.textLight }}
          >
            Yukarıda cins ve miktarları belirtilen malzemelerin 4734 sayılı Kamu İhale Kanununun
            22/d maddesi kapsamında temini hususunu olurlarınıza arz ederim.
          </p>

          {/* Signature Block */}
          <div className="flex justify-between items-center mt-6 pt-2 text-center text-[9px]">
            <div>
              <div className="font-bold">Talep Eden</div>
              <div className="text-slate-500">Ahmet YILMAZ</div>
              <div className="text-[8px] text-slate-400">Şube Müdürü</div>
            </div>

            <div>
              <div className="font-bold">UYGUNDUR</div>
              <div className="text-slate-500">Mehmet DEMİR</div>
              <div className="text-[8px] text-slate-400">Harcama Yetkilisi</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
