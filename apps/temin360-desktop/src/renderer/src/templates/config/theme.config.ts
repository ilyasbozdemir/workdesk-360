export const GLOBAL_THEME = {
  // YAZITIP
  typography: {
    fontFamily: "'Times New Roman', Times, serif",
    baseFontSize: '12pt',
    lineHeight: 1.5
  },

  // RENKLER
  colors: {
    text: '#000000',
    border: '#333333',
    headerBg: '#f2f2f2',
    accentLine: '#cc0000' // Kırmızı kurum çizgisi
  },

  // SAYFALAR
  page: {
    format: 'A4',
    width: '21cm',
    height: '29.7cm',
    margins: {
      top: '1.5cm',
      right: '1.5cm',
      bottom: '1.5cm',
      left: '1.5cm'
    },
    printableHeight: '890px' // Dinamik sayfalama bütçesi
  },

  // TABLOLAR
  table: {
    borderCollapse: 'collapse',
    fontSize: '10pt',
    cellPadding: '6px'
  },

  // LOGİK SPACING SABİTLERİ
  spacing: {
    headerHeight: '80px',
    footerHeight: '60px',
    approvalSpacing: '40px'
  }
}
