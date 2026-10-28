# -*- coding: utf-8 -*-
"""
Arşiv 360 - Faz 1 Otomatik Doğrulama ve Performans Testi
- Volume GUID ve File ID doğrulaması
- 3 Seviyeli Koruma Motoru ve Yanlış Pozitif (Anti-False-Positive) testleri
- İşlem anında Güvenlik Veto (Defense in Depth) testi
- SQLite WAL modunda toplu kayıt ve sayfalanmış arama testi
- İzole geçici klasörde os.scandir envanterleme testi
"""

import os
import sys
import tempfile
import time
from pathlib import Path

# Windows konsolunda Unicode karakterlerin (✓ vb.) çökmesini engelle
for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, "reconfigure"):
        try: _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception: pass

# Proje kök dizinini sys.path'e ekle
ROOT_DIR = Path(__file__).parent.parent.resolve()
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from engine.volume_utils import get_volume_info, get_file_identity
from engine.protection_engine import ProtectionEngine, ProtectionLevel, SecurityViolationError
from engine.index_db import IndexDatabase
from engine.inventory import crawl_and_index


def test_volume_utils():
    print("[1/5] Birim ve Dosya Kimliği Testi (Volume & File ID)...", flush=True)
    vol = get_volume_info("C:\\")
    assert vol.guid.startswith("\\\\?\\Volume"), f"Geçersiz Volume GUID: {vol.guid}"
    assert vol.filesystem == "NTFS", f"Beklenen NTFS, alınan: {vol.filesystem}"
    assert vol.is_system_volume is True, "C: sistem birimi olarak algılanmalı"
    print(f"  ✓ Sürücü: {vol.drive_letter} | GUID: {vol.guid} | Seri: {vol.serial_hex} | FS: {vol.filesystem}")


def test_protection_classifier():
    print("[2/5] Koruma Motoru ve Yanlış Pozitif (Anti-False-Positive) Testi...", flush=True)
    engine = ProtectionEngine()

    # --- A) Yanlış Pozitif Testleri (Bunlar KESİNLİKLE Kullanıcı Verisi - Seviye 0 olmalı) ---
    false_positive_cases = [
        r"D:\Projeler\Windows_App\src\main.rs",
        r"E:\Yedekler\Windows_Arsiv\dosya.pdf",
        r"C:\Users\test\Belgelerim\system32.txt",
        r"D:\Kodlama\System32_Tools\script.py",
        r"E:\Fotoğraflar\2024\tatil.jpg",
    ]
    for path in false_positive_cases:
        level, reason = engine.classify_path(path)
        assert level == ProtectionLevel.USER_DATA, (
            f"HATA: '{path}' yanlışlıkla korumaya alındı! Seviye: {level}, Gerekçe: {reason}"
        )
    print("  ✓ 5 adet yanıltıcı kullanıcı yolu (örn: D:\\Projeler\\Windows) başarıyla Seviye 0 (Kullanıcı Verisi) olarak tescillendi.")

    # --- B) Gerçek Sistem Dosyası Testleri (Seviye 2 - Kritik Sistem olmalı) ---
    critical_cases = [
        r"C:\Windows\System32\ntoskrnl.exe",
        r"C:\Windows\explorer.exe",
        r"C:\pagefile.sys",
        r"C:\$Recycle.Bin\S-1-5-21\dosya.exe",
        r"D:\System Volume Information\indexer.dat",
    ]
    for path in critical_cases:
        level, reason = engine.classify_path(path)
        assert level == ProtectionLevel.CRITICAL_SYSTEM, (
            f"HATA: Kritik sistem dosyası korunamadı! Yol: '{path}', Seviye: {level}"
        )
    print("  ✓ 5 adet kritik sistem yolu (örn: C:\\Windows\\System32, C:\\pagefile.sys) başarıyla Seviye 2 (Korumalı) olarak tescillendi.")

    # --- C) Kurulu Uygulama / Sistem Verisi (Seviye 1) ---
    app_cases = [
        r"C:\Program Files\Google\Chrome\Application\chrome.exe",
        r"C:\Program Files (x86)\Steam\steam.exe",
        r"C:\ProgramData\Package Cache\setup.exe",
        r"C:\Users\test\AppData\Local\Temp\cache.dat",
    ]
    for path in app_cases:
        level, reason = engine.classify_path(path)
        assert level == ProtectionLevel.APP_SYSTEM_DATA, (
            f"HATA: Uygulama verisi yanlış sınıflandırıldı! Yol: '{path}', Seviye: {level}"
        )
    print("  ✓ 4 adet uygulama/veri yolu (Program Files, AppData) başarıyla Seviye 1 (Onay Gerekir) olarak tescillendi.")


def test_protection_veto():
    print("[3/5] İşlem Anında Güvenlik Kalkanı (Defense in Depth / Veto) Testi...", flush=True)
    engine = ProtectionEngine()

    # Kullanıcı dosyası silme denemesi: Başarılı olmalı (istisna yok)
    try:
        engine.assert_can_delete_or_move(r"D:\Belgelerim\rapor.docx")
        print("  ✓ Kullanıcı dosyası için işlem onaylandı.")
    except SecurityViolationError:
        assert False, "Kullanıcı verisi için veto fırlatılmamalı!"

    # Kritik sistem dosyası silme denemesi: SecurityViolationError fırlatmalı!
    veto_worked = False
    try:
        engine.assert_can_delete_or_move(r"C:\Windows\System32\kernel32.dll")
    except SecurityViolationError as e:
        veto_worked = True
        print(f"  ✓ Veto başarıyla devreye girdi ve silmeyi engelledi:\n    -> {e}")

    assert veto_worked, "Kritik sistem dosyasında veto çalışmadı!"


def test_sqlite_batch_and_query():
    print("[4/5] SQLite WAL Modu, Toplu Kayıt (Batch) ve Sayfalı Arama Testi...", flush=True)
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = os.path.join(tmpdir, "test_index.db")
        db = IndexDatabase(db_path)

        vol = get_volume_info("C:\\")
        db.save_volume(vol)

        # 10.000 adet sentetik kayıt üret
        N = 10000
        records = []
        for i in range(N):
            records.append((
                100000 + i,                   # file_id
                vol.guid,                     # volume_guid
                f"C:\\Projeler\\Modul_{i % 50}",
                f"dosya_{i}.pdf" if i % 2 == 0 else f"cizim_{i}.dwg",
                f"C:\\Projeler\\Modul_{i % 50}\\dosya_{i}.pdf",
                ".pdf" if i % 2 == 0 else ".dwg",
                (i + 1) * 1024,               # size_bytes
                int(time.time() * 1e9),       # mtime_ns
                32,                           # attrs (ARCHIVE)
                0,                            # protection_level (User Data)
                "Kullanıcı Verisi"
            ))

        t0 = time.time()
        inserted = db.insert_files_batch(records)
        elapsed = time.time() - t0
        speed = round(inserted / elapsed) if elapsed > 0 else inserted

        assert inserted == N, f"Beklenen {N}, eklenen {inserted}"
        print(f"  ✓ {N} kayıt SQLite WAL modunda {elapsed:.3f} sn'de yazıldı ({speed:,} kayıt/sn).")

        # Sayfalı Arama Testi (Limit 10, Offset 0)
        results = db.query_files(search_query="cizim", limit=10, offset=0)
        assert len(results) == 10, f"Sayfalama başarısız, gelen kayıt sayısı: {len(results)}"
        assert results[0]["extension"] == ".dwg", "Uzantı araması uyuşmadı"
        print(f"  ✓ Sayfalı arama çalıştı: İlk sonuç `{results[0]['filename']}` ({results[0]['size_bytes']} bayt)")

        stats = db.get_stats()
        assert stats["total_files"] == N, "İstatistik dosya sayısı uyuşmadı"
        print(f"  ✓ İstatistikler: Toplam {stats['total_files']} dosya, {stats['total_bytes'] / (1024*1024):.2f} MB")
        db.close()


def test_isolated_crawler():
    print("[5/5] İzole Klasör Üzerinde os.scandir Envanterleme ve Koruma Testi...", flush=True)
    with tempfile.TemporaryDirectory() as tmp_scan_dir, tempfile.TemporaryDirectory() as tmp_db_dir:
        # Geçici bir klasör yapısı kur
        proj_dir = os.path.join(tmp_scan_dir, "Projeler", "Windows_Sistemi")
        docs_dir = os.path.join(tmp_scan_dir, "Belgeler")
        os.makedirs(proj_dir, exist_ok=True)
        os.makedirs(docs_dir, exist_ok=True)

        # Dosyalar oluştur
        f1 = os.path.join(proj_dir, "kod.py")
        f2 = os.path.join(proj_dir, "system32_analiz.txt")
        f3 = os.path.join(docs_dir, "ihale.pdf")

        for f, content in [(f1, "print('merhaba')"), (f2, "test"), (f3, "%PDF-1.4 dummy")]:
            with open(f, "w", encoding="utf-8") as fp:
                fp.write(content)

        db_path = os.path.join(tmp_db_dir, "inventory_test.db")
        db = IndexDatabase(db_path)
        engine = ProtectionEngine()

        try:
            result = crawl_and_index(tmp_scan_dir, db, engine, batch_size=100)
            assert result["total_files"] == 3, f"Beklenen 3 dosya, taranan: {result['total_files']}"
            print(f"  ✓ İzole tarama tamamlandı: {result['total_files']} dosya ({result['elapsed_seconds']} sn)")

            items = db.query_files(search_query="kod.py")
            assert len(items) == 1, "kod.py bulunamadı"
            assert items[0]["protection_level"] != ProtectionLevel.CRITICAL_SYSTEM, (
                "HATA: Proje altındaki dosya yanlışlıkla kritik sistem sanıldı!"
            )
            print("  ✓ Doğrulandı: `Windows_Sistemi` klasöründeki `kod.py` asla Seviye 2 (Kritik Sistem) yapılmadı.")
        finally:
            db.close()


def main():
    print("\n" + "=" * 65)
    print("  ARŞİV 360 - FAZ 1 DOĞRULAMA VE ENTEGRASYON TESTİ")
    print("=" * 65 + "\n")

    t_all = time.time()
    test_volume_utils()
    test_protection_classifier()
    test_protection_veto()
    test_sqlite_batch_and_query()
    test_isolated_crawler()

    print("\n" + "=" * 65)
    print(f"  TÜM TESTLER BAŞARIYLA GEÇTİ! (Toplam Süre: {time.time() - t_all:.2f} sn)")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
