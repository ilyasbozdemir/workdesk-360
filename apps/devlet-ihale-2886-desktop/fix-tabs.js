const fs = require('fs')
const path = 'src/renderer/src/screens/dosyalar/tabs/GenelBilgilerTab.tsx'
let content = fs.readFileSync(path, 'utf-8')

// Replace '{activeTab === "genel" && (' with ''
content = content.replace(/\{activeTab === "genel" && \(/g, '')

// Replace ')}' that are alone on a line with ''
content = content.replace(/^\s*\}\)\}\s*$/gm, '')

// Save back
fs.writeFileSync(path, content)
console.log('Done!')
