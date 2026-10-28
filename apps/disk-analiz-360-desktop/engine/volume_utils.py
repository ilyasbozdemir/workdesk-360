# -*- coding: utf-8 -*-
"""
Arşiv 360 - Birim ve Dosya Kimliği Yardımcıları (Volume & File Identity)
Windows NTFS ve diğer dosya sistemlerinde kararlı kimlik tespiti için ctypes tabanlı araçlar.
"""

import os
import ctypes
from ctypes import wintypes
from dataclasses import dataclass
from typing import Optional


@dataclass
class VolumeInfo:
    guid: str                    # \\?\Volume{...}\
    serial_number: int           # NTFS Birim Seri No (st_dev veya API)
    serial_hex: str              # 0x...
    drive_letter: str            # C:, D: vb.
    label: str                   # Birim Etiketi
    filesystem: str              # NTFS, FAT32, exFAT vb.
    total_bytes: int
    free_bytes: int
    is_system_volume: bool


def get_volume_guid(drive_path: str) -> str:
    """
    Sürücü harfi (örn: 'C:\\') için kararlı Windows Volume GUID döndürür.
    Harf değişse bile GUID aynı kalır.
    """
    clean_path = drive_path.rstrip("\\/") + "\\"
    buf = ctypes.create_unicode_buffer(100)
    kernel32 = ctypes.windll.kernel32
    if kernel32.GetVolumeNameForVolumeMountPointW(clean_path, buf, 100):
        return buf.value
    # Fallback: Eğer API hata verirse sürücü kökünü döndür
    return clean_path


def get_volume_info(drive_letter_or_path: str) -> VolumeInfo:
    """
    Verilen sürücü için tam birim bilgilerini (GUID, Seri No, Dosya Sistemi, Alan) çeker.
    """
    root = drive_letter_or_path[:2].upper() + "\\"
    guid = get_volume_guid(root)

    vol_name = ctypes.create_unicode_buffer(261)
    fs_name = ctypes.create_unicode_buffer(261)
    serial = ctypes.c_ulong()
    kernel32 = ctypes.windll.kernel32

    kernel32.GetVolumeInformationW(
        root,
        vol_name,
        261,
        ctypes.byref(serial),
        None,
        None,
        fs_name,
        261
    )

    # Disk Alan Bilgileri
    free_bytes_avail = ctypes.c_ulonglong()
    total_bytes = ctypes.c_ulonglong()
    total_free = ctypes.c_ulonglong()

    kernel32.GetDiskFreeSpaceExW(
        root,
        ctypes.byref(free_bytes_avail),
        ctypes.byref(total_bytes),
        ctypes.byref(total_free)
    )

    # Aktif Windows sürücüsü tespiti
    windir = os.environ.get("WINDIR", "C:\\Windows")
    is_sys = root.lower().startswith(windir[:2].lower())

    return VolumeInfo(
        guid=guid,
        serial_number=serial.value,
        serial_hex=hex(serial.value),
        drive_letter=root[:2],
        label=vol_name.value or "",
        filesystem=fs_name.value or "UNKNOWN",
        total_bytes=total_bytes.value,
        free_bytes=total_free.value,
        is_system_volume=is_sys
    )


def get_file_identity(stat_result) -> tuple[int, int]:
    """
    os.stat sonucundan Windows NTFS dosya kimliğini (st_ino) ve birim seri numarasını (st_dev) döner.
    """
    return (getattr(stat_result, "st_dev", 0), getattr(stat_result, "st_ino", 0))
