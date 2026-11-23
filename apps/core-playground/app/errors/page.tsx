'use client'

import React, { useState } from 'react'
import { ActionCard } from '@/components/playground/ActionCard'
import { ResultDisplay } from '@/components/test-results/ResultDisplay'
import { useTargetApp } from '@/components/layout/AppContext'
import { testErrorAction } from '@/app/actions'
import { AlertTriangle, ShieldAlert, FileX, CopySlash, Flame } from 'lucide-react'

export default function ErrorsPlaygroundPage() {
  const { profile } = useTargetApp()
  const [lastResult, setLastResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const triggerError = async (
    errorType: 'AppError' | 'ValidationError' | 'NotFoundError' | 'ConflictError',
    payload?: any
  ) => {
    setLoading(true)
    try {
      const res = await testErrorAction(errorType, payload)
      setLastResult(res)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Hata & Exception Yönetimi (RFC 7807)
          </h2>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Çekirdek domain hatalarını (AppError, ValidationError, NotFoundError, ConflictError) tetikleyin ve yapılandırılmış hata çıktılarını gözlemleyin.
        </p>
      </div>

      {/* Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ValidationError */}
        <ActionCard
          title="ValidationError — Doğrulama Hatası"
          description="Kullanıcı veya form verisi iş kurallarına ya da mevzuata uymadığında fırlatılır."
        >
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-[11px] text-rose-800 dark:text-rose-300 font-mono">
              new ValidationError(&apos;Komisyon üyesi seçim kuralı ihlal edildi&apos;, &#123; rol: &apos;Harcama Yetkilisi kabul üyesi olamaz&apos; &#125;)
            </div>
            <button
              onClick={() =>
                triggerError('ValidationError', {
                  message: 'Doğrudan Temin Tebliği (40666) gereği Harcama Yetkilisi muayene komisyonu üyesi olamaz',
                  details: {
                    mevzuatNo: '40666',
                    personel: 'John Doe',
                    yasakliGorev: 'Harcama Yetkilisi'
                  }
                })
              }
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>ValidationError Tetikle</span>
            </button>
          </div>
        </ActionCard>

        {/* NotFoundError */}
        <ActionCard
          title="NotFoundError — Kayıt Bulunamadı"
          description="İstenen bir kaynak veya dosya kimliği bulunamadığında standart mesaj üretir."
        >
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
              new NotFoundError(&apos;DATA_TeminDosyasi&apos;, &apos;DOSYA-2026-999&apos;)
            </div>
            <button
              onClick={() =>
                triggerError('NotFoundError', {
                  resource: 'DATA_TeminDosyasi',
                  identifier: 'DOSYA-2026-999'
                })
              }
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <FileX className="w-3.5 h-3.5" />
              <span>NotFoundError Tetikle</span>
            </button>
          </div>
        </ActionCard>

        {/* ConflictError */}
        <ActionCard
          title="ConflictError — Veri Çakışması"
          description="Benzersiz olması gereken bir alan veya dosya numarası mükerrer olduğunda kullanılır."
        >
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
              new ConflictError(&apos;Bu temin numarası ile kayıtlı bir dosya zaten var&apos;, &#123; teminNo: &apos;2026/1&apos; &#125;)
            </div>
            <button
              onClick={() =>
                triggerError('ConflictError', {
                  message: 'Bu dosya numarası bu bütçe yılında zaten kullanılmıştır',
                  details: { butceYili: 2026, teminNo: '2026/1' }
                })
              }
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <CopySlash className="w-3.5 h-3.5" />
              <span>ConflictError Tetikle</span>
            </button>
          </div>
        </ActionCard>

        {/* AppError */}
        <ActionCard
          title="AppError — Temel Çekirdek Hatası"
          description="Hiyerarşinin en tepesindeki genel hata sınıfı (özelleştirilmiş hata kodu ile)."
        >
          <div className="space-y-3">
            <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-700 dark:text-slate-300 font-mono">
              new AppError(&apos;Beklenmeyen dosya yazma engeli&apos;, &apos;DISK_WRITE_LOCKED&apos;)
            </div>
            <button
              onClick={() =>
                triggerError('AppError', {
                  message: 'Çalışma alanı diske kilitlendi: SQLite dosya kilidi aktif',
                  code: 'WORKSPACE_LOCKED'
                })
              }
              disabled={loading}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>AppError Tetikle</span>
            </button>
          </div>
        </ActionCard>
      </div>

      {/* Sonuç Ekranı */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
          Hata Yakalama & İnceleme Konsolu
        </h3>
        <ResultDisplay result={lastResult} />
      </div>
    </div>
  )
}
