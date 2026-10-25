import { ipcMain } from 'electron'
import { generateContent, testConnection, AIGenerateOptions } from '../ai/index'

export function registerAiIpcHandlers(): void {
  ipcMain.handle('ai:generate', async (_, options: AIGenerateOptions) => {
    try {
      const result = await generateContent(options)
      return { success: true, text: result }
    } catch (error: any) {
      console.error('AI Generate Error:', error)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('ai:test', async (_, provider: string, apiKey: string) => {
    try {
      const result = await testConnection({ provider, apiKey })
      return result
    } catch (error: any) {
      console.error('AI Test Error:', error)
      return { success: false, error: error.message }
    }
  })
}
