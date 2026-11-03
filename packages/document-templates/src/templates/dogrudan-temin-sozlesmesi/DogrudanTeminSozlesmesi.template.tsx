import React from "react";
import { DocumentLayout } from "../../document/DocumentLayout";
import { EditableField } from "../../document/EditableField";
import { DateEditableField } from "../../document/ApprovalSignature";
import { DogrudanTeminSozlesmesiType } from "./DogrudanTeminSozlesmesi.schema";

interface DogrudanTeminSozlesmesiProps {
  data?: Partial<DogrudanTeminSozlesmesiType> & Record<string, any>;
  pageSize?: "A4" | "A3";
  orientation?: "portrait" | "landscape";
}

export function DogrudanTeminSozlesmesi({
  data = {},
  pageSize = "A4",
  orientation = "portrait",
}: DogrudanTeminSozlesmesiProps) {
  const items = data.ihtiyacKalemleri || [];
  const yuklenici = data.yukleniciFirma || data.firmaUnvan || "YÜKLENİCİ FİRMA";
  const kurum = data.kurumAdi || data.idareAdi || (data.antetSatirlari && data.antetSatirlari[1]) || "İDARE";

  return (
    <DocumentLayout
      data={data as any}
      hideFooter={false}
      pageSize={pageSize}
      orientation={orientation}
      pageNumber={1}
      totalPages={1}
    >
      <div
        style={{
          width: "100%",
          fontSize: "10pt",
          color: "#000",
          fontFamily: "'Times New Roman', Times, serif",
          lineHeight: 1.45,
        }}
      >
        {/* TITLE */}
        <div
          style={{
            textAlign: "center",
            fontWeight: "bold",
            fontSize: "12pt",
            lineHeight: 1.4,
            marginBottom: "16px",
            textTransform: "uppercase",
          }}
        >
          DOĞRUDAN TEMİN USULÜ İLE YAPILACAK<br />
          {kurum}&apos;NA AİT &ldquo;<EditableField name="isinAdi" value={data.isinAdi || data.dosyaKonusu} placeholder="İşin Adı" />&rdquo; İŞİNE AİT SÖZLEŞME
        </div>

        {/* Madde 1 */}
        <p style={{ textAlign: "justify", marginTop: 0, marginBottom: "8px" }}>
          <b>Madde 1 - Sözleşmenin Tarafları:</b><br />
          Bu sözleşme, bir tarafta <b>{kurum}</b> (Bundan böyle İdare diye anılacaktır) ile diğer tarafta <b><EditableField name="yukleniciFirma" value={yuklenici} placeholder="Yüklenici Firma" /></b> (Bundan böyle Yüklenici olarak anılacaktır) arasında aşağıda yazılı şartlar dahilinde akdedilmiştir.
        </p>

        {/* Madde 2 */}
        <div style={{ textAlign: "justify", marginBottom: "8px" }}>
          <b>Madde 2 - Taraflara Ait Bilgiler:</b>
          <table style={{ width: "100%", borderCollapse: "collapse", margin: "6px 0", fontSize: "9.5pt" }}>
            <tbody>
              <tr>
                <td style={{ fontWeight: "bold", width: "200px", padding: "2px 4px", verticalAlign: "top" }}>2.1 İdarenin Adresi</td>
                <td style={{ padding: "2px 4px" }}>: <EditableField name="idareAdresi" value={data.idareAdresi} placeholder="İdare Adresi" /></td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", padding: "2px 4px" }}>Telefon / Faks</td>
                <td style={{ padding: "2px 4px" }}>: {data.idareTelefon || "-"} / {data.idareFaks || "-"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", padding: "2px 4px" }}>E-Posta Adresi</td>
                <td style={{ padding: "2px 4px" }}>: {data.idareEposta || "-"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", padding: "2px 4px", verticalAlign: "top" }}>2.2 Yüklenicinin Tebligat Adresi</td>
                <td style={{ padding: "2px 4px" }}>: <EditableField name="yukleniciAdresi" value={data.yukleniciAdresi} placeholder="Yüklenici Adresi" /> {data.yukleniciIlce || ""} {data.yukleniciIl ? `/${data.yukleniciIl}` : ""}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", padding: "2px 4px" }}>Telefon / Faks</td>
                <td style={{ padding: "2px 4px" }}>: {data.yukleniciTelefon || "-"} / {data.yukleniciFaks || "-"}</td>
              </tr>
              <tr>
                <td style={{ fontWeight: "bold", padding: "2px 4px" }}>E-Posta Adresi</td>
                <td style={{ padding: "2px 4px" }}>: {data.yukleniciEposta || "-"}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ textAlign: "justify", marginTop: 0, marginBottom: "8px" }}>
          <b>2.3</b> Her iki taraf Madde 2.1 ve 2.2&apos;de belirtilen adreslerini tebligat adresi olarak kabul etmişlerdir. Adres değişiklikleri usulüne uygun şekilde karşı tarafa tebliğ edilmedikçe en son bildirilen adrese yapılacak tebliğ ilgili tarafa yapılmış sayılır.
        </p>

        {/* Madde 3 */}
        <p style={{ textAlign: "justify", marginTop: 0, marginBottom: "8px" }}>
          <b>Madde 3 - Tanımlar:</b><br />
          Bu sözleşmenin uygulanmasında, 4734 sayılı Kamu İhale Kanunu ve 4735 sayılı Kamu İhale Sözleşmeleri Kanunu ve ihale dokümanını oluşturan belgelerde yer alan tanımlar geçerlidir.
        </p>

        {/* Madde 4 */}
        <p style={{ textAlign: "justify", marginTop: 0, marginBottom: "6px" }}>
          <b>Madde 4 - İşin Niteliği, Türü, Miktarı ve İşin Yapılma / Malın Teslim Edilme Yeri:</b><br />
          <b>4.1</b> İşin Niteliği, Türü, Miktarı: {items.length || 1} kalem {kurum}&apos;na ait &ldquo;<EditableField name="isinAdi" value={data.isinAdi || data.dosyaKonusu} placeholder="İşin Adı" />&rdquo; işi.
        </p>

        {/* Items Table */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            margin: "8px 0 12px 0",
            fontSize: "9pt",
          }}
        >
          <thead>
            <tr style={{ backgroundColor: "#f7f7f7" }}>
              <th style={{ border: "1px solid #000", padding: "4px 6px", width: "8%", textAlign: "center" }}>Sıra No</th>
              <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "left" }}>Malzeme / Hizmet Adı</th>
              <th style={{ border: "1px solid #000", padding: "4px 6px", textAlign: "left" }}>Özelliği</th>
              <th style={{ border: "1px solid #000", padding: "4px 6px", width: "12%", textAlign: "center" }}>Birimi</th>
              <th style={{ border: "1px solid #000", padding: "4px 6px", width: "14%", textAlign: "right" }}>Miktarı</th>
            </tr>
          </thead>
          <tbody>
            {items.length > 0 ? (
              items.map((item: any, idx: number) => (
                <tr key={idx}>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{idx + 1}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{item.malzemeAdi || item.aciklama || "-"}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px" }}>{item.ozelligi || "-"}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "center" }}>{item.birimi || "Adet"}</td>
                  <td style={{ border: "1px solid #000", padding: "3px 6px", textAlign: "right" }}>{item.miktar || 1}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ border: "1px solid #000", padding: "5px", textAlign: "center", color: "#666" }}>
                  Kalem bilgisi bulunmamaktadır.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Madde 5 */}
        <p style={{ textAlign: "justify", marginTop: 0, marginBottom: "8px" }}>
          <b>Madde 5 - Sözleşme Bedeli ve Süresi:</b><br />
          <b>5.1</b> Sözleşme Bedeli: KDV Hariç <b><EditableField name="genelToplam" value={data.genelToplam ? `${data.genelToplam} ₺` : "-"} placeholder="0,00 ₺" /></b><br />
          <b>5.2</b> Sözleşme Türü: Doğrudan Temin Tip Sözleşmesi<br />
          <b>5.3</b> Sözleşme / Teslim Süresi: <b><EditableField name="sozlesmeSuresi" value={data.sozlesmeSuresi || data.teslimGun || "10 gün"} placeholder="10 gün" /></b>
        </p>

        {/* Madde 6 */}
        <p style={{ textAlign: "justify", marginTop: 0, marginBottom: "8px" }}>
          <b>Madde 6 - Vergi, Resim ve Harçlar ile Giderler:</b><br />
          Taahhüdün yerine getirilmesine ilişkin ulaşım, sigorta, vergi, resim ve harç giderleri sözleşme bedeline dahildir. KDV ise İdare tarafından Yükleniciye ayrıca ödenecektir.
        </p>

        {/* Madde 7 */}
        <p style={{ textAlign: "justify", marginTop: 0, marginBottom: "8px" }}>
          <b>Madde 7 - Gecikme Cezası:</b><br />
          İş zamanında bitirilmediği / mal teslim edilmediği takdirde geçen her takvim günü için sözleşme bedeli üzerinden binde <b><EditableField name="gecikmeCezaOrani" value={data.gecikmeCezaOrani || "5"} placeholder="5" /></b> oranında gecikme cezası uygulanır.
        </p>

        {/* Madde 8 */}
        <p style={{ textAlign: "justify", marginTop: 0, marginBottom: "8px" }}>
          <b>Madde 8 - Denetim Muayene ve Kabul İşlemleri:</b><br />
          Denetim, Muayene ve Kabul İşlemleri Yönetmeliği çerçevesinde İdarenin Muayene ve Kabul Komisyonunca yapılacaktır.
        </p>

        {/* Madde 9 */}
        <p style={{ textAlign: "justify", marginTop: 0, marginBottom: "16px" }}>
          <b>Madde 9 - Yürürlük:</b><br />
          İşbu sözleşme taraflarca tam olarak okunup anlaşıldıktan sonra <b><DateEditableField name="sozlesmeTarihi" value={data.sozlesmeTarihi || data.dosyaTarihi || data.tarih} placeholder="GG.AA.YYYY" /></b> tarihinde imza altına alınmıştır.
        </p>

        {/* Signatures */}
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginTop: "24px",
            pageBreakInside: "avoid",
          }}
        >
          <tbody>
            <tr>
              <td style={{ width: "50%", textAlign: "center", verticalAlign: "top", padding: "10px" }}>
                <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "20px" }}>İDARE</div>
                <div style={{ fontWeight: "bold" }}>
                  <EditableField name="baskanAdi" value={data.baskanAdi || data.onaylayanPersonelAdi} placeholder="Ad Soyad" />
                </div>
                <div style={{ fontSize: "9pt", color: "#444" }}>
                  <EditableField name="baskanUnvan" value={data.baskanUnvan || data.onaylayanPersonelUnvan || "Harcama Yetkilisi"} placeholder="Ünvan" />
                </div>
              </td>
              <td style={{ width: "50%", textAlign: "center", verticalAlign: "top", padding: "10px" }}>
                <div style={{ fontWeight: "bold", textTransform: "uppercase", marginBottom: "20px" }}>YÜKLENİCİ</div>
                <div style={{ fontWeight: "bold" }}>
                  <EditableField name="yukleniciFirma" value={yuklenici} placeholder="Yüklenici Firma" />
                </div>
                <div style={{ fontSize: "9pt", color: "#444" }}>
                  Kaşe / İmza
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </DocumentLayout>
  );
}
