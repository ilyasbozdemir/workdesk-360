const fs = require('fs')
const path = require('path')

const dirs = [
  'src/components/ui',
  'src/components/layout',
  'src/components/shared',
  'src/hooks',
  'src/utils',
  'src/types',
  'src/screens'
]

dirs.forEach((dir) => {
  const fullPath = path.join(__dirname, '..', dir)
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true })
    console.log(`✅ ${dir} oluşturuldu.`)
  } else {
    console.log(`ℹ️ ${dir} zaten mevcut.`)
  }
})

console.log('🎉 Kurulum tamamlandı!')
