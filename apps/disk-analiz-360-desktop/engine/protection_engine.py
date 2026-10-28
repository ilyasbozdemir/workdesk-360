# -*- coding: utf-8 -*-
"""
Arşiv 360 - Bağımsız Sistem Koruma Motoru (Smart System Protection Engine)
3 Seviyeli Savunma, İmza Tabanlı Doğrulama ve Sahte Pozitifleri (False-Positive) Önleme.
"""

import os
import sys
from pathlib import PurePath, PureWindowsPath
from typing import Optional, Tuple


class SecurityViolationError(PermissionError):
    """Kritik sistem dosyasına müdahale edilmeye çalışıldığında fırlatılır."""
    pass


class ProtectionLevel:
    USER_DATA = 0          # 🟢 Normal Kullanıcı Verisi (Silme/Taşıma serbest)
    APP_SYSTEM_DATA = 1    # 🟡 Hassas Uygulama/Sistem Verisi (Çift onay ve uyarı gerekir)
    CRITICAL_SYSTEM = 2    # 🔴 Kritik Sistem Dosyası (İşlem KESİNLİKLE YASAK / VETO)


class ProtectionEngine:
    """
    Sürücü harfinden bağımsız çalışan, aktif ve ikincil işletim sistemi kurulumlarını,
    sistem bileşenlerini ve kritik dosyaları tanıyan koruma motoru.
    """

    CRITICAL_ROOT_FILES = {
        "pagefile.sys",
        "hiberfil.sys",
        "swapfile.sys",
        "dumpstack.log",
        "dumpstack.log.tmp",
        "bootmgr",
        "bootnxt",
        "boottel.dat"
    }

    CRITICAL_ROOT_DIRS = {
        "$recycle.bin",
        "system volume information",
        "recovery",
        "boot",
        "efi",
        "found.000",
        "found.001",
        "found.002"
    }

    APP_DATA_ROOT_DIRS = {
        "program files",
        "program files (x86)",
        "programdata",
        "msocache"
    }

    def __init__(self):
        # Aktif Windows kök dizini (örn: 'C:\Windows')
        self.active_windir = os.environ.get("WINDIR", "C:\\Windows").rstrip("\\/").lower()
        self.active_system_drive = self.active_windir[:2].upper() if len(self.active_windir) >= 2 else "C:"

    def is_valid_windows_installation(self, folder_path: str) -> bool:
        """
        Bir klasörün gerçekten çalışan ya da eski bir Windows işletim sistemi kurulumu
        olup olmadığını imza dosyalarını arayarak doğrular.
        """
        clean = folder_path.rstrip("\\/")
        p_clean = clean.lower()

        # Eğer zaten aktif Windows diziniyse doğrudan onaylı
        if p_clean == self.active_windir:
            return True

        # İmza Dosyaları:
        # 1. explorer.exe
        # 2. System32\ntoskrnl.exe veya System32\kernel32.dll
        # 3. System32\config\SYSTEM (Registry kovanı)
        sig_explorer = os.path.join(clean, "explorer.exe")
        sig_kernel = os.path.join(clean, "System32", "ntoskrnl.exe")
        sig_dll = os.path.join(clean, "System32", "kernel32.dll")
        sig_reg = os.path.join(clean, "System32", "config", "SYSTEM")

        has_explorer = os.path.exists(sig_explorer)
        has_kernel = os.path.exists(sig_kernel) or os.path.exists(sig_dll)
        has_reg = os.path.exists(sig_reg)

        # En az iki temel imzanın bulunması gerekir
        return (has_explorer and has_kernel) or (has_kernel and has_reg)

    def classify_path(self, target_path: str) -> Tuple[int, str]:
        """
        Verilen dosya veya klasör yolunu 3 seviyeli koruma kategorisine ayırır.
        Dönüş: (ProtectionLevel, Açıklama/Gerekçe)
        """
        if not target_path:
            return ProtectionLevel.USER_DATA, "Geçersiz Yol"

        wp = PureWindowsPath(target_path)
        parts = [p.lower() for p in wp.parts]

        # Sürücü kökü mü? (örn: ['c:\\'])
        if len(parts) <= 1:
            return ProtectionLevel.CRITICAL_SYSTEM, "Sürücü Kökü"

        drive_part = parts[0]       # 'c:\\'
        first_dir = parts[1]        # sürücünün hemen altındaki ilk klasör veya dosya
        filename = wp.name.lower()

        # -------------------------------------------------------------
        # 1. KONTROL: Sürücü Kökündeki Kritik Sistem Dosyaları
        # (Örn: C:\pagefile.sys, D:\bootmgr)
        # -------------------------------------------------------------
        if len(parts) == 2 and filename in self.CRITICAL_ROOT_FILES:
            return ProtectionLevel.CRITICAL_SYSTEM, f"Kritik Sistem Dosyası ({filename})"

        # -------------------------------------------------------------
        # 2. KONTROL: Sürücü Kökündeki Özel Sistem Klasörleri
        # (Örn: C:\$Recycle.Bin, D:\System Volume Information)
        # -------------------------------------------------------------
        if first_dir in self.CRITICAL_ROOT_DIRS:
            return ProtectionLevel.CRITICAL_SYSTEM, f"Sistem Koruma Dizini ({first_dir})"

        # -------------------------------------------------------------
        # 3. KONTROL: Windows Kurulum Klasörü (Aktif veya İkincil OS)
        # SADECE sürücü kökündeki 'Windows' veya 'WinNT' klasörü değerlendirilir!
        # D:\Projeler\Windows\app.exe yolu ASLA buraya takılmaz!
        # -------------------------------------------------------------
        if first_dir in ("windows", "winnt"):
            # Kök düzeyindeki Windows klasörünün tam yolu (örn: 'D:\Windows')
            potential_os_root = str(PureWindowsPath(drive_part, parts[1]))

            # Gerçekten Windows mu (imza kontrolü)?
            if self.is_valid_windows_installation(potential_os_root):
                return ProtectionLevel.CRITICAL_SYSTEM, f"İşletim Sistemi Dizini ({potential_os_root})"
            else:
                # 'Windows' adında ama içinde explorer.exe / ntoskrnl.exe olmayan sahte/kullanıcı klasörü
                # Güvenli tarafta kalmak için Seviye 1 (Uygulama/Sistem) olarak etiketlenir
                return ProtectionLevel.APP_SYSTEM_DATA, f"Doğrulanmamış Kök Windows Klasörü ({first_dir})"

        # -------------------------------------------------------------
        # 4. KONTROL: Program Files ve Sistem Veri Dizinleri (Seviye 1)
        # SADECE sürücü kökündeki 'Program Files', 'ProgramData' vb.
        # -------------------------------------------------------------
        if first_dir in self.APP_DATA_ROOT_DIRS:
            return ProtectionLevel.APP_SYSTEM_DATA, f"Kurulu Yazılım Dizini ({first_dir})"

        # -------------------------------------------------------------
        # 5. KONTROL: Kullanıcı Profili İçindeki Hassas Sistem Verileri
        # (Örn: C:\Users\<kullanıcı>\AppData\Local\...)
        # -------------------------------------------------------------
        if first_dir == "users" and len(parts) >= 4:
            # parts[0]=C:\, parts[1]=users, parts[2]=kullanıcı_adı, parts[3]=appdata
            if parts[3] in ("appdata", "local settings", "application data"):
                return ProtectionLevel.APP_SYSTEM_DATA, "Kullanıcı Uygulama Verisi (AppData)"

        # -------------------------------------------------------------
        # 6. VARSAYILAN: Normal Kullanıcı Verisi (Seviye 0)
        # D:\Projeler\Windows, E:\Yedek\system32.txt, C:\Belgelerim vb.
        # -------------------------------------------------------------
        return ProtectionLevel.USER_DATA, "Kullanıcı Verisi"

    def assert_can_delete_or_move(self, target_path: str) -> None:
        """
        Fiziksel silme veya taşıma öncesi zorunlu güvenlik kalkanı (VETO).
        Eğer hedef dosya veya klasör Seviye 2 (Kritik Sistem) ise istisna fırlatır!
        """
        level, reason = self.classify_path(target_path)
        if level == ProtectionLevel.CRITICAL_SYSTEM:
            raise SecurityViolationError(
                f"[GÜVENLİK ENGELİ] Bu işlem engellendi! Hedef yol kritik sistem koruması altındadır.\n"
                f"Yol: {target_path}\n"
                f"Gerekçe: {reason}"
            )
