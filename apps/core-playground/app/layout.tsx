import type { Metadata } from 'next'
import './globals.css'
import { AppProvider } from '@/components/layout/AppContext'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'

export const metadata: Metadata = {
  title: 'WorkDesk 360 — Core Playground',
  description: 'packages/core paketini test etmek, geliştirmek ve görsel olarak gözlemlemek için test uygulaması'
}

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="tr" className="h-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
      <body className="min-h-full flex flex-col font-sans">
        <AppProvider>
          <Header />
          <div className="flex-1 flex w-full">
            <Sidebar />
            <main className="flex-1 min-w-0 p-8 overflow-y-auto">
              <div className="max-w-6xl mx-auto space-y-8">
                {children}
              </div>
            </main>
          </div>
        </AppProvider>
      </body>
    </html>
  )
}
