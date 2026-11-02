import fs from 'fs'
import path from 'path'
import os from 'os'
import { createRequire } from 'module'

const req = createRequire(import.meta.url)
const AdmZip = req('../apps/temin360-desktop/node_modules/adm-zip')
const { DatabaseSync } = await import('node:sqlite')

const teminPath = 'C:\\Users\\ilyas bozdemir\\Desktop\\Güneyyurt Belediyesi İhale - Doğrudan Temin.temin'
const zip = new AdmZip(teminPath)
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check2-'))
zip.extractAllTo(tmp, true)
const db = new DatabaseSync(path.join(tmp, 'database.sqlite'))

console.log('--- TANIM_Firma GÖKŞEN ---')
const goksen = db.prepare("SELECT * FROM TANIM_Firma WHERE unvan LIKE '%GÖKŞEN%'").all()
console.log(goksen)

console.log('--- DATA_TeminFirma firma_id = 26 (GÖKŞEN) ---')
const dtf26 = db.prepare("SELECT * FROM DATA_TeminFirma WHERE firma_id = 26").all()
console.log(dtf26)

console.log('--- DATA_TeminFirma firma_id = 62 ---')
const dtf62 = db.prepare("SELECT * FROM DATA_TeminFirma WHERE firma_id = 62").all()
console.log(dtf62)

console.log('--- DATA_TeminDosyasi WHERE firma_id = 26 ---')
const dosya26 = db.prepare("SELECT id, dosya_no, konu, firma_id, is_deleted FROM DATA_TeminDosyasi WHERE firma_id = 26").all()
console.log(dosya26)

db.close()
fs.rmSync(tmp, { recursive: true, force: true })
