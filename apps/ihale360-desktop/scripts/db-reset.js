const fs = require('fs')
const path = require('path')

const dbPath = path.join(__dirname, '../database.sqlite')

if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath)
  console.log('✅ Veritabanı başarıyla sıfırlandı (database.sqlite silindi).')
} else {
  console.log('ℹ️ Veritabanı dosyası bulunamadı, sıfırlanacak bir şey yok.')
}
// İleride buraya seed işlemleri de eklenebilir.
