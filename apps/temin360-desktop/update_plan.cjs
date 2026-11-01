const fs = require('fs')
let content = fs.readFileSync('DUZELTME_PLANI.md', 'utf8')
const marker = '- [x] **`decimalUtils.ts` Global Kirlilik İzolasyonu:**'
const idx = content.indexOf(marker)
if (idx !== -1) {
  const lineEnd = content.indexOf('\n', content.indexOf('\n', idx) + 1)
  const addition = `
- [x] **E2E Testleri ve CI/CD Başlatma Zaman Aşımı (Timeout) Kök Neden Çözümü:**
  - \`javascript-obfuscator\` Vite eklentisi Rollup'ın \`generateBundle\` aşamasındaki henüz çözümlenmemiş dinamik import yer tutucularını (\`!~{...}~\`) base64 string dizisine dönüştürerek Rollup'ın yer tutucu çözümlemesini engelliyordu. Bu durum çalışma zamanında \`PageWrapper\` altında \`DisclaimerModal-!~{021}~.js\` 404 hatasına ve tüm ekranların çökmesine yol açıyordu. Obfuscation \`writeBundle\` aşamasına taşındı, test/CI ortamında gereksiz obfuscation atlandı ve \`DisclaimerModal\` statik import'a geçirildi.
  - GitHub Actions \`windows-2022\` gibi sanal/headless CI koşucularında fiziksel GPU bulunmadığından \`ignore-gpu-blocklist\` ve \`enable-gpu-rasterization\` bayraklarının Chromium GPU compositor sürecini kilitlemesi engellendi; test/CI modunda \`app.disableHardwareAcceleration()\` devreye alındı ve \`createWindow()\` içine güvenlik fallback zamanlayıcısı eklendi.
  - \`electronHelper.ts\` başlatma argümanlarına test modunda \`--disable-gpu\`, \`--disable-dev-shm-usage\`, \`--no-sandbox\` bayrakları entegre edildi.`
  content = content.slice(0, lineEnd) + addition + content.slice(lineEnd)
  fs.writeFileSync('DUZELTME_PLANI.md', content, 'utf8')
  console.log('OK')
} else {
  console.log('Marker not found')
}

