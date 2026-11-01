import 'server-only';
import { documentService } from './database';
import { definition as baseDefinition } from '../../../src/templates/piyasa-fiyat-arastirma/definition';
import type { TemplateDefinition, FieldDefinition } from '../../../src/core/types';
import { randomUUID } from 'node:crypto';

export function studio(){
 const service=documentService(); const db=service.db;
 db.exec(`CREATE TABLE IF NOT EXISTS studio_templates (id TEXT PRIMARY KEY, title TEXT NOT NULL, version INTEGER NOT NULL, schema_version INTEGER NOT NULL, fields_json TEXT NOT NULL, form_json TEXT NOT NULL, created_at TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS studio_audit (id TEXT PRIMARY KEY, action TEXT NOT NULL, details TEXT NOT NULL, created_at TEXT NOT NULL);`);
 const count=db.prepare('SELECT count(*) AS n FROM studio_templates').get() as {n:number};
 if(!count.n){db.prepare('INSERT INTO studio_templates VALUES (?,?,?,?,?,?,?)').run(baseDefinition.id,'Piyasa Fiyat Araştırma Tutanağı',baseDefinition.version,baseDefinition.schemaVersion,JSON.stringify(baseDefinition.fields),JSON.stringify(baseDefinition.form),new Date().toISOString());}
 return service;
}
export type StudioTemplate = {id:string;title:string;version:number;schema_version:number;fields_json:string;form_json:string;created_at:string};
export function templates():StudioTemplate[]{return studio().db.prepare('SELECT * FROM studio_templates ORDER BY title').all() as StudioTemplate[];}
export function template(id:string):TemplateDefinition & {title:string}{
 const row=studio().db.prepare('SELECT * FROM studio_templates WHERE id=?').get(id) as StudioTemplate|undefined;
 if(!row)throw new Error('Şablon bulunamadı');
 return {id:row.id,title:row.title,version:row.version,schemaVersion:row.schema_version,fields:JSON.parse(row.fields_json) as FieldDefinition[],form:JSON.parse(row.form_json)};
}
export function audit(action:string,details:string){studio().db.prepare('INSERT INTO studio_audit VALUES (?,?,?,?)').run(randomUUID(),action,details,new Date().toISOString());}
export function auditHistory(){return studio().db.prepare('SELECT * FROM studio_audit ORDER BY created_at DESC LIMIT 50').all() as {id:string;action:string;details:string;created_at:string}[];}
export function documentList(){return studio().db.prepare('SELECT d.id,d.dosya_no,d.konu,d.tarih,u.ad AS birim FROM documents d LEFT JOIN units u ON d.birim_id=u.id ORDER BY d.dosya_no').all() as {id:string;dosya_no:string;konu:string;tarih:string;birim:string}[];}
export function unitList(){return studio().db.prepare('SELECT id,ad FROM units ORDER BY ad').all() as {id:string;ad:string}[];}
export function fieldCatalog(){const db=studio().db;return ['global_settings','documents','units','items','commission','offers'].map(table=>({table,columns:(db.prepare(`PRAGMA table_info(${table})`).all() as {name:string}[]).map(x=>x.name)}));}
