import { EbysTemplate, EbysTemplateVariables } from '../ebys.types'

const COMMON_CSS = `/* T.C. Resmî Yazışma ve EBYS Belge Standardı Stilleri (Yönetmelik Uyumu: 2646 Sayılı Karar) */
@page {
  size: A4 portrait;
  margin: 20mm 25mm 20mm 25mm; /* Standart: Üst 20mm, Sağ 25mm, Alt 20mm, Sol 25mm */
}

body, .ebys-document-container {
  font-family: "Times New Roman", Times, serif;
  font-size: 12pt;
  line-height: 1.35;
  color: #000000;
  background-color: #ffffff;
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.ebys-a4-page {
  width: 210mm;
  min-height: 297mm;
  padding: 20mm 25mm 20mm 25mm;
  margin: 0 auto;
  box-sizing: border-box;
  background: #ffffff;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

/* 1. BAŞLIK ALANI */
.ebys-header {
  text-align: center;
  font-weight: bold;
  margin-bottom: 25px;
}
.ebys-header .tc {
  font-size: 12pt;
  letter-spacing: 1px;
}
.ebys-header .kurum {
  font-size: 12pt;
  text-transform: uppercase;
  margin-top: 3px;
}
.ebys-header .birim {
  font-size: 11pt;
  font-weight: normal;
  margin-top: 3px;
}

/* 2. SAYI - KONU - TARİH */
.ebys-meta-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 25px;
  font-size: 11pt;
}
.ebys-meta-table td {
  vertical-align: top;
  padding: 2px 0;
}
.ebys-meta-left {
  text-align: left;
  width: 70%;
}
.ebys-meta-right {
  text-align: right;
  width: 30%;
}

/* 3. MUHATAP ALANI */
.ebys-muhatap {
  text-align: center;
  font-weight: bold;
  font-size: 12pt;
  margin: 20px 0 20px 0;
  text-transform: uppercase;
}
.ebys-muhatap-ek {
  font-weight: normal;
  font-size: 10.5pt;
  text-transform: none;
}

/* 4. İLGİ ALANI */
.ebys-ilgi {
  font-size: 11pt;
  margin-bottom: 15px;
  text-indent: 10mm;
}

/* 5. METİN GÖVDESİ */
.ebys-content {
  text-align: justify;
  text-indent: 10mm;
  font-size: 12pt;
  line-height: 1.45;
  margin-bottom: 15px;
}
.ebys-closing {
  text-align: justify;
  text-indent: 10mm;
  font-size: 12pt;
  margin-top: 15px;
  margin-bottom: 25px;
}

/* 6. İMZA ALANI */
.ebys-signature-block {
  width: 100%;
  display: flex;
  justify-content: flex-end;
  margin-top: 25px;
  margin-bottom: 30px;
}
.ebys-signature-box {
  width: 55mm;
  text-align: center;
}
.ebys-signature-name {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 11.5pt;
}
.ebys-signature-title {
  font-size: 11pt;
  margin-top: 3px;
}
.ebys-e-imza-badge {
  font-size: 8pt;
  font-style: italic;
  color: #333333;
  margin-top: 6px;
  border-top: 1px dashed #777;
  padding-top: 3px;
}

/* 7. EKLER VE DAĞITIM */
.ebys-attachments-distribution {
  font-size: 10pt;
  margin-top: 15px;
  border-top: 1px solid #ddd;
  padding-top: 8px;
}
.ebys-section-title {
  font-weight: bold;
  margin-bottom: 4px;
}
.ebys-list {
  margin: 0 0 10px 15px;
  padding: 0;
}
.ebys-list li {
  margin-bottom: 2px;
}

/* 8. ALTBİLGİ VE KAREKOD / DOĞRULAMA ALANI */
.ebys-footer {
  border-top: 1px solid #000;
  padding-top: 6px;
  margin-top: auto;
  font-size: 8.5pt;
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
}
.ebys-footer-left {
  width: 75%;
  line-height: 1.3;
}
.ebys-footer-right {
  width: 25%;
  text-align: right;
}
.ebys-verification-box {
  border: 1px solid #777;
  padding: 4px;
  text-align: center;
  font-size: 7.5pt;
  background-color: #fafafa;
}

/* OLUR BLOKLARI */
.ebys-olur-container {
  margin-top: 30px;
  text-align: center;
}
.ebys-olur-title {
  font-weight: bold;
  font-size: 12pt;
  letter-spacing: 2px;
  margin-bottom: 15px;
}
.ebys-olur-table {
  width: 100%;
  border-collapse: collapse;
}
`

export const EBYS_TEMPLATES: EbysTemplate[] = [
  // 1. STANDART RESMÎ ÜST YAZI
  {
    id: 'ust_yazi_standart',
    name: 'Standart Resmî Üst Yazı (Dış Kurum)',
    category: 'ust_yazi',
    categoryLabel: 'Üst Yazılar',
    description:
      'Farklı bir kamu idaresine, valiliğe veya bakanlığa gönderilen T.C. antetli, DETSİS kayıtlı ve e-imzalı temel üst yazı şablonu.',
    sourceUrl: 'https://www.mevzuat.gov.tr/MevzuatMetin/21.5.2646.pdf',
    sourceType: 'Resmî Mevzuat',
    format: 'HTML/CSS',
    license: 'Kamu Mevzuatı',
    complianceNotes: [
      'Madde 11 uyarınca 3 satırlı ortalı başlık (T.C. / Kurum / Birim).',
      'Madde 12 uyarınca DETSİS ve dosya planı kodlu standart sayı alanı.',
      'Madde 19 uyarınca üst veya eşdeğer kuruma "Arz ederim." kapanışı.',
      'Madde 26 uyarınca iletişim ve evrak doğrulama kodu altbilgisi.'
    ],
    defaultVariables: {
      kurumAdi: 'ÇEVRE, ŞEHİRCİLİK VE İKLİM DEĞİŞİKLİĞİ BAKANLIĞI',
      birimAdi: 'Yapı İşleri Genel Müdürlüğü',
      sayi: 'E-42839201-755.02-1849204',
      tarih: '11.10.2026',
      konu: 'Doğrudan Temin ve Yaklaşık Maliyet İncelemesi',
      muhatap: 'ANKARA VALİLİĞİNE',
      muhatapEk: '(Çevre, Şehircilik ve İklim Değişikliği İl Müdürlüğü)',
      ilgi: 'İlgi: 15.09.2026 tarihli ve E-83920194-010.01-44910 sayılı yazınız.',
      metin:
        'İlgide kayıtlı yazınız ile 2026 mali yılı doğrudan temin ve yaklaşık maliyet tespit süreçlerinde uygulanan cetvellerin güncellenmesi ve elektronik evrak doğrulama sistemine entegrasyonu hakkında bilgi ve belge talep edilmiştir.\n\nBakanlığımızca yürütülen dijital dönüşüm çalışmaları kapsamında, doğrudan temin modülü ve piyasa fiyat araştırma tutanaklarının elektronik imza ve zaman damgasıyla EBYS sistemine tam uyumlu hale getirilmesi tamamlanmış olup ilgili teknik rehber ve uygulama esasları ekte sunulmuştur.',
      sonucParagrafi:
        'Bilgilerini ve söz konusu esaslar çerçevesinde uygulamanın titizlikle yürütülmesini arz ederim.',
      imzaAdi: 'Mustafa YILMAZ',
      imzaUnvani: 'Bakan a.\nGenel Müdür',
      ekler: [
        'Ek-1: Doğrudan Temin EBYS Uygulama Rehberi (12 Sayfa)',
        'Ek-2: Piyasa Fiyat Araştırma Tutanak Örneği (1 Adet)'
      ],
      dagitimGeregi: ['Ankara Valiliğine', 'İstanbul Valiliğine'],
      dagitimBilgi: ['Strateji Geliştirme Başkanlığına'],
      iletisimAdres: 'Mustafa Kemal Mah. Dumlupınar Bulv. No:278 Çankaya / ANKARA',
      iletisimTelefon: '0 (312) 410 10 00',
      iletisimFaks: '0 (312) 410 10 01',
      iletisimEposta: 'yigm@csb.gov.tr',
      iletisimKep: 'csb@hs01.kep.tr',
      iletisimWeb: 'www.csb.gov.tr',
      bilgiIcinAdi: 'Ahmet DEMİR',
      bilgiIcinUnvani: 'Mühendis',
      evrakDogrulamaKodu: 'A48F-992B-CE71'
    },
    generateHtml: (vars: EbysTemplateVariables) => `
<div class="ebys-a4-page">
  <div>
    <!-- BAŞLIK -->
    <div class="ebys-header">
      <div class="tc">T.C.</div>
      <div class="kurum">${vars.kurumAdi}</div>
      <div class="birim">${vars.birimAdi}</div>
    </div>

    <!-- SAYI - KONU - TARİH -->
    <table class="ebys-meta-table">
      <tr>
        <td class="ebys-meta-left"><strong>Sayı :</strong> ${vars.sayi}</td>
        <td class="ebys-meta-right"><strong>Tarih:</strong> ${vars.tarih}</td>
      </tr>
      <tr>
        <td class="ebys-meta-left"><strong>Konu:</strong> ${vars.konu}</td>
        <td class="ebys-meta-right"></td>
      </tr>
    </table>

    <!-- MUHATAP -->
    <div class="ebys-muhatap">
      ${vars.muhatap}
      ${vars.muhatapEk ? `<div class="ebys-muhatap-ek">${vars.muhatapEk}</div>` : ''}
    </div>

    <!-- İLGİ -->
    ${vars.ilgi ? `<div class="ebys-ilgi">${vars.ilgi}</div>` : ''}

    <!-- METİN -->
    <div class="ebys-content">
      ${vars.metin.replace(/\n\n/g, '</div><div class="ebys-content">')}
    </div>

    <!-- SONUÇ -->
    <div class="ebys-closing">
      ${vars.sonucParagrafi}
    </div>

    <!-- İMZA -->
    <div class="ebys-signature-block">
      <div class="ebys-signature-box">
        <div class="ebys-signature-name">${vars.imzaAdi}</div>
        <div class="ebys-signature-title" style="white-space: pre-line;">${vars.imzaUnvani}</div>
        <div class="ebys-e-imza-badge">Bu belge 5070 sayılı Kanuna göre güvenli e-imza ile imzalanmıştır.</div>
      </div>
    </div>

    <!-- EKLER VE DAĞITIM -->
    ${
      (vars.ekler && vars.ekler.length > 0) || (vars.dagitimGeregi && vars.dagitimGeregi.length > 0)
        ? `
    <div class="ebys-attachments-distribution">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          ${
            vars.ekler && vars.ekler.length > 0
              ? `
          <td style="width: 50%; vertical-align: top;">
            <div class="ebys-section-title">EKLER:</div>
            <ul class="ebys-list">
              ${vars.ekler.map((e) => `<li>${e}</li>`).join('')}
            </ul>
          </td>`
              : ''
          }
          ${
            vars.dagitimGeregi && vars.dagitimGeregi.length > 0
              ? `
          <td style="width: 50%; vertical-align: top;">
            <div class="ebys-section-title">DAĞITIM:</div>
            <div style="font-weight: bold; font-size: 9.5pt;">Gereği:</div>
            <ul class="ebys-list">
              ${vars.dagitimGeregi.map((d) => `<li>${d}</li>`).join('')}
            </ul>
            ${
              vars.dagitimBilgi && vars.dagitimBilgi.length > 0
                ? `
            <div style="font-weight: bold; font-size: 9.5pt; margin-top: 4px;">Bilgi:</div>
            <ul class="ebys-list">
              ${vars.dagitimBilgi.map((b) => `<li>${b}</li>`).join('')}
            </ul>`
                : ''
            }
          </td>`
              : ''
          }
        </tr>
      </table>
    </div>`
        : ''
    }
  </div>

  <!-- ALTBİLGİ -->
  <div class="ebys-footer">
    <div class="ebys-footer-left">
      <div>${vars.iletisimAdres || ''}</div>
      <div>Telefon: ${vars.iletisimTelefon || '-'} | Faks: ${vars.iletisimFaks || '-'} | E-Posta: ${vars.iletisimEposta || '-'}</div>
      <div>KEP: ${vars.iletisimKep || '-'} | İnternet Adresi: ${vars.iletisimWeb || '-'}</div>
      ${vars.bilgiIcinAdi ? `<div>Bilgi İçin: ${vars.bilgiIcinAdi} (${vars.bilgiIcinUnvani || ''})</div>` : ''}
    </div>
    <div class="ebys-footer-right">
      <div class="ebys-verification-box">
        <strong>Evrak Doğrulama Kodu:</strong><br />
        ${vars.evrakDogrulamaKodu || 'XXXX-XXXX-XXXX'}
      </div>
    </div>
  </div>
</div>`,
    generateCss: () => COMMON_CSS
  },

  // 2. KURUM İÇİ YAZIŞMA
  {
    id: 'ic_yazisma_birim',
    name: 'Kurum İçi Birimler Arası Yazışma',
    category: 'ic_yazisma',
    categoryLabel: 'İç Yazışmalar',
    description:
      'Aynı idare bünyesindeki müdürlükler, daire başkanlıkları veya şubeler arasında kullanılan hiyerarşik iç yazışma şablonu.',
    sourceUrl: 'https://cbddo.gov.tr/projeler/e-yazisma/',
    sourceType: 'e-Yazışma Rehberi',
    format: 'HTML/CSS',
    license: 'Kamu Standardı',
    complianceNotes: [
      'Birim içi/arası yazışmalarda tam iletişim altbilgisi yerine dahili birim bilgisi yeterlidir.',
      'Alt birime gönderilirken "Rica ederim.", üst birime gönderilirken "Arz ederim." kuralına riayet edilir.'
    ],
    defaultVariables: {
      kurumAdi: 'ANKARA BÜYÜKŞEHİR BELEDİYE BAŞKANLIĞI',
      birimAdi: 'Fen İşleri Dairesi Başkanlığı',
      sayi: 'E-91028472-804.01-55021',
      tarih: '11.10.2026',
      konu: '2026 Yılı Bakım Onarım Malzeme İhtiyacı',
      muhatap: 'MALİ HİZMETLER DAİRESİ BAŞKANLIĞINA',
      muhatapEk: '',
      metin:
        'Başkanlığımız sorumluluk alanında bulunan hizmet binalarının 2026-2027 kış dönemi bakım-onarım ve yalıtım işlerinde kullanılmak üzere ihtiyaç duyulan malzeme listesi ve yaklaşık maliyet hesap cetveli hazırlanmıştır.\n\nSöz konusu alımın 4734 sayılı Kamu İhale Kanununun 22/d maddesi kapsamında doğrudan temin usulüyle karşılanabilmesi amacıyla bütçe tertibi ve ödenek durumunun incelenerek tarafımıza bilgi verilmesini rica ederim.',
      sonucParagrafi: 'Gereğini rica ederim.',
      imzaAdi: 'Serkan ÖZTÜRK',
      imzaUnvani: 'Fen İşleri Dairesi Başkanı',
      ekler: ['Ek: İhtiyaç Listesi ve Yaklaşık Maliyet İcmali (2 Sayfa)'],
      iletisimAdres: 'Hipodrom Cad. No:5 Yenimahalle / ANKARA',
      iletisimTelefon: 'Dahili: 2450 - 2451',
      bilgiIcinAdi: 'Mehmet KAYA',
      bilgiIcinUnvani: 'Şube Müdürü',
      evrakDogrulamaKodu: 'B911-332A-01FE'
    },
    generateHtml: (vars: EbysTemplateVariables) => `
<div class="ebys-a4-page">
  <div>
    <div class="ebys-header">
      <div class="tc">T.C.</div>
      <div class="kurum">${vars.kurumAdi}</div>
      <div class="birim">${vars.birimAdi}</div>
    </div>

    <table class="ebys-meta-table">
      <tr>
        <td class="ebys-meta-left"><strong>Sayı :</strong> ${vars.sayi}</td>
        <td class="ebys-meta-right"><strong>Tarih:</strong> ${vars.tarih}</td>
      </tr>
      <tr>
        <td class="ebys-meta-left"><strong>Konu:</strong> ${vars.konu}</td>
        <td class="ebys-meta-right"></td>
      </tr>
    </table>

    <div class="ebys-muhatap">${vars.muhatap}</div>

    <div class="ebys-content">
      ${vars.metin.replace(/\n\n/g, '</div><div class="ebys-content">')}
    </div>

    <div class="ebys-closing">${vars.sonucParagrafi}</div>

    <div class="ebys-signature-block">
      <div class="ebys-signature-box">
        <div class="ebys-signature-name">${vars.imzaAdi}</div>
        <div class="ebys-signature-title">${vars.imzaUnvani}</div>
        <div class="ebys-e-imza-badge">Güvenli Elektronik İmza</div>
      </div>
    </div>

    ${
      vars.ekler && vars.ekler.length > 0
        ? `
    <div class="ebys-attachments-distribution">
      <div class="ebys-section-title">EKLER:</div>
      <ul class="ebys-list">${vars.ekler.map((e) => `<li>${e}</li>`).join('')}</ul>
    </div>`
        : ''
    }
  </div>

  <div class="ebys-footer">
    <div class="ebys-footer-left">
      <div>${vars.iletisimAdres || ''}</div>
      <div>İletişim: ${vars.iletisimTelefon || ''} | İlgili: ${vars.bilgiIcinAdi || ''} (${vars.bilgiIcinUnvani || ''})</div>
    </div>
    <div class="ebys-footer-right">
      <div class="ebys-verification-box">
        Doğrulama Kodu:<br /><strong>${vars.evrakDogrulamaKodu || ''}</strong>
      </div>
    </div>
  </div>
</div>`,
    generateCss: () => COMMON_CSS
  },

  // 3. OLUR / ONAY YAZISI
  {
    id: 'olur_onay',
    name: 'Makam Olur ve Harcama Onayı Yazısı',
    category: 'olur_onay',
    categoryLabel: 'Olur ve Onay Belgeleri',
    description:
      'İhale onay belgesi, komisyon teşekkülü veya idari izinler için hazırlanan; Teklif Eden, Uygun Görüş ve Olur Makamı hiyerarşisine sahip resmî onay şablonu.',
    sourceUrl: 'https://www.mevzuat.gov.tr/MevzuatMetin/21.5.2646.pdf',
    sourceType: 'Resmî Mevzuat',
    format: 'HTML/CSS',
    license: 'Kamu Mevzuatı',
    complianceNotes: [
      'Yönetmeliğin 21. maddesine göre "OLUR" ibaresi ortalanarak altına onay tarihi ve imza bloğu konulur.',
      'Teklif eden yetkili ile onaylayan yetkili arasında hiyerarşik mesafe ve e-imza onay zinciri korunur.'
    ],
    defaultVariables: {
      kurumAdi: 'DEVLET SU İŞLERİ GENEL MÜDÜRLÜĞÜ',
      birimAdi: '5. Bölge Müdürlüğü (Ankara)',
      sayi: 'E-10293847-934.02-88102',
      tarih: '11.10.2026',
      konu: 'Piyasa Fiyat Araştırma Görevlendirmesi ve Alım Onayı',
      muhatap: 'BÖLGE MÜDÜRLÜĞÜ MAKAMINA',
      metin:
        "Bölge Müdürlüğümüz bünyesinde yürütülmekte olan taşkın koruma tesislerinin periyodik bakımında kullanılmak üzere ihtiyaç duyulan hidrolik vana ve yedek parçaların, 4734 sayılı Kamu İhale Kanununun 22/d maddesi uyarınca doğrudan temin usulüyle satın alınması planlanmaktadır.\n\nSöz konusu alım için piyasa fiyat araştırması yapmak ve yaklaşık maliyeti tespit etmek üzere Şube Müdürümüz Sn. Ali KILIÇ ve Mühendis Sn. Zehra GÜL'ün görevlendirilmesi hususunu tensiplerinize arz ederim.",
      sonucParagrafi: 'Tensiplerinize arz ederim.',
      imzaAdi: 'Kemal AKSOY',
      imzaUnvani: 'Makine İkmal Şube Müdürü',
      uygunGorusAdi: 'Hasan YILDIRIM',
      uygunGorusUnvani: 'Bölge Müdür Yardımcısı',
      olurMakamAdi: 'İbrahim ÇETİN',
      olurMakamUnvani: 'Bölge Müdürü',
      olurTarihi: '11.10.2026',
      iletisimAdres: 'DSİ 5. Bölge Müdürlüğü Çankaya / ANKARA',
      evrakDogrulamaKodu: 'C882-9911-E440'
    },
    generateHtml: (vars: EbysTemplateVariables) => `
<div class="ebys-a4-page">
  <div>
    <div class="ebys-header">
      <div class="tc">T.C.</div>
      <div class="kurum">${vars.kurumAdi}</div>
      <div class="birim">${vars.birimAdi}</div>
    </div>

    <table class="ebys-meta-table">
      <tr>
        <td class="ebys-meta-left"><strong>Sayı :</strong> ${vars.sayi}</td>
        <td class="ebys-meta-right"><strong>Tarih:</strong> ${vars.tarih}</td>
      </tr>
      <tr>
        <td class="ebys-meta-left"><strong>Konu:</strong> ${vars.konu}</td>
        <td class="ebys-meta-right"></td>
      </tr>
    </table>

    <div class="ebys-muhatap">${vars.muhatap}</div>

    <div class="ebys-content">
      ${vars.metin.replace(/\n\n/g, '</div><div class="ebys-content">')}
    </div>

    <div class="ebys-closing">${vars.sonucParagrafi}</div>

    <!-- TEKLİF EDEN İMZA -->
    <div class="ebys-signature-block">
      <div class="ebys-signature-box">
        <div class="ebys-signature-name">${vars.imzaAdi}</div>
        <div class="ebys-signature-title">${vars.imzaUnvani}</div>
        <div class="ebys-e-imza-badge">e-İmzalıdır</div>
      </div>
    </div>

    <!-- OLUR BLOKU -->
    <div class="ebys-olur-container">
      ${
        vars.uygunGorusAdi
          ? `
      <div style="font-size: 10.5pt; font-style: italic; margin-bottom: 8px;">Uygun görüşle arz ederim.</div>
      <div style="font-weight: bold; font-size: 10.5pt;">${vars.uygunGorusAdi}</div>
      <div style="font-size: 10pt; margin-bottom: 20px;">${vars.uygunGorusUnvani}</div>`
          : ''
      }

      <div class="ebys-olur-title">OLUR</div>
      <div style="font-size: 10.5pt; margin-bottom: 8px;">${vars.olurTarihi || vars.tarih}</div>
      <div style="font-weight: bold; font-size: 12pt; text-transform: uppercase;">${vars.olurMakamAdi || ''}</div>
      <div style="font-size: 11pt;">${vars.olurMakamUnvani || ''}</div>
      <div class="ebys-e-imza-badge" style="width: 50mm; margin: 6px auto 0 auto;">Elektronik Onaylıdır</div>
    </div>
  </div>

  <div class="ebys-footer">
    <div class="ebys-footer-left">
      <div>${vars.iletisimAdres || ''}</div>
      <div>Bu belge güvenli elektronik imza ile onaylanmıştır.</div>
    </div>
    <div class="ebys-footer-right">
      <div class="ebys-verification-box">
        Evrak No:<br /><strong>${vars.evrakDogrulamaKodu || ''}</strong>
      </div>
    </div>
  </div>
</div>`,
    generateCss: () => COMMON_CSS
  },

  // 4. BİLGİ VE GÖRÜŞ TALEBİ YAZISI
  {
    id: 'bilgi_gorus',
    name: 'Bilgi ve Görüş Talebi Yazısı',
    category: 'bilgi_gorus',
    categoryLabel: 'Bilgi ve Görüş Yazıları',
    description:
      'Hukuk Müşavirliğinden, Teftiş Kurulundan veya teknik birimlerden resmî mütalaa/görüş istemek amacıyla yazılan yazı şablonu.',
    sourceUrl: 'https://www.turksat.com.tr/tr/bilisim-hizmetleri/belgenet',
    sourceType: 'Kamu EBYS Kılavuzu',
    format: 'HTML/CSS',
    license: 'Kamu Standardı',
    complianceNotes: [
      'Görüş istenen hususların bentler veya maddeler halinde açıkça listelenmesi tavsiye edilir.',
      'Süre kaydı bulunan işlerde cevap süresi açıkça belirtilir.'
    ],
    defaultVariables: {
      kurumAdi: 'MİLLÎ EĞİTİM BAKANLIĞI',
      birimAdi: 'Destek Hizmetleri Genel Müdürlüğü',
      sayi: 'E-70192834-659-192039',
      tarih: '11.10.2026',
      konu: 'Sözleşme Feshi ve Teminat İadesi Görüşü',
      muhatap: 'HUKUK HİZMETLERİ GENEL MÜDÜRLÜĞÜNE',
      metin:
        'Genel Müdürlüğümüzce 4734 sayılı Kamu İhale Kanunu kapsamında ihale edilen Okul Donatım Malzemeleri İşi yüklenicisinin taahhüdünü süresi içerisinde yerine getirmemesi sebebiyle 4735 sayılı Kanunun 20. maddesi gereğince sözleşmenin feshi süreci başlatılmıştır.\n\nYüklenici tarafından ileri sürülen mücbir sebep gerekçelerinin hukuki geçerliliği ve teminat mektubunun gelir kaydedilmesi işlemlerinde izlenecek usul hakkında Hukuk Müşavirliğiniz görüşünün bildirilmesini arz ederim.',
      sonucParagrafi: 'Görüşlerinizin 5 iş günü içerisinde bildirilmesini arz ederim.',
      imzaAdi: 'Murat TEKİN',
      imzaUnvani: 'Genel Müdür',
      ekler: ['Ek-1: İhtarname Örneği', 'Ek-2: Yüklenici İtiraz Dilekçesi'],
      iletisimAdres: 'Atatürk Bulvarı No:98 Bakanlıklar / ANKARA',
      evrakDogrulamaKodu: 'D109-772C-88AA'
    },
    generateHtml: (vars: EbysTemplateVariables) => `
<div class="ebys-a4-page">
  <div>
    <div class="ebys-header">
      <div class="tc">T.C.</div>
      <div class="kurum">${vars.kurumAdi}</div>
      <div class="birim">${vars.birimAdi}</div>
    </div>

    <table class="ebys-meta-table">
      <tr>
        <td class="ebys-meta-left"><strong>Sayı :</strong> ${vars.sayi}</td>
        <td class="ebys-meta-right"><strong>Tarih:</strong> ${vars.tarih}</td>
      </tr>
      <tr>
        <td class="ebys-meta-left"><strong>Konu:</strong> ${vars.konu}</td>
        <td class="ebys-meta-right"></td>
      </tr>
    </table>

    <div class="ebys-muhatap">${vars.muhatap}</div>

    <div class="ebys-content">
      ${vars.metin.replace(/\n\n/g, '</div><div class="ebys-content">')}
    </div>

    <div class="ebys-closing">${vars.sonucParagrafi}</div>

    <div class="ebys-signature-block">
      <div class="ebys-signature-box">
        <div class="ebys-signature-name">${vars.imzaAdi}</div>
        <div class="ebys-signature-title">${vars.imzaUnvani}</div>
        <div class="ebys-e-imza-badge">Güvenli Elektronik İmza</div>
      </div>
    </div>

    ${
      vars.ekler && vars.ekler.length > 0
        ? `
    <div class="ebys-attachments-distribution">
      <div class="ebys-section-title">EKLER:</div>
      <ul class="ebys-list">${vars.ekler.map((e) => `<li>${e}</li>`).join('')}</ul>
    </div>`
        : ''
    }
  </div>

  <div class="ebys-footer">
    <div class="ebys-footer-left">
      <div>${vars.iletisimAdres || ''}</div>
    </div>
    <div class="ebys-footer-right">
      <div class="ebys-verification-box">
        Doğrulama: <strong>${vars.evrakDogrulamaKodu || ''}</strong>
      </div>
    </div>
  </div>
</div>`,
    generateCss: () => COMMON_CSS
  },

  // 5. CEVAP YAZISI
  {
    id: 'cevap_yazisi',
    name: 'İlgi Bildiren Resmî Cevap Yazısı',
    category: 'cevap',
    categoryLabel: 'Cevap Yazıları',
    description:
      'Gelen bir resmî yazıya (ilgi) istinaden verilen, önceki yazışma zincirini ve DETSİS kayıt numarasını belirten cevap şablonu.',
    sourceUrl: 'https://www.mevzuat.gov.tr/MevzuatMetin/21.5.2646.pdf',
    sourceType: 'Resmî Mevzuat',
    format: 'HTML/CSS',
    license: 'Kamu Mevzuatı',
    complianceNotes: [
      'Madde 16 uyarınca ilgi tutulan yazının tarihi, sayısı ve konusu eksiksiz yazılır.',
      'Varsa birden fazla ilgi kronolojik sıra ile a), b), c) şeklinde listelenir.'
    ],
    defaultVariables: {
      kurumAdi: 'İÇİŞLERİ BAKANLIĞI',
      birimAdi: 'Nüfus ve Vatandaşlık İşleri Genel Müdürlüğü',
      sayi: 'E-19283746-045.01-44918',
      tarih: '11.10.2026',
      konu: 'Kişisel Verilerin Korunması ve Yetkilendirme',
      muhatap: 'ADALET BAKANLIĞINA',
      muhatapEk: '(Bilgi İşlem Genel Müdürlüğü)',
      ilgi: 'İlgi: 28.09.2026 tarihli ve E-3329104-702-88190 sayılı yazınız.',
      metin:
        'İlgide kayıtlı yazınız ile UYAP Bilişim Sistemi üzerinden MERNİS servislerine erişim yetkisi verilen kullanıcı profillerinin güncellenmesi ve log doğrulama protokolünün yenilenmesi talep edilmiştir.\n\nSöz konusu talebiniz Genel Müdürlüğümüz teknik ekiplerince incelenmiş olup 6698 sayılı Kişisel Verilerin Korunması Kanunu ve Kurumsal Bilgi Güvenliği Politikaları çerçevesinde gerekli servis konfigürasyonları tamamlanmıştır.',
      sonucParagrafi: 'Bilgilerinizi ve gereğini arz ederim.',
      imzaAdi: 'Engin YURTSEVEN',
      imzaUnvani: 'Genel Müdür',
      iletisimAdres: 'Çamlıca Mah. 408. Cad. No:136 Yenimahalle / ANKARA',
      evrakDogrulamaKodu: 'E881-1200-FFA1'
    },
    generateHtml: (vars: EbysTemplateVariables) => `
<div class="ebys-a4-page">
  <div>
    <div class="ebys-header">
      <div class="tc">T.C.</div>
      <div class="kurum">${vars.kurumAdi}</div>
      <div class="birim">${vars.birimAdi}</div>
    </div>

    <table class="ebys-meta-table">
      <tr>
        <td class="ebys-meta-left"><strong>Sayı :</strong> ${vars.sayi}</td>
        <td class="ebys-meta-right"><strong>Tarih:</strong> ${vars.tarih}</td>
      </tr>
      <tr>
        <td class="ebys-meta-left"><strong>Konu:</strong> ${vars.konu}</td>
        <td class="ebys-meta-right"></td>
      </tr>
    </table>

    <div class="ebys-muhatap">
      ${vars.muhatap}
      ${vars.muhatapEk ? `<div class="ebys-muhatap-ek">${vars.muhatapEk}</div>` : ''}
    </div>

    <div class="ebys-ilgi">${vars.ilgi || ''}</div>

    <div class="ebys-content">
      ${vars.metin.replace(/\n\n/g, '</div><div class="ebys-content">')}
    </div>

    <div class="ebys-closing">${vars.sonucParagrafi}</div>

    <div class="ebys-signature-block">
      <div class="ebys-signature-box">
        <div class="ebys-signature-name">${vars.imzaAdi}</div>
        <div class="ebys-signature-title">${vars.imzaUnvani}</div>
        <div class="ebys-e-imza-badge">e-İmza ile İmzalanmıştır</div>
      </div>
    </div>
  </div>

  <div class="ebys-footer">
    <div class="ebys-footer-left">
      <div>${vars.iletisimAdres || ''}</div>
    </div>
    <div class="ebys-footer-right">
      <div class="ebys-verification-box">
        Doğrulama Kodu:<br /><strong>${vars.evrakDogrulamaKodu || ''}</strong>
      </div>
    </div>
  </div>
</div>`,
    generateCss: () => COMMON_CSS
  },

  // 6. EKLİ VE DAĞITIMLI RESMÎ YAZI
  {
    id: 'dagitimli_ekli',
    name: 'Ekli ve Dağıtımlı Genelge / Talimat Yazısı',
    category: 'dagitimli',
    categoryLabel: 'Dağıtımlı Yazılar',
    description:
      'Tüm taşra teşkilatına, 81 il müdürlüğüne veya ilgili birimlere Gereği ve Bilgi ayrımıyla gönderilen genel yazışma şablonu.',
    sourceUrl: 'https://cbddo.gov.tr/projeler/e-yazisma/',
    sourceType: 'e-Yazışma Rehberi',
    format: 'EYP 2.0',
    license: 'Kamu Standardı',
    complianceNotes: [
      'Madde 24 uyarınca muhatap "DAĞITIM YERLERİNE" olarak yazılır.',
      'Sayfa altında Dağıtım başlığı altında "Gereği" ve "Bilgi" ayrımı açıkça yapılır.',
      'Hem üst hem alt makam muhatap ise sonuç "Arz ve rica ederim." olarak bağlanır.'
    ],
    defaultVariables: {
      kurumAdi: 'SAĞLIK BAKANLIĞI',
      birimAdi: 'Kamu Hastaneleri Genel Müdürlüğü',
      sayi: 'E-49102938-010.06-99201',
      tarih: '11.10.2026',
      konu: '2026-2027 Kış Tedbirleri ve Tıbbi Cihaz Bakım Takvimi',
      muhatap: 'DAĞITIM YERLERİNE',
      metin:
        'Bakanlığımıza bağlı sağlık tesislerinde kış aylarında yaşanabilecek yoğunluklar göz önüne alınarak acil servisler, yoğun bakım üniteleri ve medikal gaz sistemlerinin kesintisiz çalışması için gerekli tedbirlerin ivedilikle alınması gerekmektedir.\n\nBu doğrultuda ekte yer alan Kontrol Listesi uyarınca her hastane başhekimliğince gerekli denetimlerin yapılarak sonuç raporlarının Genel Müdürlüğümüze iletilmesi hususunda gereğini ve bilgilerini arz ve rica ederim.',
      sonucParagrafi: 'Gereğini ve bilgilerini arz ve rica ederim.',
      imzaAdi: 'Prof. Dr. Hakan DEMİRCİ',
      imzaUnvani: 'Bakan a.\nGenel Müdür',
      ekler: [
        'Ek-1: Kış Tedbirleri Denetim Formu (3 Sayfa)',
        'Ek-2: Jeneratör ve Gaz Sistemleri Bakım Yönergesi (8 Sayfa)'
      ],
      dagitimGeregi: [
        '81 İl Valiliğine (İl Sağlık Müdürlükleri)',
        'Şehir Hastaneleri Koordinatörlüklerine'
      ],
      dagitimBilgi: ['Sağlık Hizmetleri Genel Müdürlüğüne', 'Teftiş Kurulu Başkanlığına'],
      iletisimAdres: 'Bilkent Yerleşkesi Üniversiteler Mah. Çankaya / ANKARA',
      evrakDogrulamaKodu: 'F990-2810-0012'
    },
    generateHtml: (vars: EbysTemplateVariables) => `
<div class="ebys-a4-page">
  <div>
    <div class="ebys-header">
      <div class="tc">T.C.</div>
      <div class="kurum">${vars.kurumAdi}</div>
      <div class="birim">${vars.birimAdi}</div>
    </div>

    <table class="ebys-meta-table">
      <tr>
        <td class="ebys-meta-left"><strong>Sayı :</strong> ${vars.sayi}</td>
        <td class="ebys-meta-right"><strong>Tarih:</strong> ${vars.tarih}</td>
      </tr>
      <tr>
        <td class="ebys-meta-left"><strong>Konu:</strong> ${vars.konu}</td>
        <td class="ebys-meta-right"></td>
      </tr>
    </table>

    <div class="ebys-muhatap">${vars.muhatap}</div>

    <div class="ebys-content">
      ${vars.metin.replace(/\n\n/g, '</div><div class="ebys-content">')}
    </div>

    <div class="ebys-closing">${vars.sonucParagrafi}</div>

    <div class="ebys-signature-block">
      <div class="ebys-signature-box">
        <div class="ebys-signature-name">${vars.imzaAdi}</div>
        <div class="ebys-signature-title" style="white-space: pre-line;">${vars.imzaUnvani}</div>
        <div class="ebys-e-imza-badge">Güvenli Elektronik İmza</div>
      </div>
    </div>

    <div class="ebys-attachments-distribution">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 50%; vertical-align: top;">
            <div class="ebys-section-title">EKLER:</div>
            <ul class="ebys-list">
              ${(vars.ekler || []).map((e) => `<li>${e}</li>`).join('')}
            </ul>
          </td>
          <td style="width: 50%; vertical-align: top;">
            <div class="ebys-section-title">DAĞITIM:</div>
            <div style="font-weight: bold; font-size: 9.5pt;">Gereği:</div>
            <ul class="ebys-list">
              ${(vars.dagitimGeregi || []).map((d) => `<li>${d}</li>`).join('')}
            </ul>
            <div style="font-weight: bold; font-size: 9.5pt; margin-top: 4px;">Bilgi:</div>
            <ul class="ebys-list">
              ${(vars.dagitimBilgi || []).map((b) => `<li>${b}</li>`).join('')}
            </ul>
          </td>
        </tr>
      </table>
    </div>
  </div>

  <div class="ebys-footer">
    <div class="ebys-footer-left">
      <div>${vars.iletisimAdres || ''}</div>
      <div>Bu belge 5070 sayılı Elektronik İmza Kanunu kapsamında ıslak imza yerine geçer.</div>
    </div>
    <div class="ebys-footer-right">
      <div class="ebys-verification-box">
        Doğrulama Kodu:<br /><strong>${vars.evrakDogrulamaKodu || ''}</strong>
      </div>
    </div>
  </div>
</div>`,
    generateCss: () => COMMON_CSS
  },

  // 7. GÖREVLENDİRME VE İZİN OLURU
  {
    id: 'gorevlendirme_izin',
    name: 'Personel Geçici Görevlendirme ve İzin Oluru',
    category: 'gorevlendirme',
    categoryLabel: 'Görevlendirme Yazıları',
    description:
      '657 sayılı Kanunun ilgili maddeleri ve Harcırah Kanunu gereğince il dışı denetim/eğitim görevlendirmelerinde kullanılan makam onayı.',
    sourceUrl: 'https://www.mevzuat.gov.tr/MevzuatMetin/21.5.2646.pdf',
    sourceType: 'Resmî Mevzuat',
    format: 'HTML/CSS',
    license: 'Kamu Mevzuatı',
    complianceNotes: [
      'Görev unvanı, görev yeri, tarih aralığı, yolluk/yevmiye durumu metinde açıkça belirtilir.',
      'Birim Amiri Teklif + Genel Sekreter/Başkan Olur zinciri uygulanır.'
    ],
    defaultVariables: {
      kurumAdi: 'TÜRKİYE BİLİMSEL VE TEKNOLOJİK ARAŞTIRMA KURUMU',
      birimAdi: 'Bilişim ve Bilgi Güvenliği İleri Teknolojiler Araştırma Merkezi',
      sayi: 'E-28103948-903.02-1204',
      tarih: '11.10.2026',
      konu: 'Geçici Görevlendirme (İzmir Teknopark)',
      muhatap: 'BAŞKANLIK MAKAMINA',
      metin:
        "Enstitümüz Siber Güvenlik Laboratuvarında görevli Başuzman Araştırmacı Dr. Emre KOÇ ve Uzman Canan AYDIN'ın, TÜBİTAK ARDEB 1001 projesi saha doğrulama testlerini icra etmek üzere 18.10.2026 - 22.10.2026 tarihleri arasında İzmir ilinde geçici olarak görevlendirilmeleri planlanmaktadır.\n\nİlgililerin gidiş-dönüş uçak biletleri ile Harcırah Kanunu uyarınca yevmiye ve konaklama giderlerinin ilgili proje bütçesinden karşılanması hususunda olurlarınızı arz ederim.",
      sonucParagrafi: 'Olurlarınıza arz ederim.',
      imzaAdi: 'Prof. Dr. Selim KAYA',
      imzaUnvani: 'Enstitü Müdürü',
      olurMakamAdi: 'Prof. Dr. Hasan MANDAL',
      olurMakamUnvani: 'TÜBİTAK Başkanı',
      olurTarihi: '12.10.2026',
      iletisimAdres: 'TÜBİTAK Gebze Yerleşkesi Barış Mah. Gebze / KOCAELİ',
      evrakDogrulamaKodu: 'G441-9921-AABB'
    },
    generateHtml: (vars: EbysTemplateVariables) => `
<div class="ebys-a4-page">
  <div>
    <div class="ebys-header">
      <div class="tc">T.C.</div>
      <div class="kurum">${vars.kurumAdi}</div>
      <div class="birim">${vars.birimAdi}</div>
    </div>

    <table class="ebys-meta-table">
      <tr>
        <td class="ebys-meta-left"><strong>Sayı :</strong> ${vars.sayi}</td>
        <td class="ebys-meta-right"><strong>Tarih:</strong> ${vars.tarih}</td>
      </tr>
      <tr>
        <td class="ebys-meta-left"><strong>Konu:</strong> ${vars.konu}</td>
        <td class="ebys-meta-right"></td>
      </tr>
    </table>

    <div class="ebys-muhatap">${vars.muhatap}</div>

    <div class="ebys-content">
      ${vars.metin.replace(/\n\n/g, '</div><div class="ebys-content">')}
    </div>

    <div class="ebys-closing">${vars.sonucParagrafi}</div>

    <div class="ebys-signature-block">
      <div class="ebys-signature-box">
        <div class="ebys-signature-name">${vars.imzaAdi}</div>
        <div class="ebys-signature-title">${vars.imzaUnvani}</div>
        <div class="ebys-e-imza-badge">Elektronik İmzalıdır</div>
      </div>
    </div>

    <div class="ebys-olur-container">
      <div class="ebys-olur-title">OLUR</div>
      <div style="font-size: 10.5pt; margin-bottom: 8px;">${vars.olurTarihi || vars.tarih}</div>
      <div style="font-weight: bold; font-size: 12pt; text-transform: uppercase;">${vars.olurMakamAdi || ''}</div>
      <div style="font-size: 11pt;">${vars.olurMakamUnvani || ''}</div>
      <div class="ebys-e-imza-badge" style="width: 50mm; margin: 6px auto 0 auto;">Makam Onayı e-İmza ile Tamamlanmıştır</div>
    </div>
  </div>

  <div class="ebys-footer">
    <div class="ebys-footer-left">
      <div>${vars.iletisimAdres || ''}</div>
    </div>
    <div class="ebys-footer-right">
      <div class="ebys-verification-box">
        Doğrulama: <strong>${vars.evrakDogrulamaKodu || ''}</strong>
      </div>
    </div>
  </div>
</div>`,
    generateCss: () => COMMON_CSS
  },

  // 8. ÇOK SAYFALI RESMÎ YAZI
  {
    id: 'cok_sayfali_yazi',
    name: 'Çok Sayfalı Resmî Rapor ve İnceleme Yazısı (Sayfa 1 ve 2)',
    category: 'cok_sayfali',
    categoryLabel: 'Çok Sayfalı Belgeler',
    description:
      'Metin gövdesi tek sayfaya sığmayan durumlarda sayfa numaralandırması (Sayfa 1/2), sayfa taşması ve 2. sayfada imza bloğu düzeni.',
    sourceUrl: 'https://www.mevzuat.gov.tr/MevzuatMetin/21.5.2646.pdf',
    sourceType: 'Resmî Mevzuat',
    format: 'HTML/CSS',
    license: 'Kamu Mevzuatı',
    isMultiPage: true,
    complianceNotes: [
      'Madde 10 uyarınca birden fazla sayfalı belgelerde sayfa numarası "Sayfa X/Y" biçiminde altbilgi veya üstbilgi alanına yazılır.',
      'İmza bloğu hiçbir zaman sayfaya tek başına taşırılmaz; metnin en az iki satırıyla birlikte yeni sayfaya geçmelidir.'
    ],
    defaultVariables: {
      kurumAdi: 'TARIM VE ORMAN BAKANLIĞI',
      birimAdi: 'Strateji Geliştirme Başkanlığı',
      sayi: 'E-55102938-604.01-18290',
      tarih: '11.10.2026',
      konu: '2026 Yılı Yatırım Programı İzleme ve Değerlendirme Raporu',
      muhatap: 'CUMHURBAŞKANLIĞI STRATEJİ VE BÜTÇE BAŞKANLIĞINA',
      metin:
        'Bakanlığımız 2026 Yılı Yatırım Programında yer alan tarımsal sulama, modern sera altyapısı, kırsal kalkınma hibeleri ve ormancılık faaliyetlerine ilişkin üçüncü çeyrek gerçekleşme verileri derlenmiştir.\n\nSöz konusu dönemde toplam 48 adet büyük ölçekli yatırım projesinde %87 fiziki gerçekleşme ve %91 nakdi gerçekleşme oranına ulaşılmış olup ödenek kullanım detayları aşağıda özetlenmiştir.\n\nBirinci öncelikli sulama projelerinde iklim değişikliğine bağlı kuraklık risklerini minimize etmek amacıyla kapalı basınçlı borulu sulama şebekelerine öncelik verilmiş ve 12 ilimizde toplam 140.000 hektar tarım arazisi modern sulama altyapısına kavuşturulmuştur.\n\nİkinci bileşen olan kırsal kalkınma hibe destekleri kapsamında genç çiftçi ve kadın kooperatiflerine sağlanan ayni ve nakdi destek tutarı 1,4 milyar TL seviyesine ulaşmış, istihdama doğrudan 12.500 kişilik katkı sağlanmıştır.',
      sonucParagrafi:
        'Yatırım programımızın dördüncü çeyrek hedefleri ve revize ödenek aktarım talepleri ekte yer almakta olup gereğini arz ederim.',
      imzaAdi: 'Dr. Serdar ALPER',
      imzaUnvani: 'Bakan a.\nStrateji Geliştirme Başkanı',
      ekler: ['Ek: 2026 3. Çeyrek Yatırım İcmal Cetveli (14 Sayfa)'],
      iletisimAdres: 'Eskişehir Yolu 9. Km Lodumlu / ANKARA',
      evrakDogrulamaKodu: 'R771-4401-PAGE'
    },
    generateHtml: (vars: EbysTemplateVariables) => `
<!-- 1. SAYFA -->
<div class="ebys-a4-page" style="margin-bottom: 25px; border-bottom: 2px dashed #999;">
  <div>
    <div class="ebys-header">
      <div class="tc">T.C.</div>
      <div class="kurum">${vars.kurumAdi}</div>
      <div class="birim">${vars.birimAdi}</div>
    </div>

    <table class="ebys-meta-table">
      <tr>
        <td class="ebys-meta-left"><strong>Sayı :</strong> ${vars.sayi}</td>
        <td class="ebys-meta-right"><strong>Tarih:</strong> ${vars.tarih}</td>
      </tr>
      <tr>
        <td class="ebys-meta-left"><strong>Konu:</strong> ${vars.konu}</td>
        <td class="ebys-meta-right"><strong>Sayfa:</strong> 1 / 2</td>
      </tr>
    </table>

    <div class="ebys-muhatap">${vars.muhatap}</div>

    <div class="ebys-content">
      ${vars.metin.replace(/\n\n/g, '</div><div class="ebys-content">')}
    </div>
  </div>

  <div class="ebys-footer">
    <div class="ebys-footer-left">
      <div>${vars.iletisimAdres || ''}</div>
    </div>
    <div class="ebys-footer-right">
      <div class="ebys-verification-box">
        Doğrulama: <strong>${vars.evrakDogrulamaKodu || ''}</strong><br />
        Sayfa 1 / 2
      </div>
    </div>
  </div>
</div>

<!-- 2. SAYFA -->
<div class="ebys-a4-page">
  <div>
    <table class="ebys-meta-table" style="border-bottom: 1px solid #000; padding-bottom: 8px;">
      <tr>
        <td class="ebys-meta-left"><strong>Sayı:</strong> ${vars.sayi}</td>
        <td class="ebys-meta-right"><strong>Sayfa:</strong> 2 / 2</td>
      </tr>
    </table>

    <div class="ebys-content" style="margin-top: 20px;">
      Üçüncü bileşen kapsamında orman yangınlarıyla mücadele erken uyarı ve yapay zeka destekli gözetleme kulelerinin kurulumu hedeflenen takvimden 1 ay önce tamamlanmış ve 42 adet İHA/kamera istasyonu aktif hale getirilmiştir.
    </div>

    <div class="ebys-closing">${vars.sonucParagrafi}</div>

    <div class="ebys-signature-block">
      <div class="ebys-signature-box">
        <div class="ebys-signature-name">${vars.imzaAdi}</div>
        <div class="ebys-signature-title" style="white-space: pre-line;">${vars.imzaUnvani}</div>
        <div class="ebys-e-imza-badge">e-İmza ile İmzalanmıştır</div>
      </div>
    </div>

    ${
      vars.ekler && vars.ekler.length > 0
        ? `
    <div class="ebys-attachments-distribution">
      <div class="ebys-section-title">EKLER:</div>
      <ul class="ebys-list">${vars.ekler.map((e) => `<li>${e}</li>`).join('')}</ul>
    </div>`
        : ''
    }
  </div>

  <div class="ebys-footer">
    <div class="ebys-footer-left">
      <div>${vars.iletisimAdres || ''}</div>
    </div>
    <div class="ebys-footer-right">
      <div class="ebys-verification-box">
        Doğrulama: <strong>${vars.evrakDogrulamaKodu || ''}</strong><br />
        Sayfa 2 / 2
      </div>
    </div>
  </div>
</div>`,
    generateCss: () => COMMON_CSS
  }
]
