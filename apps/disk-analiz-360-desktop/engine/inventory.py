# -*- coding: utf-8 -*-
"""
Arşiv 360 - Yüksek Hızlı Envanterleyici (Fast Inventory Crawler)
os.scandir tabanlı, bellek şişirmeyen, mikro-paketli (batch) SQLite yazıcısı.
"""

import os
import time
from pathlib import Path
from typing import Optional, Callable
from .volume_utils import get_volume_info
from .protection_engine import ProtectionEngine
from .index_db import IndexDatabase


def crawl_and_index(
    target_path: str,
    db: IndexDatabase,
    protection_engine: ProtectionEngine,
    batch_size: int = 3000,
    progress_callback: Optional[Callable[[int, int, str], None]] = None
) -> dict:
    """
    Belirtilen kök yolu (sürücü veya klasör) os.scandir ile derinlemesine tarar,
    koruma seviyesini belirler ve bellek şişmeden mikro-paketler halinde SQLite'a yazar.

    progress_callback formatı: (toplam_dosya, toplam_bayt, son_taranan_klasor)
    """
    target_abs = str(Path(target_path).resolve())
    drive_root = target_abs[:2].upper() + "\\"
    
    # 1. Birim bilgisini al ve kaydet
    vol_info = get_volume_info(drive_root)
    db.save_volume(vol_info)

    vol_guid = vol_info.guid
    total_files = 0
    total_bytes = 0
    batch = []
    t_start = time.time()

    stack = [target_abs]

    while stack:
        current_dir = stack.pop()
        try:
            with os.scandir(current_dir) as entries:
                for entry in entries:
                    # Sembolik bağlantıları ve junction döngülerini takip etme
                    try:
                        if entry.is_symlink():
                            continue
                    except (PermissionError, OSError):
                        continue

                    full_path = entry.path

                    # Klasör ise yığına ekle (sistem koruma dizinlerinin altını da gerekirse gezer)
                    try:
                        if entry.is_dir(follow_symlinks=False):
                            # $Recycle.Bin ve System Volume Information gibi yerlerin içine girmemek tercih edilebilir
                            name_lower = entry.name.lower()
                            if name_lower in ("$recycle.bin", "system volume information", "found.000", ".gemini"):
                                continue
                            stack.append(full_path)
                            continue
                    except (PermissionError, OSError):
                        continue

                    # Dosya ise üstveri al
                    try:
                        st = entry.stat(follow_symlinks=False)
                        size = st.st_size
                        mtime_ns = getattr(st, "st_mtime_ns", int(st.st_mtime * 1e9))
                        attrs = getattr(st, "st_file_attributes", 0)
                        # Windows'ta entry.stat().st_ino 0 dönebilir; gerçek NTFS File ID için os.stat çağrılır:
                        file_id = getattr(st, "st_ino", 0)
                        if file_id == 0:
                            try:
                                file_id = os.stat(full_path).st_ino
                            except Exception:
                                file_id = 0
                    except (PermissionError, OSError):
                        continue

                    filename = entry.name
                    ext = os.path.splitext(filename)[1].lower()

                    # Koruma Sınıflandırması
                    prot_level, prot_reason = protection_engine.classify_path(full_path)

                    batch.append((
                        file_id,
                        vol_guid,
                        current_dir,
                        filename,
                        full_path,
                        ext,
                        size,
                        mtime_ns,
                        attrs,
                        prot_level,
                        prot_reason
                    ))

                    total_files += 1
                    total_bytes += size

                    # Batch dolduğunda doğrudan SQLite'a boşalt (RAM dostu)
                    if len(batch) >= batch_size:
                        db.insert_files_batch(batch)
                        batch.clear()
                        if progress_callback:
                            progress_callback(total_files, total_bytes, current_dir)

        except (PermissionError, OSError):
            continue

    # Kalan son paketi yaz
    if batch:
        db.insert_files_batch(batch)
        batch.clear()

    elapsed = time.time() - t_start
    if progress_callback:
        progress_callback(total_files, total_bytes, "Tamamlandı")

    return {
        "total_files": total_files,
        "total_bytes": total_bytes,
        "elapsed_seconds": round(elapsed, 2),
        "files_per_second": round(total_files / elapsed, 1) if elapsed > 0 else total_files,
        "volume_guid": vol_guid
    }
