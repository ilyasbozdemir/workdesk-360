import type { AIFormContext, AIFilledValues } from './aiFormFill.types'

export function buildQuickFillPrompt(context: AIFormContext): string {
  const { formTitle, kurumBilgisi, mevcutDegerler, doldurulacakAlanlar } = context

  const kurumStr = kurumBilgisi
    ? `
Kurum/Birim Bilgileri:
- Birim Adı: ${kurumBilgisi.birimAdi || 'Belirtilmemiş'}
- Sunulacak Makam: ${kurumBilgisi.sunulacakMakam || 'Belirtilmemiş'}
- Antet Ek Satır: ${kurumBilgisi.antetEkSatir || 'Belirtilmemiş'}
- İhtiyaç Yeri: ${kurumBilgisi.ihtiyacYeri || 'Belirtilmemiş'}
- Kurum Adı: ${kurumBilgisi.kurumAdi || 'Belirtilmemiş'}`
    : ''

  const mevcutStr = mevcutDegerler
    ? `\nMevcut Dolu Alanlar:\n${Object.entries(mevcutDegerler)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n')}`
    : ''

  const alanlarStr = doldurulacakAlanlar
    .map(
      (a) =>
        `- ${a.alan} (${a.etiket})${a.zorunlu ? ' [ZORUNLU]' : ''}${
          a.ornekDeger ? ` [Örnek: ${a.ornekDeger}]` : ''
        }`
    )
    .join('\n')

  return `Sen bir Türk kamu ihale uzmanısın. Aşağıdaki form için uygun değerleri üret.

Form: ${formTitle}
${kurumStr}
${mevcutStr}

Doldurulacak Alanlar:
${alanlarStr}

KURALLAR:
1. Yanıtını SADECE geçerli bir JSON objesi olarak ver, başka açıklama ekleme
2. JSON key'leri yukarıdaki "alan" değerleri olmalı
3. Boş bırakmamana gerek yok, her alanı doldur
4. Resmi dil kullan (kurum adında gerçek isim varsa onu kullan, yoksa [KURUM ADI] yaz)
5. Tarih alanları için YYYY-MM-DD formatı kullan

Yanıtını sadece bu şekilde ver:
{"alan1": "değer1", "alan2": "değer2", ...}`
}

export function buildChatSystemPrompt(context: AIFormContext): string {
  const { formTitle, kurumBilgisi, mevcutDegerler, doldurulacakAlanlar } = context

  const kurumStr = kurumBilgisi
    ? `
**Kurum Bilgileri:**
- Birim: ${kurumBilgisi.birimAdi || 'Belirtilmemiş'}
- Sunulacak Makam: ${kurumBilgisi.sunulacakMakam || 'Belirtilmemiş'}
- Antet: ${kurumBilgisi.antetEkSatir || 'Belirtilmemiş'}
- İhtiyaç Yeri: ${kurumBilgisi.ihtiyacYeri || 'Belirtilmemiş'}`
    : ''

  const mevcutStr = mevcutDegerler
    ? Object.entries(mevcutDegerler)
        .filter(([, v]) => v !== null && v !== undefined && v !== '')
        .map(([k, v]) => `- ${k}: ${v}`)
        .join('\n')
    : 'Henüz dolu alan yok.'

  const alanlarStr = doldurulacakAlanlar.map((a) => `- ${a.etiket}`).join('\n')

  return `Sen DT (Doğrudan Temin) uygulamasında çalışan bir Türk kamu ihale asistanısın.
Görevin: "${formTitle}" formunu kullanıcıyla sohbet ederek doldurmaya yardım etmek.

${kurumStr}

Mevcut Değerler:
${mevcutStr}

Doldurulacak Alanlar:
${alanlarStr}

Kullanıcı sana ne almak istediğini söylediğinde, o alıma göre tüm form alanlarını JSON formatında üret.
Sohbet sonunda kullanıcı "Uygula" dediğinde veya memnun olduğunda şu formatla yanıt ver:
<APPLY>{"alan1": "değer1", ...}</APPLY>

Türkçe konuş. Kısa ve net cevaplar ver. Resmi kurumsal dil kullan.`
}

export function tryParseApplyBlock(text: string): AIFilledValues | null {
  const match = text.match(/<APPLY>([\s\S]*?)<\/APPLY>/)
  if (!match) return null
  try {
    return JSON.parse(match[1].trim())
  } catch {
    return null
  }
}

export function tryParseJson(text: string): AIFilledValues | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try {
    return JSON.parse(match[0])
  } catch {
    return null
  }
}
