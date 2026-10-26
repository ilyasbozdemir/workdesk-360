!macro customInstall
  ; =========================================================================
  ; DEVLET İHALE 2886 — Windows Dosya İlişkilendirmesi (İzole ve Güvenli Kurulum)
  ; Yalnızca Devlet İhale 2886'ya ait uzantıları (.ihale2886, .dihale) ve ProgID'leri kaydeder.
  ; Temin 360 veya İhale 360 kayıtlarına ASLA dokunmaz.
  ; =========================================================================

  ; --- 1. DevletIhale2886.Document ProgID Tanımı ---
  WriteRegStr HKCU "Software\Classes\DevletIhale2886.Document" "" "Devlet İhale 2886 Proje Dosyası"
  WriteRegStr HKCU "Software\Classes\DevletIhale2886.Document\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Classes\DevletIhale2886.Document\shell" "" "open"
  WriteRegStr HKCU "Software\Classes\DevletIhale2886.Document\shell\open" "" "Devlet İhale 2886 ile Aç"
  WriteRegStr HKCU "Software\Classes\DevletIhale2886.Document\shell\open\command" "" '"$INSTDIR\DEVLETIHALE2886.exe" "%1"'

  ; --- 2. .ihale2886 Uzantısı İlişkilendirmesi ---
  ReadRegStr $0 HKCU "Software\Classes\.ihale2886" ""
  ${If} $0 == ""
  ${OrIf} $0 == "DevletIhale2886.Document"
    WriteRegStr HKCU "Software\Classes\.ihale2886" "" "DevletIhale2886.Document"
  ${EndIf}
  WriteRegStr HKCU "Software\Classes\.ihale2886" "Content Type" "application/x-ihale2886"
  WriteRegStr HKCU "Software\Classes\.ihale2886\OpenWithProgids" "DevletIhale2886.Document" ""
  WriteRegStr HKCU "Software\Classes\.ihale2886\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Classes\.ihale2886\ShellNew" "NullFile" ""
  WriteRegStr HKCU "Software\Classes\.ihale2886\ShellNew" "ItemName" "Devlet İhale 2886 Proje Dosyası"
  WriteRegStr HKCU "Software\Classes\.ihale2886\ShellNew" "IconPath" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.ihale2886\OpenWithProgids" "DevletIhale2886.Document" ""

  ; --- 3. .dihale Alternatif Uzantısı İlişkilendirmesi ---
  ReadRegStr $0 HKCU "Software\Classes\.dihale" ""
  ${If} $0 == ""
  ${OrIf} $0 == "DevletIhale2886.Document"
    WriteRegStr HKCU "Software\Classes\.dihale" "" "DevletIhale2886.Document"
  ${EndIf}
  WriteRegStr HKCU "Software\Classes\.dihale" "Content Type" "application/x-dihale"
  WriteRegStr HKCU "Software\Classes\.dihale\OpenWithProgids" "DevletIhale2886.Document" ""
  WriteRegStr HKCU "Software\Classes\.dihale\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.dihale\OpenWithProgids" "DevletIhale2886.Document" ""

  ; --- 4. Applications Kaydı (Birlikte Aç menüsü) ---
  WriteRegStr HKCU "Software\Classes\Applications\DEVLETIHALE2886.exe" "FriendlyAppName" "DEVLET İHALE 2886"
  WriteRegStr HKCU "Software\Classes\Applications\DEVLETIHALE2886.exe\DefaultIcon" "" "$INSTDIR\resources\icon.ico"
  WriteRegStr HKCU "Software\Classes\Applications\DEVLETIHALE2886.exe\shell\open\command" "" '"$INSTDIR\DEVLETIHALE2886.exe" "%1"'
  WriteRegStr HKCU "Software\Classes\Applications\DEVLETIHALE2886.exe\SupportedTypes" ".ihale2886" ""
  WriteRegStr HKCU "Software\Classes\Applications\DEVLETIHALE2886.exe\SupportedTypes" ".dihale" ""

  ; --- 5. Windows Explorer İkon ve İlişkilendirme Önbelleğini Yenile ---
  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend

!macro customUnInstall
  ; =========================================================================
  ; DEVLET İHALE 2886 — Güvenli ve İzole Kaldırma
  ; Yalnızca bu uygulamanın oluşturduğu kayıtları siler.
  ; Temin 360 veya İhale 360 kayıtlarını ASLA silmez.
  ; =========================================================================

  ; 1. ProgID ve Uygulama Kayıtlarını Temizle
  DeleteRegKey HKCU "Software\Classes\DevletIhale2886.Document"
  DeleteRegKey HKCU "Software\Classes\Applications\DEVLETIHALE2886.exe"

  ; 2. OpenWithProgids Altındaki Değerlerimizi Kaldır
  DeleteRegValue HKCU "Software\Classes\.ihale2886\OpenWithProgids" "DevletIhale2886.Document"
  DeleteRegValue HKCU "Software\Classes\.dihale\OpenWithProgids" "DevletIhale2886.Document"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.ihale2886\OpenWithProgids" "DevletIhale2886.Document"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Explorer\FileExts\.dihale\OpenWithProgids" "DevletIhale2886.Document"

  ; 3. .ihale2886 / .dihale Varsayılanı Biz İdiysek Temizle
  ReadRegStr $0 HKCU "Software\Classes\.ihale2886" ""
  ${If} $0 == "DevletIhale2886.Document"
    DeleteRegValue HKCU "Software\Classes\.ihale2886" ""
    DeleteRegKey HKCU "Software\Classes\.ihale2886\ShellNew"
    DeleteRegKey HKCU "Software\Classes\.ihale2886\DefaultIcon"
  ${EndIf}

  ReadRegStr $0 HKCU "Software\Classes\.dihale" ""
  ${If} $0 == "DevletIhale2886.Document"
    DeleteRegValue HKCU "Software\Classes\.dihale" ""
    DeleteRegKey HKCU "Software\Classes\.dihale\DefaultIcon"
  ${EndIf}

  ; 4. Windows Explorer İkon ve İlişkilendirme Önbelleğini Yenile
  System::Call 'shell32.dll::SHChangeNotify(i 0x08000000, i 0, i 0, i 0)'
!macroend
