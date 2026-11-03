import fs from 'fs'
import crypto from 'crypto'
import { getDatabase, updateFileHash } from '../db/database'

export async function computeFileHash(filePath: string): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)

      stream.on('data', (chunk) => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', (err) => {
        console.error('Hash hesaplama hatası:', filePath, err)
        resolve(null)
      })
    } catch {
      resolve(null)
    }
  })
}

class HashQueue {
  private queue: string[] = []
  private isProcessing = false
  private onHashUpdatedCallback?: () => void

  public setUpdateCallback(cb: () => void) {
    this.onHashUpdatedCallback = cb
  }

  public enqueueCandidate(filePath: string, highPriority = false) {
    if (this.queue.includes(filePath)) return
    if (highPriority) {
      this.queue.unshift(filePath)
    } else {
      this.queue.push(filePath)
    }
    this.processNext()
  }

  public triggerPrioritizedDuplicateHashing() {
    const db = getDatabase()
    // Boyutu aynı olan ve hash'i henüz hesaplanmamış adayları bul
    const candidateRows = db.prepare(`
      SELECT f1.path 
      FROM files f1
      JOIN files f2 ON f1.size = f2.size AND f1.id != f2.id
      WHERE f1.sha256 IS NULL OR f1.sha256 = ''
      ORDER BY f1.size DESC
      LIMIT 100
    `).all() as { path: string }[]

    for (const r of candidateRows) {
      this.enqueueCandidate(r.path, true)
    }
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) return
    this.isProcessing = true

    const filePath = this.queue.shift()
    if (filePath && fs.existsSync(filePath)) {
      try {
        const hash = await computeFileHash(filePath)
        if (hash) {
          updateFileHash(filePath, hash)
          if (this.onHashUpdatedCallback) {
            this.onHashUpdatedCallback()
          }
        }
      } catch (err) {
        console.error('Kuyruk hash işleme hatası:', err)
      }
    }

    this.isProcessing = false
    if (this.queue.length > 0) {
      setTimeout(() => this.processNext(), 50)
    }
  }
}

export const fileHashQueue = new HashQueue()

