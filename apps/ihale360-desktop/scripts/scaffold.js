const fs = require('fs')
const path = require('path')

const args = process.argv.slice(2)
if (args.length === 0) {
  console.error('Lütfen bir ekran adı belirtin: pnpm scaffold <screen_name>')
  process.exit(1)
}

const screenName = args[0].toLowerCase()
const screenDir = path.join(__dirname, '../src/screens', screenName)
const componentsDir = path.join(screenDir, 'components')

if (fs.existsSync(screenDir)) {
  console.error(`Hata: '${screenName}' adlı ekran zaten var!`)
  process.exit(1)
}

fs.mkdirSync(screenDir, { recursive: true })
fs.mkdirSync(componentsDir, { recursive: true })

const indexContent = `import React from 'react'
import { use${
  screenName.charAt(0).toUpperCase() + screenName.slice(1)
}Hooks } from './${screenName}.hooks'

export default function ${screenName.charAt(0).toUpperCase() + screenName.slice(1)}Screen() {
  const {} = use${screenName.charAt(0).toUpperCase() + screenName.slice(1)}Hooks()
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold">${
        screenName.charAt(0).toUpperCase() + screenName.slice(1)
      } Ekranı</h1>
    </div>
  )
}
`

const hooksContent = `export function use${
  screenName.charAt(0).toUpperCase() + screenName.slice(1)
}Hooks() {
  return {}
}
`

const utilsContent = `// ${screenName} utilities
`

fs.writeFileSync(path.join(screenDir, 'index.screen.tsx'), indexContent)
fs.writeFileSync(path.join(screenDir, `${screenName}.hooks.ts`), hooksContent)
fs.writeFileSync(path.join(screenDir, `${screenName}.utils.ts`), utilsContent)

console.log(`✅ '${screenName}' ekranı başarıyla oluşturuldu!`)
