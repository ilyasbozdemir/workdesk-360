import { ipcMain, BrowserWindow } from 'electron'
import { workspaceManager } from '../database/workspace'

async function scrapeDetsisWithHeadlessBrowser(cleanNo: string): Promise<{
  verified: boolean
  birimAdi?: string
  kurumAdi?: string
  url?: string
}> {
  return new Promise((resolve) => {
    let win: BrowserWindow | null = null
    let resolved = false

    const cleanup = () => {
      if (win && !win.isDestroyed()) {
        try {
          win.destroy()
        } catch {}
      }
      win = null
    }

    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true
        cleanup()
        resolve({ verified: false })
      }
    }, 7000)

    try {
      win = new BrowserWindow({
        show: false,
        width: 1024,
        height: 768,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          sandbox: true,
          images: false
        }
      })

      const targetUrl = `https://detsis.gov.tr/ara/${cleanNo}`

      win.webContents.on('did-finish-load', async () => {
        if (resolved || !win || win.isDestroyed()) return
        try {
          const result = await win.webContents
            .executeJavaScript(
              `
            (() => {
              const bodyText = document.body ? document.body.innerText : '';
              const title = document.title || '';
              const isNotFound = bodyText.includes('bulunamadı') || bodyText.includes('Hata') || title.includes('Hata');
              const h1 = document.querySelector('h1, h2, .unit-name, .birim-adi, .page-title');
              const heading = h1 ? h1.innerText.trim() : '';
              return {
                title,
                heading,
                bodyTextLength: bodyText.length,
                isNotFound
              };
            })()
          `
            )
            .catch(() => null)

          if (result && !result.isNotFound && result.bodyTextLength > 50) {
            resolved = true
            clearTimeout(timeout)
            cleanup()
            resolve({
              verified: true,
              birimAdi:
                result.heading || result.title.replace(/- DETSİS|- KAYSİS|KAYSİS/gi, '').trim(),
              url: targetUrl
            })
            return
          }
        } catch {}

        resolved = true
        clearTimeout(timeout)
        cleanup()
        resolve({ verified: false, url: targetUrl })
      })

      win.webContents.on('did-fail-load', () => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          cleanup()
          resolve({ verified: false })
        }
      })

      win.loadURL(targetUrl).catch(() => {
        if (!resolved) {
          resolved = true
          clearTimeout(timeout)
          cleanup()
          resolve({ verified: false })
        }
      })
    } catch {
      if (!resolved) {
        resolved = true
        clearTimeout(timeout)
        cleanup()
        resolve({ verified: false })
      }
    }
  })
}

export function registerDetsisIpcHandlers(): void {
  // ---------------- DETSİS DOĞRULAMA & CACHE MOTORU ----------------
  ipcMain.handle(
    'network:verify-detsis',
    async (_, args?: { detsisNo?: string; force?: boolean }) => {
      const detsisNo = args?.detsisNo
      const force = args?.force
      if (!detsisNo || typeof detsisNo !== 'string') {
        return { success: false, verified: false, error: 'DETSİS numarası geçersiz.' }
      }
      const cleanNo = detsisNo.trim().replace(/[^0-9]/g, '')
      if (!cleanNo) {
        return {
          success: false,
          verified: false,
          error: 'DETSİS numarası yalnızca sayılardan oluşmalıdır.'
        }
      }

      const db = workspaceManager.getDb()

      // 1. Önce DB Cache kontrol et (force değilse)
      if (!force && db) {
        try {
          const cached = db
            .prepare('SELECT * FROM TANIM_DetsisCache WHERE detsis_no = ?')
            .get(cleanNo) as
            | {
                detsis_no: string
                is_verified: number
                birim_adi?: string
                kurum_adi?: string
                kurum_hiyerarsisi?: string
                ulke_adi?: string
                il_adi?: string
                ilce_adi?: string
                kategori_adi?: string
                statu_adi?: string
                logo_base64?: string
                ingilizce_adi?: string
                url?: string
                status_code?: number
                verified_at?: string
              }
            | undefined

          if (cached) {
            return {
              success: true,
              cached: true,
              verified: cached.is_verified === 1,
              detsisNo: cleanNo,
              birimAdi: cached.birim_adi || '',
              kurumAdi: cached.kurum_adi || '',
              kurumHiyerarsisi: cached.kurum_hiyerarsisi || '',
              ulkeAdi: cached.ulke_adi || '',
              ilAdi: cached.il_adi || '',
              ilceAdi: cached.ilce_adi || '',
              kategoriAdi: cached.kategori_adi || '',
              statuAdi: cached.statu_adi || '',
              logoByteArray: cached.logo_base64 || '',
              ingilizceAdi: cached.ingilizce_adi || '',
              url: cached.url || `https://detsis.gov.tr/ara/${cleanNo}`,
              statusCode: cached.status_code || 200,
              verifiedAt: cached.verified_at
            }
          }
        } catch (e) {
          console.warn('[DETSİS Cache Check] Warning:', e)
        }
      }

      // 2. DETSİS Resmi API & Web Siteleri üzerinden sorgulama
      const apiEndpoint = `https://yetkiliapi.detsis.gov.tr/api/backoffice/unauthorizedaccessdata/birimler?birimId=${cleanNo}&pageSize=10&page=1`
      const targetUrl = `https://detsis.gov.tr/ara/${cleanNo}`
      const kaysisUrl = `https://www.kaysis.gov.tr/Kutuphane/Kurum/Detay/${cleanNo}`

      let isVerified = false
      let statusCode = 0
      let birimAdi = ''
      let kurumAdi = ''
      let kurumHiyerarsisi = ''
      let ulkeAdi = ''
      let ilAdi = ''
      let ilceAdi = ''
      let kategoriAdi = ''
      let statuAdi = ''
      let logoByteArray = ''
      let ingilizceAdi = ''
      let finalUrl = targetUrl
      let rawResponse = ''

      // 2.1 Öncelikle Yetkili DETSİS REST API'sini çağır (En kesin ve zengin veri kaynağı)
      try {
        const apiController = new AbortController()
        const apiTimeout = setTimeout(() => apiController.abort(), 6000)

        const apiRes = await fetch(apiEndpoint, {
          method: 'GET',
          headers: {
            Accept: 'application/json, text/plain, */*',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
          },
          signal: apiController.signal
        }).catch(() => null)
        clearTimeout(apiTimeout)

        if (apiRes && apiRes.ok) {
          statusCode = apiRes.status
          const json = await apiRes.json().catch(() => null)
          if (json && Array.isArray(json.data) && json.data.length > 0) {
            const item = json.data[0]
            isVerified = true
            birimAdi = item.birimAdi ? item.birimAdi.trim() : ''
            kurumAdi = item.kurumHiyerarsisi
              ? item.kurumHiyerarsisi.trim()
              : item.birimAdi?.trim() || ''
            kurumHiyerarsisi = item.kurumHiyerarsisi ? item.kurumHiyerarsisi.trim() : ''
            ulkeAdi = item.ulkeAdi ? item.ulkeAdi.trim() : ''
            ilAdi = item.ilAdi ? item.ilAdi.trim() : ''
            ilceAdi = item.ilceAdi ? item.ilceAdi.trim() : ''
            kategoriAdi = item.kategoriAdi ? item.kategoriAdi.trim() : ''
            statuAdi = item.statuAdi ? item.statuAdi.trim() : ''
            logoByteArray = item.logoByteArray || ''
            ingilizceAdi = item.ingilizceAdi ? item.ingilizceAdi.trim() : ''
            rawResponse = JSON.stringify(item).slice(0, 1000)
          }
        }
      } catch (apiErr: any) {
        console.warn('[DETSİS API Error]:', apiErr.message)
      }

      // 2.2 Eğer API doğrudan yanıt vermediyse HTML Fetch + Kaysis fallback'i dene
      if (!isVerified) {
        try {
          const controller = new AbortController()
          const timeoutId = setTimeout(() => controller.abort(), 5000)

          let res = await fetch(targetUrl, {
            method: 'GET',
            headers: {
              'User-Agent':
                'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            },
            signal: controller.signal,
            redirect: 'follow'
          }).catch(() => null)

          clearTimeout(timeoutId)

          if (!res || !res.ok) {
            const kaysisController = new AbortController()
            const kaysisTimeoutId = setTimeout(() => kaysisController.abort(), 5000)
            const kaysisRes = await fetch(kaysisUrl, {
              method: 'GET',
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
              },
              signal: kaysisController.signal,
              redirect: 'follow'
            }).catch(() => null)
            clearTimeout(kaysisTimeoutId)

            if (kaysisRes && kaysisRes.ok) {
              res = kaysisRes
              finalUrl = kaysisUrl
            }
          }

          if (res) {
            statusCode = res.status
            if (res.ok && res.status >= 200 && res.status < 400) {
              isVerified = true
              try {
                const html = await res.text()
                rawResponse = html.slice(0, 1000)
                const titleMatch = html.match(/<title>([^<]+)<\/title>/i)
                if (titleMatch && titleMatch[1]) {
                  const titleText = titleMatch[1].replace(/- DETSİS|- KAYSİS|KAYSİS/gi, '').trim()
                  if (
                    titleText &&
                    !titleText.toLowerCase().includes('hata') &&
                    !titleText.toLowerCase().includes('bulunamadı')
                  ) {
                    birimAdi = titleText
                  }
                }
              } catch {}
            }
          }

          // 2.3 Headless Chromium Scraper fallback
          if (!isVerified) {
            try {
              const scraped = await scrapeDetsisWithHeadlessBrowser(cleanNo)
              if (scraped && scraped.verified) {
                isVerified = true
                statusCode = 200
                if (scraped.birimAdi) birimAdi = scraped.birimAdi
                if (scraped.kurumAdi) kurumAdi = scraped.kurumAdi
                if (scraped.url) finalUrl = scraped.url
              }
            } catch (scrapErr: any) {
              console.warn('[Headless Scraper Warning]:', scrapErr.message)
            }
          }
        } catch (err: any) {
          console.warn('[DETSİS Fetch Error]:', err.message)
        }
      }

      const verifiedAt = new Date().toISOString()

      // 3. Veritabanına kaydet (Cache)
      if (db) {
        try {
          db.prepare(
            `
          INSERT OR REPLACE INTO TANIM_DetsisCache (
            detsis_no, is_verified, birim_adi, kurum_adi, kurum_hiyerarsisi, ulke_adi, il_adi, ilce_adi,
            kategori_adi, statu_adi, logo_base64, ingilizce_adi, url, status_code, response_data, verified_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
        `
          ).run(
            cleanNo,
            isVerified ? 1 : 0,
            birimAdi || null,
            kurumAdi || null,
            kurumHiyerarsisi || null,
            ulkeAdi || null,
            ilAdi || null,
            ilceAdi || null,
            kategoriAdi || null,
            statuAdi || null,
            logoByteArray || null,
            ingilizceAdi || null,
            finalUrl,
            statusCode,
            rawResponse ? rawResponse.slice(0, 500) : null,
            verifiedAt
          )
        } catch (dbErr) {
          console.warn('[DETSİS DB Save Warning]:', dbErr)
        }
      }

      return {
        success: true,
        cached: false,
        verified: isVerified,
        detsisNo: cleanNo,
        birimAdi,
        kurumAdi,
        kurumHiyerarsisi,
        ulkeAdi,
        ilAdi,
        ilceAdi,
        kategoriAdi,
        statuAdi,
        logoByteArray,
        ingilizceAdi,
        url: finalUrl,
        statusCode,
        verifiedAt
      }
    }
  )

  ipcMain.handle('network:get-detsis-cache', async (_, detsisNo: string) => {
    if (!detsisNo) return null
    const cleanNo = detsisNo
      .toString()
      .trim()
      .replace(/[^0-9]/g, '')
    if (!cleanNo) return null
    const db = workspaceManager.getDb()
    if (!db) return null
    try {
      const row = db.prepare('SELECT * FROM TANIM_DetsisCache WHERE detsis_no = ?').get(cleanNo) as
        | {
            detsis_no: string
            is_verified: number
            birim_adi?: string
            kurum_adi?: string
            kurum_hiyerarsisi?: string
            ulke_adi?: string
            il_adi?: string
            ilce_adi?: string
            kategori_adi?: string
            statu_adi?: string
            logo_base64?: string
            ingilizce_adi?: string
            url?: string
            status_code?: number
            verified_at?: string
          }
        | undefined

      if (!row) return null
      return {
        cached: true,
        verified: row.is_verified === 1,
        detsisNo: row.detsis_no,
        birimAdi: row.birim_adi || '',
        kurumAdi: row.kurum_adi || '',
        kurumHiyerarsisi: row.kurum_hiyerarsisi || '',
        ulkeAdi: row.ulke_adi || '',
        ilAdi: row.il_adi || '',
        ilceAdi: row.ilce_adi || '',
        kategoriAdi: row.kategori_adi || '',
        statuAdi: row.statu_adi || '',
        logoByteArray: row.logo_base64 || '',
        ingilizceAdi: row.ingilizce_adi || '',
        url: row.url || `https://detsis.gov.tr/ara/${cleanNo}`,
        statusCode: row.status_code,
        verifiedAt: row.verified_at
      }
    } catch {
      return null
    }
  })

  // DETSİS Search by Name Handler (Tüm Birimler Arama)
  const handleDetsisSearch = async (_: any, query: string) => {
    try {
      const trimmed = (query || '').trim()
      if (!trimmed || trimmed.length < 2) {
        return { success: true, data: [] }
      }

      const encodedQuery = encodeURIComponent(trimmed)
      const searchUrl = `https://yetkiliapi.detsis.gov.tr/api/backoffice/unauthorizedaccessdata/tumbirimler/${encodedQuery}`

      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        return {
          success: false,
          error: `DETSİS arama hatası: HTTP ${response.status}`,
          data: []
        }
      }

      const json = (await response.json()) as {
        data?: Array<{
          kurumHiyerarsisi?: string
          detsisNo?: number
          ulkeAdi?: string
          yurtdisiIlAdi?: string
          uavtIlAdi?: string
          uavtIlceAdi?: string
          ulkeTurkiyeMi?: boolean
          birimAdi?: string
          ingilizceAdi?: string
          id?: number
        }>
        totalCount?: number
        message?: string
      }

      const data = (json?.data || []).map((item) => ({
        detsisNo: item.detsisNo ? String(item.detsisNo) : String(item.id || ''),
        birimAdi: item.birimAdi || '',
        kurumHiyerarsisi: item.kurumHiyerarsisi || '',
        ulkeAdi: item.ulkeAdi || (item.ulkeTurkiyeMi ? 'TÜRKİYE' : ''),
        ilAdi: item.uavtIlAdi || item.yurtdisiIlAdi || '',
        ilceAdi: item.uavtIlceAdi || '',
        ingilizceAdi: item.ingilizceAdi || ''
      }))

      return {
        success: true,
        totalCount: json?.totalCount || data.length,
        data
      }
    } catch (err: any) {
      console.error('[DETSİS Search] Error:', err)
      return { success: false, error: err?.message || 'Arama yapılamadı', data: [] }
    }
  }

  ipcMain.handle('network:search-detsis', handleDetsisSearch)
  ipcMain.handle('workspace:search-detsis', handleDetsisSearch)

  // DETSİS Sub-units Handler (Kurumun alt birimlerini çekme)
  ipcMain.handle('network:get-detsis-subunits', async (_, ustBirimId: string | number) => {
    try {
      const cleanNo = String(ustBirimId || '')
        .trim()
        .replace(/[^0-9]/g, '')
      if (!cleanNo) {
        return { success: false, error: 'Geçersiz DETSİS numarası', data: [] }
      }

      console.log(`[DETSİS Sub-units] Fetching sub-units for ustBirimId=${cleanNo}`)

      let allItems: any[] = []
      let totalCount = 0
      let currentPage = 1
      const pageSize = 100 // DETSİS API maksimum 100 destekler

      while (currentPage <= 5) {
        const url = `https://yetkiliapi.detsis.gov.tr/api/backoffice/unauthorizedaccessdata/birimler?ustBirimId=${cleanNo}&pageSize=${pageSize}&page=${currentPage}`
        const response = await fetch(url, {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            Accept: 'application/json, text/plain, */*'
          },
          signal: AbortSignal.timeout(12000)
        })

        if (!response.ok) {
          let errorDetail = ''
          try {
            const errJson = await response.json()
            errorDetail = errJson?.Message || errJson?.message || JSON.stringify(errJson)
          } catch {
            errorDetail = await response.text().catch(() => '')
          }
          console.error(`[DETSİS Sub-units] HTTP ${response.status}:`, errorDetail)
          return {
            success: false,
            error: errorDetail
              ? `DETSİS Hatası (${response.status}): ${errorDetail}`
              : `DETSİS Sunucu Hatası: HTTP ${response.status}`,
            data: []
          }
        }

        const json = await response.json()
        const pageData = json?.data || []
        totalCount = json?.totalCount || pageData.length
        allItems = allItems.concat(pageData)

        if (pageData.length < pageSize || allItems.length >= totalCount) {
          break
        }
        currentPage++
      }

      const list = allItems.map((item: any) => ({
        detsisNo: item.detsisNo ? String(item.detsisNo) : String(item.id || ''),
        birimAdi: item.birimAdi || '',
        kurumHiyerarsisi: item.kurumHiyerarsisi || '',
        ulkeAdi: item.ulkeAdi || '',
        ilAdi: item.ilAdi || '',
        ilceAdi: item.ilceAdi || '',
        kategoriAdi: item.kategoriAdi || '',
        statuAdi: item.statuAdi || '',
        logoByteArray: item.logoByteArray || ''
      }))

      console.log(
        `[DETSİS Sub-units] Successfully retrieved ${list.length} units (total: ${totalCount})`
      )

      return {
        success: true,
        totalCount: totalCount || list.length,
        data: list
      }
    } catch (err: any) {
      console.error('[DETSİS Sub-units] Error:', err)
      return { success: false, error: err?.message || 'Alt birimler alınamadı', data: [] }
    }
  })

  // DETSİS Categories Tree Handler
  ipcMain.handle('network:get-detsis-categories', async () => {
    try {
      const url =
        'https://yetkiliapi.detsis.gov.tr/api/backoffice/unauthorizedaccessdata/kategorileregoredevletteskilati'
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, data: [] }
      }

      const json = await response.json()
      return { success: true, data: json?.data || [] }
    } catch (err: any) {
      console.error('[DETSİS Categories] Error:', err)
      return { success: false, error: err?.message || 'Kategoriler alınamadı', data: [] }
    }
  })

  // DETSİS Special Types Tree Handler
  ipcMain.handle('network:get-detsis-special-types', async () => {
    try {
      const url =
        'https://yetkiliapi.detsis.gov.tr/api/backoffice/unauthorizedaccessdata/ozellikliturleregoredevletteskilati'
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'application/json, text/plain, */*'
        },
        signal: AbortSignal.timeout(10000)
      })

      if (!response.ok) {
        return { success: false, error: `HTTP ${response.status}`, data: [] }
      }

      const json = await response.json()
      return { success: true, data: json?.data || [] }
    } catch (err: any) {
      console.error('[DETSİS Special Types] Error:', err)
      return { success: false, error: err?.message || 'Özellikli türler alınamadı', data: [] }
    }
  })
}
