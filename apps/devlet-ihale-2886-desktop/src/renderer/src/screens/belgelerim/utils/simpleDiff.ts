export interface DiffChunk {
  type: 'added' | 'removed' | 'unchained'
  text: string
}

/**
 * Sıfır bağımlılıkla çalışan basit satır/blok bazlı diff motoru
 * HTML etiketlerini ayıklayarak veya ham metin üzerinden eklenen/silinen blokları hesaplar.
 */
export function computeTextDiff(oldText: string, newText: string): DiffChunk[] {
  // HTML etiketlerini okunabilir metne dönüştür
  const cleanOld = oldText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const cleanNew = newText
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const oldWords = cleanOld.split(' ')
  const newWords = cleanNew.split(' ')

  const dp: number[][] = Array(oldWords.length + 1)
    .fill(0)
    .map(() => Array(newWords.length + 1).fill(0))

  for (let i = 0; i < oldWords.length; i++) {
    for (let j = 0; j < newWords.length; j++) {
      if (oldWords[i] === newWords[j]) {
        dp[i + 1][j + 1] = dp[i][j] + 1
      } else {
        dp[i + 1][j + 1] = Math.max(dp[i + 1][j], dp[i][j + 1])
      }
    }
  }

  const chunks: DiffChunk[] = []
  let i = oldWords.length
  let j = newWords.length

  const rawReversed: DiffChunk[] = []

  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      rawReversed.push({ type: 'unchained', text: oldWords[i - 1] })
      i--
      j--
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      rawReversed.push({ type: 'added', text: newWords[j - 1] })
      j--
    } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
      rawReversed.push({ type: 'removed', text: oldWords[i - 1] })
      i--
    }
  }

  const forward = rawReversed.reverse()

  // Ardışık aynı tip parçaları birleştir
  for (const item of forward) {
    const last = chunks[chunks.length - 1]
    if (last && last.type === item.type) {
      last.text += ' ' + item.text
    } else {
      chunks.push({ type: item.type, text: item.text })
    }
  }

  return chunks
}
