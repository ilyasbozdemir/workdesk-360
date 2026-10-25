import type { Standard2886Template } from './studyoTypes'

// Standart 2886 İhale Şablonları
export const STANDARD_2886_TEMPLATES: Standard2886Template[] = [
  {
    kod: '2886-EVR-01',
    ad: 'Başkanlık Oluru / İhale Başlatma Onay Belgesi',
    kategori: '1. Aşama: Başlangıç & Yetki',
    templateHtml: `
<div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 25px;">
    <h3 style="margin: 0; font-size: 14pt; text-transform: uppercase;">T.C.</h3>
    <h3 style="margin: 0; font-size: 13pt; text-transform: uppercase;">{{kurum_adi}}</h3>
    <h4 style="margin: 5px 0 0 0; font-size: 11pt; color: #475569;">Emlak ve İstimlak Müdürlüğü</h4>
  </div>

  <div style="display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 10pt;">
    <div><strong>Sayı:</strong> {{dosya_no}} / {{sayi_no}}</div>
    <div><strong>Tarih:</strong> {{tarih}}</div>
  </div>

  <div style="text-align: center; margin: 25px 0; font-weight: bold; font-size: 12pt; text-decoration: underline;">
    BAŞKANLIK MAKAMINA (İHALE ONAY BELGESİ)
  </div>

  <p>
    Mülkiyeti idaremize ait aşağıda tapu ve nitelik bilgileri belirtilen taşınmazın, 
    <strong>2886 Sayılı Devlet İhale Kanunu'nun {{ihale_usulu}}</strong> hükümleri doğrultusunda 
    <strong>{{islem_turu_adi}}</strong> ihalesine çıkarılması planlanmaktadır.
  </p>

  <table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 10pt;" border="1" cellpadding="8">
    <tr style="background-color: #f8fafc;">
      <th style="width: 35%; text-align: left;">Dosya Kayıt No</th>
      <td>{{dosya_no}}</td>
    </tr>
    <tr>
      <th style="text-align: left;">İhale Konusu / Taşınmaz</th>
      <td>{{tasinmaz_adi}}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <th style="text-align: left;">İşlem Türü</th>
      <td><strong>{{islem_turu_adi}}</strong></td>
    </tr>
    <tr>
      <th style="text-align: left;">Ada / Parsel / Mahalle</th>
      <td>{{ada_parsel}} ({{mahalle_ilce}})</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <th style="text-align: left;">Yüzölçümü & Niteliği</th>
      <td>{{yuzolcumu}} m² — {{tasinmaz_cinsi}}</td>
    </tr>
    <tr>
      <th style="text-align: left;">Tahmini Muhammen Bedel</th>
      <td><strong style="color: #059669;">₺{{muhammen_bedel}}</strong> ({{muhammen_bedel_yaziyla}})</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <th style="text-align: left;">Geçici Teminat Tutarı (%3)</th>
      <td><strong>₺{{gecici_teminat}}</strong></td>
    </tr>
    <tr>
      <th style="text-align: left;">İhale Tarihi & Saati</th>
      <td>{{ihale_tarihi}} — Saat: {{ihale_saati}}</td>
    </tr>
    <tr style="background-color: #f8fafc;">
      <th style="text-align: left;">İhale Yeri</th>
      <td>{{ihale_yeri}}</td>
    </tr>
    {{#imar_durumu}}
    <tr>
      <th style="text-align: left;">İmar Durumu</th>
      <td>{{imar_durumu}}</td>
    </tr>
    {{/imar_durumu}}
  </table>

  <p>
    Söz konusu ihalenin açılması, şartname ve eklerinin hazırlanması ve Encümene sevk edilmesi hususunu tensiplerinize arz ederim.
  </p>

  <div style="margin-top: 50px; display: flex; justify-content: space-between; text-align: center; font-size: 10pt;">
    <div>
      <p><strong>Emlak ve İstimlak Müdürü</strong></p>
      <br/><br/>
      <p>İmza / Mühür</p>
    </div>
    <div>
      <p><strong>U Y G U N D U R</strong></p>
      <p><strong>Belediye Başkanı / İta Amiri</strong></p>
      <br/><br/>
      <p>İmza / Mühür</p>
    </div>
  </div>
</div>
`
  },
  {
    kod: '2886-EVR-02',
    ad: '2886 İhale Şartnamesi (Madde 45 / Açık Teklif)',
    kategori: '2. Aşama: Şartname & Esaslar',
    templateHtml: `
<div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 25px;">
    <h3 style="margin: 0; font-size: 13pt; text-transform: uppercase;">T.C. {{kurum_adi}} BAŞKANLIĞI</h3>
    <h4 style="margin: 5px 0 0 0; font-size: 12pt;">TAŞINMAZ {{islem_turu_adi}} İHALE ŞARTNAMESİ</h4>
    <p style="font-size: 10pt; color: #64748b; margin-top: 4px;">(2886 Sayılı Kanun Madde {{ihale_usulu}})</p>
  </div>

  <h4 style="font-size: 11pt; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px;">MADDE 1 — İŞİN KONUSU VE NİTELİĞİ</h4>
  <p style="font-size: 10pt;">
    Mülkiyeti idaremize ait, tapunun <strong>{{ada_parsel}}</strong> parsel numarasında kayıtlı, 
    <strong>{{yuzolcumu}} m²</strong> yüzölçümlü <strong>{{tasinmaz_cinsi}}</strong> vasıflı taşınmazın 
    2886 Sayılı Devlet İhale Kanunu hükümlerine göre <strong>{{islem_turu_adi}}</strong> ihalesidir.
  </p>

  <h4 style="font-size: 11pt; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px;">MADDE 2 — MUHAMMEN BEDEL VE GEÇİCİ TEMİNAT</h4>
  <p style="font-size: 10pt;">
    2.1. İhale konusu taşınmazın muhammen bedeli <strong>₺{{muhammen_bedel}}</strong> ({{muhammen_bedel_yaziyla}})'dir.<br/>
    2.2. İhaleye katılabilmek için muhammen bedelin en az %3'ü olan <strong>₺{{gecici_teminat}}</strong> tutarında geçici teminat yatırılması zorunludur.
  </p>

  <h4 style="font-size: 11pt; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px;">MADDE 3 — İHALE TARİHİ VE YERİ</h4>
  <p style="font-size: 10pt;">
    İhale, <strong>{{ihale_tarihi}}</strong> günü saat <strong>{{ihale_saati}}</strong>'da 
    <strong>{{ihale_yeri}}</strong> adresinde Belediye Encümeni huzurunda yapılacaktır.
  </p>

  <h4 style="font-size: 11pt; border-bottom: 2px solid #cbd5e1; padding-bottom: 4px; margin-top: 20px;">MADDE 4 — İHALEYE KATILMA ŞARTLARI</h4>
  <ul style="font-size: 10pt; padding-left: 20px;">
    <li>Kanuni ikametgâh belgesi ve T.C. Kimlik fotokopisi,</li>
    <li>Tüzel kişiler için Ticaret Odası faaliyet belgesi ve imza sirküleri,</li>
    <li>Geçici teminat makbuzu veya süresiz banka teminat mektubu,</li>
    <li>Belediyemize vadesi geçmiş borcu bulunmadığına dair borcu yoktur yazısı.</li>
  </ul>

  <div style="margin-top: 40px; text-align: right; font-size: 10pt;">
    <p><strong>İdare Yetkilisi / Encümen Başkanı</strong></p>
    <br/><br/>
    <p>İmza / Mühür</p>
  </div>
</div>
`
  },
  {
    kod: '2886-EVR-05',
    ad: 'Kıymet Takdir Komisyonu Karar Tutanağı & Muhammen Bedel',
    kategori: '2. Aşama: Kıymet Takdiri',
    templateHtml: `
<div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h3 style="margin: 0; font-size: 13pt;">T.C. {{kurum_adi}}</h3>
    <h4 style="margin: 5px 0; font-size: 11pt;">KIYMET TAKDİR KOMİSYONU KARAR TUTANAĞI</h4>
  </div>

  <div style="font-size: 10pt; margin-bottom: 15px; border-bottom: 1px solid #e2e8f0; padding-bottom: 10px;">
    <div><strong>Dosya No:</strong> {{dosya_no}}</div>
    <div><strong>Karar Tarihi:</strong> {{tarih}}</div>
    <div><strong>Taşınmaz:</strong> {{tasinmaz_adi}} (Ada: {{ada}}, Parsel: {{parsel}}, Yüzölçümü: {{yuzolcumu}} m²)</div>
  </div>

  <p>
    2886 Sayılı Devlet İhale Kanunu'nun 13. Maddesi uyarınca teşekkül eden Kıymet Takdir Komisyonumuz toplanarak, 
    mahallinde yapılan incelemeler, emsal alım-satım/kira rayiçleri ve piyasa şartları göz önüne alınarak muhammen bedel tespiti yapılmıştır.
  </p>

  <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; padding: 15px; margin: 20px 0; border-radius: 6px;">
    <p style="margin: 0; font-size: 11pt;"><strong>Takdir Edilen Muhammen Bedel:</strong> <span style="color: #059669; font-weight: bold;">₺{{muhammen_bedel}}</span> ({{muhammen_bedel_yaziyla}})</p>
    <p style="margin: 8px 0 0 0; font-size: 10pt;"><strong>%3 Geçici Teminat Tutarı:</strong> ₺{{gecici_teminat}}</p>
  </div>

  <table style="width: 100%; border-collapse: collapse; margin-top: 40px; text-align: center; font-size: 10pt;">
    <tr>
      <td><strong>Komisyon Başkanı</strong><br/><br/>Müdür<br/>İmza</td>
      <td><strong>Üye (Teknik)</strong><br/><br/>Harita Mühendisi<br/>İmza</td>
      <td><strong>Üye (Mali)</strong><br/><br/>Mali Hizmetler Yetkilisi<br/>İmza</td>
    </tr>
  </table>
</div>
`
  },
  {
    kod: '2886-EVR-07',
    ad: 'Basın İlan & Resmi Gazete İhale İlan Metni',
    kategori: '3. Aşama: İlan & Duyuru',
    templateHtml: `
<div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h3 style="margin: 0; font-size: 13pt;">{{kurum_adi}} BAŞKANLIĞINDAN TAŞINMAZ {{islem_turu_adi}} İHALE İLANI</h3>
  </div>

  <p style="font-size: 10pt;">
    <strong>1.</strong> Mülkiyeti Belediyemize ait aşağıda tapu ve nitelikleri belirtilen taşınmaz, 
    2886 Sayılı Devlet İhale Kanunu'nun <strong>{{ihale_usulu}}</strong> maddesi uyarınca ihale ile 
    <strong>{{islem_turu_adi}}</strong> yapılacaktır.
  </p>

  <table style="width: 100%; border-collapse: collapse; margin: 15px 0; font-size: 9.5pt;" border="1" cellpadding="6">
    <tr style="background-color: #f1f5f9; text-align: center;">
      <th>Sıra</th>
      <th>Mahalle / Mevkii</th>
      <th>Ada / Parsel</th>
      <th>Yüzölçümü (m²)</th>
      <th>Muhammen Bedel (₺)</th>
      <th>Geçici Teminat (%3)</th>
      <th>İhale Tarihi & Saati</th>
    </tr>
    <tr style="text-align: center;">
      <td>1</td>
      <td>{{mahalle_ilce}}</td>
      <td>{{ada_parsel}}</td>
      <td>{{yuzolcumu}}</td>
      <td>₺{{muhammen_bedel}}</td>
      <td>₺{{gecici_teminat}}</td>
      <td>{{ihale_tarihi}} {{ihale_saati}}</td>
    </tr>
  </table>

  <p style="font-size: 10pt;">
    <strong>2. Şartname Temini:</strong> İhale şartnamesi mesai saatleri içinde Emlak ve İstimlak Müdürlüğünde görülebilir veya bedelsiz incelenebilir.<br/>
    <strong>3. İhale Yeri:</strong> {{ihale_yeri}}<br/>
    İlgililere ilanen duyurulur.
  </p>
</div>
`
  },
  {
    kod: '2886-EVR-12',
    ad: 'Encümen İhale Kararı & Karar Tutanağı (İhale Komisyonu)',
    kategori: '4. Aşama: İhale Kararı',
    templateHtml: `
<div style="font-family: Arial, sans-serif; padding: 25px; line-height: 1.6; color: #1e293b;">
  <div style="text-align: center; margin-bottom: 20px;">
    <h3 style="margin: 0; font-size: 13pt;">T.C. {{kurum_adi}}</h3>
    <h4 style="margin: 5px 0; font-size: 11pt;">BELEDİYE ENCÜMENİ İHALE KARARI</h4>
  </div>

  <div style="display: flex; justify-content: space-between; font-size: 10pt; margin-bottom: 15px;">
    <div><strong>Karar No:</strong> {{karar_no}}</div>
    <div><strong>Karar Tarihi:</strong> {{tarih}}</div>
  </div>

  <p style="font-size: 10pt;">
    Belediyemiz Encümeni <strong>{{ihale_tarihi}}</strong> tarihinde Belediye Başkanı başkanlığında toplanarak, 
    2886 Sayılı Kanunun <strong>{{ihale_usulu}}</strong> maddesi uyarınca ilanı yapılan 
    <strong>{{tasinmaz_adi}} (Ada: {{ada_parsel}})</strong> taşınmazın ihalesine geçilmiştir.
  </p>

  <p style="font-size: 10pt;">
    Yapılan açık artırma / teklif zarflarının açılması neticesinde en yüksek geçerli teklif 
    <strong>₺{{muhammen_bedel}}</strong> bedelle verilmiş olup ihale uhdesinde kalmıştır.
  </p>

  <table style="width: 100%; border-collapse: collapse; margin-top: 35px; text-align: center; font-size: 9.5pt;">
    <tr>
      <td><strong>Encümen Başkanı</strong><br/><br/>İmza</td>
      <td><strong>Üye</strong><br/><br/>İmza</td>
      <td><strong>Üye</strong><br/><br/>İmza</td>
      <td><strong>Mali Hizmetler Müd.</strong><br/><br/>İmza</td>
    </tr>
  </table>
</div>
`
  }
]
