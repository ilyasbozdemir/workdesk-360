# -*- coding: utf-8 -*-
"""
Arşiv 360 - Faz 1 & Güvenlik Bulguları Otomatik Doğrulama ve Performans Testi
- Volume GUID ve File ID doğrulaması
- 3 Seviyeli Koruma Motoru ve Yanlış Pozitif (Anti-False-Positive) testleri
- İşlem anında Güvenlik Veto (Defense in Depth) testi
- SQLite WAL modunda toplu kayıt ve sayfalanmış arama testi
- İzole geçici klasörde os.scandir envanterleme testi
- Scanner.py: Metadata-doğrulamalı hash önbelleği, TOCTOU koruması, 0 bayt gruplama ve hata izleme testi
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
from scanner import (
    is_cache_entry_valid,
    get_cached_hash,
    get_quick_sample_hash_verified,
    get_full_hash_verified,
    scan_subtree,
)


def test_volume_utils():
    print("[1/6] Birim ve Dosya Kimliği Testi (Volume & File ID)...", flush=True)
    vol = get_volume_info("C:\\")
    assert vol.guid.startswith("\\\\?\\Volume"), f"Geçersiz Volume GUID: {vol.guid}"
    assert vol.filesystem == "NTFS", f"Beklenen NTFS, alınan: {vol.filesystem}"
    assert vol.is_system_volume is True, "C: sistem birimi olarak algılanmalı"
    print(f"  ✓ Sürücü: {vol.drive_letter} | GUID: {vol.guid} | Seri: {vol.serial_hex} | FS: {vol.filesystem}")


def test_protection_classifier():
    print("[2/6] Koruma Motoru ve Yanlış Pozitif (Anti-False-Positive) Testi...", flush=True)
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
    print("[3/6] İşlem Anında Güvenlik Kalkanı (Defense in Depth / Veto) Testi...", flush=True)
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
    print("[4/6] SQLite WAL Modu, Toplu Kayıt (Batch) ve Sayfalı Arama Testi...", flush=True)
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
    print("[5/6] İzole Klasör Üzerinde os.scandir Envanterleme ve Koruma Testi...", flush=True)
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


def test_scanner_cache_toctou_and_zero_byte():
    print("[6/6] Scanner.py: Hash Önbellek Doğrulaması, TOCTOU Koruması ve 0-Bayt Gruplama Testi...", flush=True)

    # 1. Eski (salt metin) ve değişmiş metadata önbellek doğrulaması (Bulgu #2)
    assert is_cache_entry_valid("deadbeef" * 8, 1024, 123456789) is False, "Eski string önbellek kaydı reddedilmeli!"
    valid_entry = {"hash": "a" * 64, "size": 1024, "mtime_ns": 999888777}
    assert is_cache_entry_valid(valid_entry, 1024, 999888777) is True, "Geçerli önbellek kaydı kabul edilmeli!"
    assert is_cache_entry_valid(valid_entry, 2048, 999888777) is False, "Boyutu değişmiş önbellek kaydı reddedilmeli!"
    assert is_cache_entry_valid(valid_entry, 1024, 111222333) is False, "mtime_ns değişmiş önbellek kaydı reddedilmeli!"

    # 2. TOCTOU (Dosya taranırken değiştirilirse doğrulama) ve 0-bayt dosya tespiti (Bulgu #2, #4, #5, #6)
    with tempfile.TemporaryDirectory() as tmpdir:
        f_normal = os.path.join(tmpdir, "ornek.bin")
        f_empty1 = os.path.join(tmpdir, "bos1.txt")
        f_empty2 = os.path.join(tmpdir, "bos2.txt")

        with open(f_normal, "wb") as fp:
            fp.write(b"WorkDesk 360 TOCTOU Test Content " * 100)
        open(f_empty1, "wb").close()
        open(f_empty2, "wb").close()

        st = os.stat(f_normal)

        # get_cached_hash diskteki gerçek dosya stat'ını da doğrular
        cache_map = {
            f_normal: {"hash": "c" * 64, "size": st.st_size, "mtime_ns": st.st_mtime_ns},
            f_empty1: "b" * 64,
        }
        assert get_cached_hash(cache_map, f_empty1, 0, 0) is None
        assert get_cached_hash(cache_map, f_normal, st.st_size, st.st_mtime_ns) == "c" * 64
        assert get_cached_hash(cache_map, f_normal, st.st_size, st.st_mtime_ns + 1) is None
        print("  ✓ Bulgu #2 doğrulandı: Eski string önbelleği ve mtime_ns/size uyuşmazlıkları reddediliyor.")

        # Doğru metadata ile örnek ve tam hash başarılı olmalı
        sh, s_err = get_quick_sample_hash_verified(f_normal, st.st_size, st.st_mtime_ns)
        assert sh is not None and s_err is None, f"Beklenmeyen örnek hash hatası: {s_err}"

        fh, f_err, v_mtime = get_full_hash_verified(f_normal, st.st_size, st.st_mtime_ns)
        assert fh is not None and f_err is None and v_mtime == st.st_mtime_ns, f"Beklenmeyen tam hash hatası: {f_err}"

        # Yanlış boyut veya yanlış mtime_ns verildiğinde TOCTOU hatası dönmeli
        sh_bad, s_err_bad = get_quick_sample_hash_verified(f_normal, st.st_size + 5, st.st_mtime_ns)
        assert sh_bad is None and s_err_bad == "TOCTOU_MODIFIED_BEFORE_SAMPLE", f"TOCTOU yakalanmadı: {s_err_bad}"

        fh_bad, f_err_bad, _ = get_full_hash_verified(f_normal, st.st_size, st.st_mtime_ns + 1000)
        assert fh_bad is None and f_err_bad == "TOCTOU_MODIFIED_BEFORE_FULL_HASH", f"TOCTOU yakalanmadı: {f_err_bad}"
        print("  ✓ Bulgu #6 doğrulandı: Tarama sırasında değişen dosyalar TOCTOU kontrolüyle yakalanıyor.")

        # scan_subtree 0 bayt dosyaları ve hata listesini döndürmeli
        size_map, zero_files, total_files, total_size, errors = scan_subtree(tmpdir)
        assert total_files == 3, f"Beklenen 3 dosya, bulunan: {total_files}"
        assert len(zero_files) == 2, f"2 adet 0-bayt dosya yakalanmalıydı, bulunan: {len(zero_files)}"
        assert errors == [], f"Hatasız klasörde hata çıkmamalıydı: {errors}"
        print("  ✓ Bulgu #4 ve #5 doğrulandı: 0-bayt dosyalar ayrı listeleniyor ve erişim hataları yapılandırılmış olarak izleniyor.")


def main():
    print("\n" + "=" * 65)
    print("  ARŞİV 360 - FAZ 1 & GÜVENLİK BULGULARI DOĞRULAMA TESTİ")
    print("=" * 65 + "\n")

    t_all = time.time()
    test_volume_utils()
    test_protection_classifier()
    test_protection_veto()
    test_sqlite_batch_and_query()
    test_isolated_crawler()
    test_scanner_cache_toctou_and_zero_byte()

    print("\n" + "=" * 65)
    print(f"  TÜM TESTLER BAŞARIYLA GEÇTİ! (Toplam Süre: {time.time() - t_all:.2f} sn)")
    print("=" * 65 + "\n")


if __name__ == "__main__":
    main()
