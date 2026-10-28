#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Disk Analiz 360 & Arşiv 360 - Native Win32 + os.scandir Envanter ve Koruma Tarayıcısı (CLI)
Kullanım:
  python inventory_cli.py D:\
"""

import os
import sys
import time
from pathlib import Path

for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, "reconfigure"):
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

ROOT_DIR = Path(__file__).parent.resolve()
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from engine.volume_utils import get_volume_info
from engine.protection_engine import ProtectionEngine
from engine.index_db import IndexDatabase
from engine.inventory import crawl_and_index


def format_size(b: int) -> str:
    if b <= 0:
        return "0 B"
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if b < 1024.0:
            return f"{b:.2f} {unit}"
        b /= 1024.0
    return f"{b:.2f} PB"


def main():
    target = sys.argv[1] if len(sys.argv) > 1 else "D:\\"
    if not os.path.exists(target):
        target = str(ROOT_DIR)

    print("=" * 68, flush=True)
    print("  DİSK ANALİZ 360 — NATIVE WIN32 & OS.SCANDIR HIZLI ENVANTER MOTORU", flush=True)
    print("=" * 68, flush=True)
    print(f"Hedef Dizin : {target}", flush=True)

    drive_root = str(Path(target).resolve())[:2].upper() + "\\"
    vol = get_volume_info(drive_root)
    print(
        f"Birim GUID  : {vol.guid}\n"
        f"Seri No     : {vol.serial_hex} | Dosya Sistemi: {vol.filesystem} | Etiket: {vol.label}\n"
        f"Kapasite    : Toplam {format_size(vol.total_bytes)} / Boş {format_size(vol.free_bytes)} "
        f"({'Sistem Diski' if vol.is_system_volume else 'Veri/Arşiv Diski'})",
        flush=True,
    )
    print("-" * 68, flush=True)

    db_path = str(ROOT_DIR / "arsiv360_index.db")
    db = IndexDatabase(db_path)
    prot = ProtectionEngine()

    def on_progress(files_count: int, bytes_count: int, current_folder: str):
        short_folder = current_folder if len(current_folder) < 55 else "..." + current_folder[-52:]
        print(
            f"  [TARANIYOR] {files_count:,} dosya ({format_size(bytes_count)}) -> {short_folder}",
            flush=True,
        )

    try:
        res = crawl_and_index(
            target_path=target,
            db=db,
            protection_engine=prot,
            batch_size=3000,
            progress_callback=on_progress,
        )
        stats = db.get_stats()
        print("-" * 68, flush=True)
        print(f"✓ Envanter Tamamlandı! Süre: {res['elapsed_seconds']} sn ({res['files_per_second']:,} dosya/sn)", flush=True)
        print(f"✓ Taranan Dosya : {res['total_files']:,} adet ({format_size(res['total_bytes'])})", flush=True)
        print(f"✓ Kritik Sistem Korumalı (Seviye 2 Veto) : {stats['protected_critical']:,} dosya", flush=True)
        print(f"✓ SQLite WAL İndeksi : {db_path}", flush=True)
    finally:
        db.close()


if __name__ == "__main__":
    main()

