!macro customInstall
  ; =========================================================================
  ; TEMİN 360 — Windows Dosya İlişkilendirmesi (İzole ve Güvenli Kurulum)
  ; Yalnızca Temin 360'a ait uzantıları ve ProgID'leri kaydeder.
  ; Diğer uygulamaların (İhale 360, 2886 vb.) kayıtlarına ASLA dokunmaz.
  ; =========================================================================

  ; --- 1. Temin360.Document ProgID Tanımı ---
  WriteRegStr HKCU "Software\Classes\Temin360.Document" "" "TEMİN 360 Proje Dosyası"
  WriteRegStr HKCU "Software\Classes\Temin360.Document" "FriendlyTypeName" "TEMİN 360 Proje Dosyası"
  WriteRegStr HKCU "Software\Classes\Temin360.Document\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Classes\Temin360.Document\shell" "" "open"
  WriteRegStr HKCU "Software\Classes\Temin360.Document\shell\open" "" "TEMİN 360 ile Aç"
  WriteRegStr HKCU "Software\Classes\Temin360.Document\shell\open\command" "" '"$INSTDIR\TEMIN360.exe" "%1"'

  ; --- 2. .temin Uzantısı İlişkilendirmesi (Birincil Format) ---
  ; Mevcut bir ilişkilendirme yoksa veya zaten Temin360 ise varsayılan olarak ata
  ReadRegStr $0 HKCU "Software\Classes\.temin" ""
  ${If} $0 == ""
  ${OrIf} $0 == "Temin360.Document"
    WriteRegStr HKCU "Software\Classes\.temin" "" "Temin360.Document"
  ${EndIf}
  WriteRegStr HKCU "Software\Classes\.temin" "Content Type" "application/x-temin"
  WriteRegStr HKCU "Software\Classes\.temin" "PerceivedType" "document"
  WriteRegStr HKCU "Software\Classes\.temin\OpenWithProgids" "Temin360.Document" ""
  WriteRegStr HKCU "Software\Classes\.temin\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Classes\.temin\ShellNew" "NullFile" ""
  WriteRegStr HKCU "Software\Classes\.temin\ShellNew" "ItemName" "TEMİN 360 Proje Dosyası"
  WriteRegStr HKCU "Software\Classes\.temin\ShellNew" "IconPath" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.temin\OpenWithProgids" "Temin360.Document" ""

  ; --- 3. Geriye Dönük Uyumluluk (.hkmp / .tmn360 için MIME ve OpenWith desteği) ---
  ; .hkmp (Eski HakimPro Doğrudan Temin Dosyası)
  ReadRegStr $0 HKCU "Software\Classes\.hkmp" "Content Type"
  ${If} $0 == ""
    WriteRegStr HKCU "Software\Classes\.hkmp" "Content Type" "application/x-hkmp"
  ${EndIf}
  WriteRegStr HKCU "Software\Classes\.hkmp" "PerceivedType" "document"
  WriteRegStr HKCU "Software\Classes\.hkmp\OpenWithProgids" "Temin360.Document" ""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.hkmp\OpenWithProgids" "Temin360.Document" ""

  ; .tmn360 (Temin 360 Arşiv Dosyası)
  ReadRegStr $0 HKCU "Software\Classes\.tmn360" "Content Type"
  ${If} $0 == ""
    WriteRegStr HKCU "Software\Classes\.tmn360" "Content Type" "application/x-temin360"
  ${EndIf}
  WriteRegStr HKCU "Software\Classes\.tmn360" "PerceivedType" "document"
  WriteRegStr HKCU "Software\Classes\.tmn360\OpenWithProgids" "Temin360.Document" ""
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.tmn360\OpenWithProgids" "Temin360.Document" ""

  ; --- 4. Applications Kaydı (Birlikte Aç menüsü) ---
  WriteRegStr HKCU "Software\Classes\Applications\TEMIN360.exe" "FriendlyAppName" "TEMİN 360"
  WriteRegStr HKCU "Software\Classes\Applications\TEMIN360.exe\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Classes\Applications\TEMIN360.exe\shell\open\command" "" '"$INSTDIR\TEMIN360.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\Applications\TEMIN360.exe\SupportedTypes" ".temin" ""
  WriteRegStr HKCU "Software\Classes\Applications\TEMIN360.exe\SupportedTypes" ".hkmp" ""
  WriteRegStr HKCU "Software\Classes\Applications\TEMIN360.exe\SupportedTypes" ".tmn360" ""

  ; --- 5. Windows Explorer İkon ve İlişkilendirme Önbelleğini Yenile ---
  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  ; =========================================================================
  ; TEMİN 360 — Güvenli ve İzole Kaldırma
  ; Yalnızca bu uygulamanın oluşturduğu kayıtları siler.
  ; Diğer uygulamaların veya ortak uzantıların kayıtlarını ASLA silmez.
  ; =========================================================================

  ; 1. ProgID ve Uygulama Kayıtlarını Temizle
  DeleteRegKey HKCU "Software\Classes\Temin360.Document"
  DeleteRegKey HKCU "Software\Classes\Applications\TEMIN360.exe"

  ; 2. OpenWithProgids Altındaki Değerlerimizi Kaldır
  DeleteRegValue HKCU "Software\Classes\.temin\OpenWithProgids" "Temin360.Document"
  DeleteRegValue HKCU "Software\Classes\.hkmp\OpenWithProgids" "Temin360.Document"
  DeleteRegValue HKCU "Software\Classes\.tmn360\OpenWithProgids" "Temin360.Document"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.temin\OpenWithProgids" "Temin360.Document"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.hkmp\OpenWithProgids" "Temin360.Document"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.tmn360\OpenWithProgids" "Temin360.Document"

  ; 3. .temin Varsayılanı Biz İdiysek Temizle
  ReadRegStr $0 HKCU "Software\Classes\.temin" ""
  ${If} $0 == "Temin360.Document"
    DeleteRegValue HKCU "Software\Classes\.temin" ""
    DeleteRegKey HKCU "Software\Classes\.temin\ShellNew"
    DeleteRegKey HKCU "Software\Classes\.temin\DefaultIcon"
  ${EndIf}

  ; 4. Windows Explorer İkon ve İlişkilendirme Önbelleğini Yenile
  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
