import type { PiyasaFiyatArastirmaData } from "./types.js";
export function PiyasaFiyatArastirmaTemplate({data}: {data: PiyasaFiyatArastirmaData}) {
  return <article className="document">
    <header><h2>{data.global.kurum.ad}</h2><p>{data.global.kurum.adres ?? ""}</p></header>
    <h1>PİYASA FİYAT ARAŞTIRMA TUTANAĞI</h1>
    <p>Dosya: {data.document.dosya.dosyaNo}</p><p>Konu: {data.document.dosya.konu}</p><p>Tarih: {data.document.dosya.tarih}</p>
    <table><thead><tr><th>Sıra</th><th>Kalem</th><th>Miktar</th><th>Birim</th></tr></thead>
      <tbody>{data.document.kalemler.map(k => <tr key={k.id}><td>{k.siraNo ?? ""}</td><td>{k.ad ?? ""}</td><td>{k.miktar ?? ""}</td><td>{k.birim ?? ""}</td></tr>)}</tbody></table>
    <h3>Teklifler</h3><table><thead><tr><th>Firma</th><th>Kalem</th><th>Birim fiyat</th></tr></thead>
      <tbody>{data.document.teklifler.map(t => <tr key={t.id}><td>{t.firma ?? ""}</td><td>{data.document.kalemler.find(k=>k.id===t.itemId)?.ad ?? t.itemId ?? ""}</td><td>{t.birimFiyat?.toFixed(2) ?? ""}</td></tr>)}</tbody></table>
    <p>{data.document.aciklama}</p>
    <h3>Komisyon</h3>{data.document.komisyon.map(u=><p key={u.id}>{u.adSoyad ?? ""} — {u.unvan ?? ""} ({u.gorev ?? ""})</p>)}
    <footer>{data.global.yetkili.adSoyad ?? ""} — {data.global.yetkili.unvan ?? ""}</footer>
  </article>;
}
