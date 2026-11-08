import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import App from '../App.js'

describe('Workspace 360 - Uygulama Kataloğu ve Başlatıcı', () => {
  it('ana başlığı, ekosistem afişini ve başlangıç uygulamalarını görüntülemelidir', () => {
    render(<App />)
    expect(screen.getAllByText('Workspace 360').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Temin 360 Koruma Altında')).toBeDefined()
    expect(screen.getByText('Birleşik Dosya 360')).toBeDefined()

    // Temin 360 kartı görünmeli
    expect(screen.getByText('TEMİN 360')).toBeDefined()
    // Dosya 360 kartı görünmeli
    expect(screen.getByText('Dosya 360')).toBeDefined()
  })

  it('Temin 360 için Yüklü/Hazır durumu ve Başlat butonu sunmalıdır', () => {
    render(<App />)
    const launchBtns = screen.getAllByText('Başlat')
    expect(launchBtns.length).toBeGreaterThanOrEqual(1)

    // Temin 360'a ait Başlat butonuna tıklandığında bildirim toast'ı tetiklenmeli
    fireEvent.click(launchBtns[0])
    expect(screen.getByText(/başlatılıyor/i)).toBeDefined()
  })

  it('Dosya 360 için planlandı durumu, modülleri ve devre dışı işlem sunmalıdır', () => {
    render(<App />)
    // Dosya 360 kartı ve modülleri
    expect(screen.getAllByText(/Hızlı Arama/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Etiketler ve Koleksiyonlar/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/Yinelenen Dosyalar/i).length).toBeGreaterThanOrEqual(1)

    // Kuruluma hazır değil butonu
    const notReadyBtns = screen.getAllByText('Kuruluma Hazır Değil')
    expect(notReadyBtns.length).toBeGreaterThan(0)
  })

  it('kategori filtrelemesi yapıldığında yalnızca ilgili uygulamalar listelenmelidir', () => {
    render(<App />)
    // Kamu Alımları & İhale butonuna bas
    const catBtns = screen.getAllByRole('button', { name: /Kamu Alımları & İhale/i })
    fireEvent.click(catBtns[0])

    expect(screen.getByText('TEMİN 360')).toBeDefined()
    expect(screen.queryByText('Harita 360')).toBeNull()
  })

  it('durum filtresi (Yüklü / Hazır) seçildiğinde planlanan uygulamalar gizlenmelidir', () => {
    render(<App />)
    const installedFilters = screen.getAllByRole('button', { name: /Yüklü \/ Hazır/i })
    fireEvent.click(installedFilters[0])

    expect(screen.getByText('TEMİN 360')).toBeDefined()
    expect(screen.queryByText('Dosya 360')).toBeNull()
  })

  it('manifesto inceleme butonuna tıklandığında detay modalı açılmalıdır', () => {
    render(<App />)
    const inspectBtns = screen.getAllByText('Manifesto')
    fireEvent.click(inspectBtns[0])

    expect(screen.getByText(/Doğrulanmış Yerel Uygulama Tanımı/i)).toBeDefined()
    expect(screen.getByText(/Windows App ID/i)).toBeDefined()

    // Kapatma butonu
    const closeBtns = screen.getAllByRole('button', { name: 'Kapat' })
    fireEvent.click(closeBtns[0])
    expect(screen.queryByText(/Doğrulanmış Yerel Uygulama Tanımı/i)).toBeNull()
  })

  it('window.workspaceAPI mevcut olduğunda gerçek tespit rozetini ve başlatma yanıtını yansıtmalıdır', async () => {
    // Mock workspaceAPI
    window.workspaceAPI = {
      isElectron: true,
      launchApp: async () => ({ success: true, message: 'TEMİN 360 başarıyla başlatıldı (EXE)' }),
      checkAppInstalled: async (appId: string) => {
        if (appId === 'dev.ilyasbozdemir.temin360') {
          return { installed: true, isDevSource: true, path: 'apps/app-desktop' }
        }
        return { installed: false }
      },
      getSystemInfo: async () => ({
        platform: 'win32',
        arch: 'x64',
        nodeVersion: '22.0.0',
        electronVersion: '39.0.0'
      }),
      minimizeWindow: () => {},
      maximizeWindow: () => {},
      closeWindow: () => {}
    }

    render(<App />)

    // Geliştirici modu rozeti görünmeli
    const devBadge = await screen.findByText('Geliştirici Modu (Dev)')
    expect(devBadge).toBeDefined()

    // Başlat butonuna tıklandığında gerçek mesaj görünmeli
    const launchBtns = screen.getAllByText('Başlat')
    fireEvent.click(launchBtns[0])

    const successToast = await screen.findByText(/TEMİN 360 başarıyla başlatıldı/i)
    expect(successToast).toBeDefined()

    // Temizle
    delete window.workspaceAPI
  })

  it('KAMU 360 portal modül seçicisi üzerinden filtreleme yapabilmelidir', () => {
    render(<App />)

    // Sidebar'daki veya Header'daki İhale & Satın Alma modülüne tıkla
    const moduleButtons = screen.getAllByRole('button', { name: /İhale & Satın Alma/i })
    fireEvent.click(moduleButtons[0])

    // İhale ve Temin listelenmeli
    expect(screen.getByText('TEMİN 360')).toBeDefined()
    // CBS / Harita uygulaması listede olmamalı
    expect(screen.queryByText('Harita 360')).toBeNull()

    // Tekrar Tüm Modüller seçildiğinde geri gelmeli
    const allModuleBtns = screen.getAllByRole('button', { name: /Tüm Modüller/i })
    fireEvent.click(allModuleBtns[0])
    expect(screen.getByText('Harita 360')).toBeDefined()
  })

  it('kurulu olmayan veya indirme paketi sunan uygulamalar için İndir & Kur butonu sunulmalıdır', async () => {
    // window.workspaceAPI mock
    window.workspaceAPI = {
      isElectron: true,
      launchApp: async () => ({ success: true, message: 'OK' }),
      checkAppInstalled: async (appId: string) => {
        // Disk Analiz 360 kurulu değil gibi simüle et
        if (appId === 'dev.ilyasbozdemir.diskanaliz360') {
          return { installed: false }
        }
        return { installed: true }
      },
      getSystemInfo: async () => ({
        platform: 'win32',
        arch: 'x64',
        nodeVersion: '22.0.0',
        electronVersion: '39.0.0'
      }),
      minimizeWindow: () => {},
      maximizeWindow: () => {},
      closeWindow: () => {}
    }

    render(<App />)

    const downloadButtons = await screen.findAllByRole('button', { name: /İndir & Kur/i })
    expect(downloadButtons.length).toBeGreaterThan(0)

    // Temizle
    delete window.workspaceAPI
  })
})
