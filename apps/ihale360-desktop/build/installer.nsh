!macro customInstall
  ; =========================================================================
  ; İHALE 360 — Windows Dosya İlişkilendirmesi (İzole ve Güvenli Kurulum)
  ; Yalnızca İhale 360'a ait uzantıları (.ihale, .ihale360) ve ProgID'leri kaydeder.
  ; Temin 360 veya Devlet İhale 2886 kayıtlarına ASLA dokunmaz.
  ; =========================================================================

  ; --- 1. Ihale360.Document ProgID Tanımı ---
  WriteRegStr HKCU "Software\Classes\Ihale360.Document" "" "İHALE 360 Proje Dosyası"
  WriteRegStr HKCU "Software\Classes\Ihale360.Document" "FriendlyTypeName" "İHALE 360 Proje Dosyası"
  WriteRegStr HKCU "Software\Classes\Ihale360.Document\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Classes\Ihale360.Document\shell" "" "open"
  WriteRegStr HKCU "Software\Classes\Ihale360.Document\shell\open" "" "İHALE 360 ile Aç"
  WriteRegStr HKCU "Software\Classes\Ihale360.Document\shell\open\command" "" '"$INSTDIR\IHALE360.exe" "%1"'

  ; --- 2. .ihale Uzantısı İlişkilendirmesi (Birincil Format) ---
  ReadRegStr $0 HKCU "Software\Classes\.ihale" ""
  ${If} $0 == ""
  ${OrIf} $0 == "Ihale360.Document"
    WriteRegStr HKCU "Software\Classes\.ihale" "" "Ihale360.Document"
  ${EndIf}
  WriteRegStr HKCU "Software\Classes\.ihale" "Content Type" "application/x-ihale"
  WriteRegStr HKCU "Software\Classes\.ihale" "PerceivedType" "document"
  WriteRegStr HKCU "Software\Classes\.ihale\OpenWithProgids" "Ihale360.Document" ""
  WriteRegStr HKCU "Software\Classes\.ihale\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Classes\.ihale\ShellNew" "NullFile" ""
  WriteRegStr HKCU "Software\Classes\.ihale\ShellNew" "ItemName" "İHALE 360 Proje Dosyası"
  WriteRegStr HKCU "Software\Classes\.ihale\ShellNew" "IconPath" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.ihale\OpenWithProgids" "Ihale360.Document" ""

  ; --- 3. .ihale360 Alternatif Uzantısı İlişkilendirmesi ---
  ReadRegStr $0 HKCU "Software\Classes\.ihale360" ""
  ${If} $0 == ""
  ${OrIf} $0 == "Ihale360.Document"
    WriteRegStr HKCU "Software\Classes\.ihale360" "" "Ihale360.Document"
  ${EndIf}
  WriteRegStr HKCU "Software\Classes\.ihale360" "Content Type" "application/x-ihale360"
  WriteRegStr HKCU "Software\Classes\.ihale360" "PerceivedType" "document"
  WriteRegStr HKCU "Software\Classes\.ihale360\OpenWithProgids" "Ihale360.Document" ""
  WriteRegStr HKCU "Software\Classes\.ihale360\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.ihale360\OpenWithProgids" "Ihale360.Document" ""

  ; --- 4. Applications Kaydı (Birlikte Aç menüsü) ---
  WriteRegStr HKCU "Software\Classes\Applications\IHALE360.exe" "FriendlyAppName" "İHALE 360"
  WriteRegStr HKCU "Software\Classes\Applications\IHALE360.exe\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Classes\Applications\IHALE360.exe\shell\open\command" "" '"$INSTDIR\IHALE360.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\Applications\IHALE360.exe\SupportedTypes" ".ihale" ""
  WriteRegStr HKCU "Software\Classes\Applications\IHALE360.exe\SupportedTypes" ".ihale360" ""

  ; --- 5. Windows Explorer İkon ve İlişkilendirme Önbelleğini Yenile ---
  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  ; =========================================================================
  ; İHALE 360 — Güvenli ve İzole Kaldırma
  ; Yalnızca bu uygulamanın oluşturduğu kayıtları siler.
  ; Temin 360 veya Devlet İhale 2886 kayıtlarını ASLA silmez.
  ; =========================================================================

  ; 1. ProgID ve Uygulama Kayıtlarını Temizle
  DeleteRegKey HKCU "Software\Classes\Ihale360.Document"
  DeleteRegKey HKCU "Software\Classes\Applications\IHALE360.exe"

  ; 2. OpenWithProgids Altındaki Değerlerimizi Kaldır
  DeleteRegValue HKCU "Software\Classes\.ihale\OpenWithProgids" "Ihale360.Document"
  DeleteRegValue HKCU "Software\Classes\.ihale360\OpenWithProgids" "Ihale360.Document"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.ihale\OpenWithProgids" "Ihale360.Document"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.ihale360\OpenWithProgids" "Ihale360.Document"

  ; 3. .ihale / .ihale360 Varsayılanı Biz İdiysek Temizle
  ReadRegStr $0 HKCU "Software\Classes\.ihale" ""
  ${If} $0 == "Ihale360.Document"
    DeleteRegValue HKCU "Software\Classes\.ihale" ""
    DeleteRegKey HKCU "Software\Classes\.ihale\ShellNew"
    DeleteRegKey HKCU "Software\Classes\.ihale\DefaultIcon"
  ${EndIf}

  ReadRegStr $0 HKCU "Software\Classes\.ihale360" ""
  ${If} $0 == "Ihale360.Document"
    DeleteRegValue HKCU "Software\Classes\.ihale360" ""
    DeleteRegKey HKCU "Software\Classes\.ihale360\DefaultIcon"
  ${EndIf}

  ; 4. Windows Explorer İkon ve İlişkilendirme Önbelleğini Yenile
  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
