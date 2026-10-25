import React from 'react'
import { FormFieldV2 } from '../../../types/formBuilder.types'
import { getTextAlignClass, calculateTableTotal } from '../utils'

interface CanvasFieldRendererProps {
  field: FormFieldV2
  formData: Record<string, string>
}

export const CanvasFieldRenderer: React.FC<CanvasFieldRendererProps> = ({ field, formData }) => {
  return (
    <div
      className={`pointer-events-none ${getTextAlignClass(field.textAlign)} ${
        field.fontWeight === 'bold' ? 'font-bold' : ''
      } ${field.fontStyle === 'italic' ? 'italic' : ''}`}
    >
      {field.type === 'header' ? (
        <div className="flex items-center justify-between border-b-2 border-slate-800 pb-2 text-center">
          {field.headerLeftLogo && (
            <div className="w-16 h-14 border border-dashed border-slate-300 rounded flex items-center justify-center text-[8pt] text-slate-400 shrink-0">
              [Sol Logo]
            </div>
          )}
          <div className="font-bold text-center px-4 leading-tight flex-1">
            <div className="text-[11pt]">
              {field.headerInstitution || 'T.C. İÇİŞLERİ BAKANLIĞI'}
            </div>
            <div className="text-[10pt]">
              {field.headerDepartment || 'Destek Hizmetleri Dairesi Başkanlığı'}
            </div>
          </div>
          {field.headerRightLogo && (
            <div className="w-16 h-14 border border-dashed border-slate-300 rounded flex items-center justify-center text-[8pt] text-slate-400 shrink-0">
              [Sağ Logo]
            </div>
          )}
        </div>
      ) : field.type === 'paragraph' ? (
        <div
          className={`text-[9.5pt] leading-relaxed text-slate-800 bg-slate-50/50 p-2 border border-slate-200 rounded ${
            field.indent ? 'indent-6' : ''
          } ${getTextAlignClass(field.textAlign)}`}
        >
          {field.staticContent || 'Resmi gerekçe veya yasal dayanak metni...'}
        </div>
      ) : field.type === 'divider' ? (
        <div className="py-2">
          <hr
            className={`w-full ${
              field.borderStyle === 'dashed'
                ? 'border-dashed'
                : field.borderStyle === 'dotted'
                  ? 'border-dotted'
                  : 'border-solid'
            } border-slate-400`}
          />
        </div>
      ) : field.type === 'page_break' ? (
        <div className="py-2 text-center">
          <div className="border border-dashed border-amber-400 bg-amber-50/70 text-amber-800 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2">
            <span>✂️ ---------------- SAYFA SONU KESMESİ (Page Break) ---------------- ✂️</span>
          </div>
        </div>
      ) : field.type === 'grid' ? (
        <div className="p-2.5 border border-dashed border-blue-300 rounded-lg bg-blue-50/20">
          <div className="text-[10px] font-bold text-blue-600 uppercase mb-1.5">
            Grid Kolon Taşıyıcı ({field.gridCols || 2} Sütun)
          </div>
          <div className={`grid grid-cols-${field.gridCols || 2} gap-2`}>
            {Array.from({ length: field.gridCols || 2 }).map((_, i) => (
              <div
                key={i}
                className="p-2 border border-slate-200 bg-white rounded text-center text-slate-400 text-[10px] font-mono"
              >
                Kolon {i + 1}
              </div>
            ))}
          </div>
        </div>
      ) : field.type === 'select' ? (
        <div className="space-y-1">
          <label className="block text-[9pt] font-bold text-slate-700">{field.label}:</label>
          <div className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded text-xs text-slate-800 flex justify-between items-center">
            <span className="font-medium">
              {formData[field.variableName] ||
                field.defaultValue ||
                field.placeholder ||
                (field.options?.[0] ? `Seçili: ${field.options[0]}` : 'Seçim Yapınız')}
            </span>
            <span className="text-slate-400 text-[9px]">▼</span>
          </div>
        </div>
      ) : field.type === 'radio' ? (
        <div className="space-y-1.5">
          <label className="block text-[9pt] font-bold text-slate-700">{field.label}:</label>
          <div className="flex flex-wrap gap-3">
            {field.options && field.options.length > 0 ? (
              field.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-800">
                  <span
                    className={`w-3 h-3 rounded-full border flex items-center justify-center ${
                      i === 0 ? 'border-blue-600 bg-blue-600' : 'border-slate-300 bg-white'
                    }`}
                  >
                    {i === 0 && <span className="w-1 h-1 rounded-full bg-white" />}
                  </span>
                  <span>{opt}</span>
                </div>
              ))
            ) : (
              <span className="text-slate-400 italic text-xs">Seçenek tanımlanmadı</span>
            )}
          </div>
        </div>
      ) : field.type === 'checkbox' ? (
        <div className="space-y-1.5">
          <label className="block text-[9pt] font-bold text-slate-700">{field.label}:</label>
          <div className="flex flex-wrap gap-3">
            {field.options && field.options.length > 0 ? (
              field.options.map((opt, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs text-slate-800">
                  <span className="w-3.5 h-3.5 rounded border border-blue-600 bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">
                    ✓
                  </span>
                  <span>{opt}</span>
                </div>
              ))
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-800">
                <span className="w-3.5 h-3.5 rounded border border-blue-600 bg-blue-600 text-white flex items-center justify-center text-[8px] font-bold">
                  ✓
                </span>
                <span>{field.placeholder || field.label}</span>
              </div>
            )}
          </div>
        </div>
      ) : field.type === 'textarea' ? (
        <div className="space-y-1">
          <label className="block text-[9pt] font-bold text-slate-700">{field.label}:</label>
          <div className="text-[9.5pt] leading-relaxed text-slate-800 bg-slate-50/70 p-2.5 border border-slate-200 rounded min-h-12 whitespace-pre-wrap">
            {formData[field.variableName] ||
              field.defaultValue ||
              field.placeholder ||
              `[${field.label} açıklaması buraya gelecek...]`}
          </div>
        </div>
      ) : field.type === 'table' ? (
        <div className="border border-slate-800 text-[8.5pt]">
          <div className="grid grid-cols-7 bg-slate-100 font-bold border-b border-slate-800 text-center py-1">
            <div>Sıra</div>
            <div className="col-span-3 text-left px-2">Mal/Hizmet Adı</div>
            <div>Miktar</div>
            <div>Birim</div>
            <div>Birim Fiyat</div>
          </div>
          {field.tableRows && field.tableRows.length > 0 ? (
            field.tableRows.map((row) => (
              <div
                key={row.id}
                className="grid grid-cols-7 text-center py-1 border-b border-slate-200"
              >
                <div>{row.sira}</div>
                <div className="col-span-3 text-left px-2 font-medium">{row.ad}</div>
                <div>{row.miktar}</div>
                <div>{row.birim}</div>
                <div className="text-right px-2 font-mono">
                  {Number(row.birimFiyat).toLocaleString('tr-TR', {
                    minimumFractionDigits: 2
                  })}{' '}
                  ₺
                </div>
              </div>
            ))
          ) : (
            <div className="p-2 text-center text-slate-400 italic text-[8pt]">
              Henüz satır eklenmedi. Sağ panelden satır ekleyin.
            </div>
          )}
          <div className="bg-slate-50 text-right font-bold py-1 px-3 border-t border-slate-800 flex justify-between">
            <span>Toplam Kalem Sayısı: {field.tableRows?.length || 0}</span>
            <span>
              Toplam Tutar:{' '}
              {calculateTableTotal(field.tableRows).toLocaleString('tr-TR', {
                minimumFractionDigits: 2
              })}{' '}
              ₺
            </span>
          </div>
        </div>
      ) : field.type === 'signature' ? (
        <div className="pt-2">
          {field.signatureType === 'olur' ? (
            <div className="w-48 ml-auto text-center space-y-1 p-2 border border-dashed border-slate-300 rounded">
              <div className="font-bold text-slate-800 text-[9pt]">O L U R</div>
              <div className="text-[8pt] text-slate-500">24.09.2026</div>
              <div className="font-bold text-slate-900 pt-2">
                {field.signatureMembers?.[0]?.adSoyad || 'Mustafa ÖZTÜRK'}
              </div>
              <div className="text-slate-600 text-[8pt]">
                {field.signatureMembers?.[0]?.unvan || 'Daire Başkanı'}
              </div>
              <div className="text-slate-400 text-[8pt] italic">[ İmza / Mühür ]</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-center pt-2 text-[9pt]">
              {field.signatureMembers && field.signatureMembers.length > 0 ? (
                field.signatureMembers.map((member) => (
                  <div
                    key={member.id}
                    className="space-y-0.5 p-2 bg-slate-50/50 border border-slate-200 rounded"
                  >
                    <div className="font-bold text-slate-900">{member.adSoyad}</div>
                    <div className="text-slate-600 text-[8pt]">{member.unvan}</div>
                    <div className="text-slate-400 text-[7.5pt] uppercase font-semibold">
                      {member.gorev}
                    </div>
                    <div className="text-slate-300 text-[7.5pt] italic pt-1">[ İmza ]</div>
                  </div>
                ))
              ) : (
                <div className="col-span-3 text-center text-slate-400 italic text-[8pt]">
                  İmza üyesi eklenmedi. Sağ panelden üye ekleyin.
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div
          className={`flex items-center gap-2 text-[9.5pt] bg-slate-50 p-2 border border-slate-200 rounded ${getTextAlignClass(
            field.textAlign
          )}`}
        >
          <span className="font-bold text-slate-700">{field.label}:</span>
          <span className="text-slate-900 font-medium text-[9pt]">
            {formData[field.variableName] ||
              field.defaultValue ||
              field.placeholder ||
              `[${field.variableName} verisi]`}
          </span>
        </div>
      )}
    </div>
  )
}
