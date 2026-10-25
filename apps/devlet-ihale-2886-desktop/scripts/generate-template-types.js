const fs = require('fs')
const path = require('path')
const glob = require('glob')

const toPascalCase = (str) => {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

const getType = (value) => {
  if (Array.isArray(value)) {
    if (value.length > 0 && typeof value[0] === 'object' && value[0] !== null) {
      return 'object[]'
    }
    if (value.length > 0 && typeof value[0] === 'string') {
      return 'string[]'
    }
    return 'any[]'
  }
  if (value === null) return 'any'
  return typeof value
}

const generateInterface = (name, obj) => {
  let lines = [`export interface I${name} {`]

  for (const [key, value] of Object.entries(obj)) {
    let type = getType(value)

    // Custom handling for objects inside arrays
    if (type === 'object[]') {
      const subName = name + key.charAt(0).toUpperCase() + key.slice(1) + 'Item'
      let subLines = [`export interface ${subName} {`]
      for (const [sKey, sValue] of Object.entries(value[0])) {
        // Daha katı (strict) tipler için ' | string' kısmını kaldırıyoruz
        subLines.push(`  ${sKey}?: ${getType(sValue)};`)
      }
      subLines.push(`}`)

      lines.unshift(subLines.join('\n') + '\n')
      type = `${subName}[]`
    }

    lines.push(`  ${key}?: ${type};`)
  }

  lines.push(`}`)
  return lines.join('\n')
}

const templatesDir = path.join(__dirname, '..', 'resources', 'templates')
const typesDir = path.join(__dirname, '..', 'src', 'shared', 'types')
const outDir = path.join(typesDir, 'templates')

const jsonFiles = glob.sync('**/*.json', { cwd: templatesDir })

// Clean outDir if exists
if (fs.existsSync(outDir)) {
  fs.rmSync(outDir, { recursive: true, force: true })
}
fs.mkdirSync(outDir, { recursive: true })

let indexExports = `// OTOMATİK OLUŞTURULMUŞTUR - Şablon Veri Tipleri\n\n`

jsonFiles.forEach((file) => {
  const normalizedFile = file.replace(/\\/g, '/')
  const folderParts = normalizedFile.split('/')
  const folderName = folderParts[folderParts.length - 2]
  if (folderName === '.' || !folderName) return

  const categoryFolder = folderParts.length > 2 ? folderParts.slice(0, -2).join('/') : ''
  const interfaceName = toPascalCase(folderName)
  const filePath = path.join(templatesDir, file)

  try {
    const content = fs.readFileSync(filePath, 'utf-8')
    const data = JSON.parse(content)

    const interfaceStr =
      `// Kaynak: resources/templates/${file}\n` + generateInterface(interfaceName, data) + '\n'

    // Create directories
    const targetDir = path.join(outDir, categoryFolder)
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true })
    }

    // Write individual file
    const targetFileName = `${folderName}.ts`
    const targetFilePath = path.join(targetDir, targetFileName)
    fs.writeFileSync(targetFilePath, interfaceStr)

    // Add to index
    const exportPath = categoryFolder ? `./${categoryFolder}/${folderName}` : `./${folderName}`
    indexExports += `export * from '${exportPath}';\n`
  } catch (e) {
    console.error('Hata:', file, e.message)
  }
})

// Write templates/index.ts
fs.writeFileSync(path.join(outDir, 'index.ts'), indexExports)

// Write templates.types.ts to just export from templates
fs.writeFileSync(path.join(typesDir, 'templates.types.ts'), `export * from './templates';\n`)

console.log('Başarıyla klasörlere ve dosyalara bölündü, tipler katılaştırıldı!')
