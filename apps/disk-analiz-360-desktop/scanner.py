import os
import sys
import hashlib
import time
import json
from collections import defaultdict
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# Windows konsolunda Unicode karakterlerin (✓ vb.) çökmesini engelle
for _s in (sys.stdout, sys.stderr):
    if hasattr(_s, "reconfigure"):
        try:
            _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass

TARGET_DRIVES = [d for d in ["C:\\", "D:\\", "E:\\"] if os.path.exists(d)]

EXCLUDE_DIRS = {
    "$recycle.bin",
    "system volume information",
    "found.000",
    "found.001",
    "found.002",
    ".trashes",
    ".gemini",
}

EXCLUDE_FILES = {
    "pagefile.sys",
    "hiberfil.sys",
    "swapfile.sys",
    "dumpstack.log",
    "dumpstack.log.tmp",
    "boottel.dat",
}

EMPTY_FILE_SHA256 = "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"


def format_size(size_bytes):
    if size_bytes == 0:
        return "0 B"
    units = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    size = float(size_bytes)
    while size >= 1024.0 and i < len(units) - 1:
        size /= 1024.0
        i += 1
    return f"{size:.2f} {units[i]}"


def format_drives_title(scanned_drives):
    if not scanned_drives:
        return "Tüm Sürücüler"
    clean = [d.rstrip("\\/") for d in scanned_drives]
    if all(len(d) == 2 and d[1] == ":" for d in clean):
        if len(clean) == 1:
            return f"{clean[0]} Diski"
        elif len(clean) == 2:
            return f"{clean[0]} & {clean[1]} Diskleri"
        else:
            return f"{', '.join(clean[:-1])} & {clean[-1]} Diskleri"
    if len(clean) == 1:
        return f"{clean[0]}"
    elif len(clean) == 2:
        return f"{clean[0]} & {clean[1]}"
    else:
        return f"{clean[0]} ve {len(clean)-1} Diğer Dizin"


def _stat_signature(filepath):
    """Dosyanın güncel (size_bytes, mtime_ns) imzasını döner."""
    st = os.stat(filepath, follow_symlinks=False)
    mtime_ns = getattr(st, "st_mtime_ns", int(st.st_mtime * 1e9))
    return st.st_size, mtime_ns


def is_cache_entry_valid(entry, expected_size, expected_mtime_ns):
    """
    .scanner_cache.json kaydının geçerli olup olmadığını doğrular.
    Eski (sadece string hash içeren) kayıtlar veya boyutu/mtime_ns değeri değişmiş kayıtlar reddedilir.
    """
    if not isinstance(entry, dict):
        return False
    h = entry.get("hash")
    if not isinstance(h, str) or len(h) != 64:
        return False
    if entry.get("size") != expected_size:
        return False
    if entry.get("mtime_ns") != expected_mtime_ns:
        return False
    return True


def get_cached_hash(hash_cache, filepath, expected_size, expected_mtime_ns):
    """
    Önbellekteki hash değerini yalnızca dosya boyutu ve mtime_ns birebir eşleşiyorsa döner.
    Ayrıca diskteki güncel stat ile TOCTOU kontrolü yapar.
    """
    entry = hash_cache.get(filepath)
    if not is_cache_entry_valid(entry, expected_size, expected_mtime_ns):
        return None
    try:
        cur_size, cur_mtime_ns = _stat_signature(filepath)
        if cur_size != expected_size or cur_mtime_ns != expected_mtime_ns:
            return None
    except (PermissionError, OSError):
        return None
    return entry["hash"]


def get_quick_sample_hash_verified(filepath, expected_size, expected_mtime_ns=None):
    """
    128 KB ve altındaki dosyaların TAMAMINI okuyarak KESİN tam SHA-256 hash hesaplar.
    128 KB üzeri dosyalar için baş 64KB ve son 64KB okuyarak hızlı filtreleme yapar.
    Okuma öncesi ve sonrası stat kontrolü (TOCTOU) yapar.
    Dönüş: (hash_str_or_None, error_reason_or_None)
    """
    try:
        pre_size, pre_mtime_ns = _stat_signature(filepath)
        if pre_size != expected_size or (
            expected_mtime_ns is not None and pre_mtime_ns != expected_mtime_ns
        ):
            return None, "TOCTOU_MODIFIED_BEFORE_SAMPLE"

        with open(filepath, "rb") as f:
            h = hashlib.sha256()
            if expected_size <= 131072:
                data = f.read()
                if len(data) != expected_size:
                    return None, "TOCTOU_SIZE_MISMATCH_DURING_SAMPLE"
                h.update(data)
                digest = h.hexdigest()
            else:
                head = f.read(65536)
                h.update(head)
                f.seek(expected_size - 65536)
                tail = f.read(65536)
                h.update(tail)
                digest = h.hexdigest()

        post_size, post_mtime_ns = _stat_signature(filepath)
        if post_size != pre_size or post_mtime_ns != pre_mtime_ns:
            return None, "TOCTOU_MODIFIED_DURING_SAMPLE"

        return digest, None
    except PermissionError as e:
        return None, f"PermissionError: {e}"
    except OSError as e:
        return None, f"OSError: {e}"


def get_quick_sample_hash(filepath, file_size):
    """Geriye dönük uyumlu sarmalayıcı."""
    digest, _ = get_quick_sample_hash_verified(filepath, file_size, None)
    return digest


def get_full_hash_verified(filepath, expected_size=None, expected_mtime_ns=None, block_size=4 * 1024 * 1024):
    """
    4MB bloklarla tam SHA-256 hesaplar ve okuma öncesi/sonrası TOCTOU metadata doğrulaması yapar.
    Dönüş: (hash_str_or_None, error_reason_or_None, verified_mtime_ns_or_None)
    """
    h = hashlib.sha256()
    try:
        pre_size, pre_mtime_ns = _stat_signature(filepath)
        if expected_size is not None and pre_size != expected_size:
            return None, "TOCTOU_MODIFIED_BEFORE_FULL_HASH", None
        if expected_mtime_ns is not None and pre_mtime_ns != expected_mtime_ns:
            return None, "TOCTOU_MODIFIED_BEFORE_FULL_HASH", None

        bytes_read = 0
        with open(filepath, "rb") as f:
            while True:
                buf = f.read(block_size)
                if not buf:
                    break
                bytes_read += len(buf)
                h.update(buf)

        post_size, post_mtime_ns = _stat_signature(filepath)
        if bytes_read != pre_size or post_size != pre_size or post_mtime_ns != pre_mtime_ns:
            return None, "TOCTOU_MODIFIED_DURING_FULL_HASH", None

        return h.hexdigest(), None, post_mtime_ns
    except PermissionError as e:
        return None, f"PermissionError: {e}", None
    except OSError as e:
        return None, f"OSError: {e}", None


def get_full_hash(filepath, block_size=4 * 1024 * 1024):
    """Geriye dönük uyumlu sarmalayıcı."""
    digest, _, _ = get_full_hash_verified(filepath, None, None, block_size)
    return digest


def scan_subtree(root_path):
    """
    Bir alt klasör dalını os.scandir ile hızlı ve rekürsif tarar.
    Erişim hatalarını gizlemez; raporlanmak üzere local_errors listesinde döndürür.
    """
    local_size_to_files = defaultdict(list)  # sz -> list of (path, mtime_ns)
    local_zero_files = []  # list of (path, mtime_ns)
    local_count = 0
    local_bytes = 0
    local_errors = []

    stack = [root_path]
    while stack:
        curr = stack.pop()
        try:
            with os.scandir(curr) as it:
                for entry in it:
                    try:
                        if entry.is_symlink():
                            continue
                        name_l = entry.name.lower()
                        if (
                            entry.name.startswith("~$")
                            or name_l in EXCLUDE_FILES
                            or name_l.startswith("dumpstack")
                        ):
                            continue
                        if entry.is_dir(follow_symlinks=False):
                            if name_l in EXCLUDE_DIRS or entry.name.startswith("$"):
                                continue
                            stack.append(entry.path)
                        elif entry.is_file(follow_symlinks=False):
                            st = entry.stat(follow_symlinks=False)
                            sz = st.st_size
                            mtime_ns = getattr(st, "st_mtime_ns", int(st.st_mtime * 1e9))
                            local_count += 1
                            local_bytes += sz
                            if sz == 0:
                                local_zero_files.append((entry.path, mtime_ns))
                            else:
                                local_size_to_files[sz].append((entry.path, mtime_ns))
                    except (PermissionError, OSError) as e:
                        local_errors.append(
                            {
                                "path": entry.path,
                                "stage": "subtree_file_stat",
                                "error_type": type(e).__name__,
                                "message": str(e),
                            }
                        )
        except (PermissionError, OSError) as e:
            local_errors.append(
                {
                    "path": curr,
                    "stage": "subtree_dir_scan",
                    "error_type": type(e).__name__,
                    "message": str(e),
                }
            )

    return local_size_to_files, local_zero_files, local_count, local_bytes, local_errors


def discover_drive_branches(drive_path):
    """Sürücü kökündeki ana klasör dallarını, kök dosyalarını ve erişim hatalarını keşfeder."""
    subdirs = []
    root_files = []  # list of (path, size, mtime_ns)
    errors = []
    try:
        with os.scandir(drive_path) as it:
            for entry in it:
                try:
                    if entry.is_symlink():
                        continue
                    name_l = entry.name.lower()
                    if (
                        name_l in EXCLUDE_DIRS
                        or entry.name.startswith("$")
                        or name_l in EXCLUDE_FILES
                    ):
                        continue
                    if entry.is_dir(follow_symlinks=False):
                        subdirs.append(entry.path)
                    elif entry.is_file(follow_symlinks=False):
                        st = entry.stat(follow_symlinks=False)
                        mtime_ns = getattr(st, "st_mtime_ns", int(st.st_mtime * 1e9))
                        root_files.append((entry.path, st.st_size, mtime_ns))
                except (PermissionError, OSError) as e:
                    errors.append(
                        {
                            "path": entry.path,
                            "stage": "root_entry_stat",
                            "error_type": type(e).__name__,
                            "message": str(e),
                        }
                    )
    except (PermissionError, OSError) as e:
        errors.append(
            {
                "path": drive_path,
                "stage": "root_dir_scan",
                "error_type": type(e).__name__,
                "message": str(e),
            }
        )
    return subdirs, root_files, errors


def main():
    start_time = time.time()

    target_drives = TARGET_DRIVES
    include_zero_byte = "--exclude-zero-byte" not in sys.argv
    cli_paths = [arg for arg in sys.argv[1:] if not arg.startswith("-")]
    if cli_paths:
        target_drives = cli_paths

    num_workers = min(16, (os.cpu_count() or 4) * 2)
    print(
        f"[1/4] Hedef dizinler paralel taranıyor ({num_workers} iş parçacığı): {', '.join(target_drives)}...",
        flush=True,
    )

    size_to_files = defaultdict(list)  # sz -> list of (path, mtime_ns)
    total_files = 0
    total_bytes = 0
    zero_files = []  # list of (path, mtime_ns)
    scan_errors = []

    for drive in target_drives:
        if not os.path.exists(drive):
            print(f"Uyarı: {drive} erişilemedi!", flush=True)
            scan_errors.append(
                {
                    "path": drive,
                    "stage": "drive_check",
                    "error_type": "MissingDrive",
                    "message": "Hedef sürücü veya dizin bulunamadı.",
                }
            )
            continue
        print(f"  -> {drive} keşfediliyor...", flush=True)
        t_d = time.time()
        subdirs, root_files, root_errs = discover_drive_branches(drive)
        scan_errors.extend(root_errs)
        print(
            f"     Keşfedilen ana dal: {len(subdirs)} klasör, {len(root_files)} kök dosya",
            flush=True,
        )

        for p, sz, mtime_ns in root_files:
            total_files += 1
            total_bytes += sz
            if sz == 0:
                zero_files.append((p, mtime_ns))
            else:
                size_to_files[sz].append((p, mtime_ns))

        # Ana klasör dallarını ThreadPoolExecutor ile paralel tara
        if subdirs:
            with ThreadPoolExecutor(max_workers=num_workers) as executor:
                future_to_dir = {executor.submit(scan_subtree, d): d for d in subdirs}
                done_branches = 0
                for future in as_completed(future_to_dir):
                    branch_dir = future_to_dir[future]
                    done_branches += 1
                    try:
                        b_sizes, b_zero, b_count, b_bytes, b_errs = future.result()
                        total_files += b_count
                        total_bytes += b_bytes
                        zero_files.extend(b_zero)
                        scan_errors.extend(b_errs)
                        for sz, items in b_sizes.items():
                            size_to_files[sz].extend(items)
                        print(
                            f"     [{done_branches}/{len(subdirs)}] Dal tamamlandı: {os.path.basename(branch_dir)} ({b_count} dosya)",
                            flush=True,
                        )
                    except Exception as e:
                        print(f"     Hata ({branch_dir}): {e}", flush=True)
                        scan_errors.append(
                            {
                                "path": branch_dir,
                                "stage": "branch_worker",
                                "error_type": type(e).__name__,
                                "message": str(e),
                            }
                        )

        print(f"  -> {drive} tamamlandı: ({time.time()-t_d:.2f}s)", flush=True)

    print(f"Toplam taranan dosya: {total_files:,} ({format_size(total_bytes)})", flush=True)

    # Filter candidate sizes (aynı boyutta en az 2 dosya olanlar)
    candidates = {s: items for s, items in size_to_files.items() if len(items) > 1}
    cand_count = sum(len(items) for items in candidates.values())
    print(
        f"[2/4] Aynı boyutta {cand_count:,} adet potansiyel kopya dosya bulundu ({len(candidates):,} farklı boyut grubu, {len(zero_files):,} adet 0-bayt dosya).",
        flush=True,
    )

    # Step 3: Quick head+tail sample hash (Paralel + TOCTOU kontrollü)
    sample_hash_groups = defaultdict(list)  # (sz, sh) -> list of (path, mtime_ns)
    changed_during_scan_count = 0
    unverified_hash_files_count = 0

    if cand_count > 0:
        print(
            f"[3/4] Hızlı örnek hash (Baş + Son 64KB + TOCTOU doğrulaması) paralel kontrol ediliyor...",
            flush=True,
        )
        all_cand_items = [
            (p, sz, mtime_ns) for sz, items in candidates.items() for (p, mtime_ns) in items
        ]
        processed_samples = 0
        total_samples = len(all_cand_items)
        t_sample_start = time.time()
        last_sample_print = t_sample_start

        def _calc_sample(item):
            p, sz, mtime_ns = item
            sh, err = get_quick_sample_hash_verified(p, sz, mtime_ns)
            return sz, sh, p, mtime_ns, err

        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            for sz, sh, p, mtime_ns, err in executor.map(_calc_sample, all_cand_items, chunksize=500):
                processed_samples += 1
                if sh:
                    sample_hash_groups[(sz, sh)].append((p, mtime_ns))
                elif err:
                    if err.startswith("TOCTOU_"):
                        changed_during_scan_count += 1
                    else:
                        unverified_hash_files_count += 1
                    scan_errors.append(
                        {
                            "path": p,
                            "stage": "sample_hash",
                            "error_type": "TOCTOU_CHANGED" if err.startswith("TOCTOU_") else "HashReadError",
                            "message": err,
                        }
                    )
                now = time.time()
                if now - last_sample_print >= 1.0 or processed_samples == total_samples:
                    pct = (processed_samples / total_samples) * 100
                    speed = (
                        processed_samples / (now - t_sample_start)
                        if (now - t_sample_start) > 0
                        else 0
                    )
                    eta = (total_samples - processed_samples) / speed if speed > 0 else 0
                    print(
                        f"\r  Örnek Hash: %{pct:.1f} ({processed_samples:,}/{total_samples:,}) | Hız: {int(speed):,} dosya/sn | Kalan: ~{int(eta)}sn   ",
                        end="",
                        flush=True,
                    )
                    last_sample_print = now
        print()

    potential_full = {k: items for k, items in sample_hash_groups.items() if len(items) > 1}
    full_count = sum(len(items) for items in potential_full.values())
    print(
        f"[4/4] Birebir eşleşen {full_count:,} aday dosya için tam SHA-256 doğrulaması yapılıyor...",
        flush=True,
    )

    # Checkpoint Cache Yükle (Varsa - size ve mtime_ns doğrulamalı!)
    out_dir = Path(__file__).parent.resolve()
    cache_path = out_dir / ".scanner_cache.json"
    hash_cache = {}
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f_c:
                raw_cache = json.load(f_c)
                if isinstance(raw_cache, dict):
                    hash_cache = raw_cache
            print(f"  Önbellek dosyası yüklendi ({len(hash_cache):,} kayıt).", flush=True)
        except Exception:
            hash_cache = {}

    full_hash_groups = defaultdict(list)  # (sz, fh) -> list of (path, mtime_ns)
    files_to_hash = []
    processed = 0
    cache_hits = 0

    for (sz, sh), items in potential_full.items():
        # 128 KB ve altı dosyalar için get_quick_sample_hash_verified zaten dosyanın TAMAMINI okudu ve TOCTOU doğruladı!
        if sz <= 131072:
            for p, mtime_ns in items:
                processed += 1
                full_hash_groups[(sz, sh)].append((p, mtime_ns))
                hash_cache[p] = {"hash": sh, "size": sz, "mtime_ns": mtime_ns}
            continue

        # 128 KB üzeri dosyalar: Önbellekte size + mtime_ns eşleşiyorsa kullan, yoksa tam hash hesapla
        for p, mtime_ns in items:
            cached_fh = get_cached_hash(hash_cache, p, sz, mtime_ns)
            if cached_fh:
                processed += 1
                cache_hits += 1
                full_hash_groups[(sz, cached_fh)].append((p, mtime_ns))
            else:
                files_to_hash.append((p, sz, mtime_ns))

    if cache_hits > 0:
        print(f"  ✓ Metadata (boyut + mtime_ns) doğrulaması geçen {cache_hits:,} önbellek kaydı kullanıldı.", flush=True)

    t_hash_start = time.time()
    last_hash_print = t_hash_start
    total_to_hash = len(files_to_hash)

    def _calc_full(item):
        p, sz, mtime_ns = item
        fh, err, verified_mtime_ns = get_full_hash_verified(p, sz, mtime_ns)
        return p, sz, fh, err, (verified_mtime_ns or mtime_ns)

    if files_to_hash:
        print(
            f"  {total_to_hash:,} büyük dosya için çok iş parçacıklı tam SHA-256 hesaplanıyor...",
            flush=True,
        )
        newly_hashed = 0
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            for p, sz, fh, err, v_mtime_ns in executor.map(_calc_full, files_to_hash, chunksize=100):
                processed += 1
                newly_hashed += 1
                if fh:
                    full_hash_groups[(sz, fh)].append((p, v_mtime_ns))
                    hash_cache[p] = {"hash": fh, "size": sz, "mtime_ns": v_mtime_ns}
                elif err:
                    if err.startswith("TOCTOU_"):
                        changed_during_scan_count += 1
                    else:
                        unverified_hash_files_count += 1
                    scan_errors.append(
                        {
                            "path": p,
                            "stage": "full_hash",
                            "error_type": "TOCTOU_CHANGED" if err.startswith("TOCTOU_") else "HashReadError",
                            "message": err,
                        }
                    )

                now = time.time()
                if now - last_hash_print >= 1.0 or processed == full_count:
                    pct = (processed / full_count) * 100 if full_count else 100
                    speed = (
                        newly_hashed / (now - t_hash_start)
                        if (now - t_hash_start) > 0
                        else 0
                    )
                    eta = (full_count - processed) / speed if speed > 0 else 0
                    print(
                        f"\r  Tam Doğrulama: %{pct:.1f} ({processed:,}/{full_count:,}) | Hız: {int(speed):,} dosya/sn | Kalan: ~{int(eta)}sn   ",
                        end="",
                        flush=True,
                    )
                    last_hash_print = now
        print()

    # Sıfır baytlık (0 B) dosyaları kontrol et ve isteğe bağlı olarak kopya gruplarına dahil et
    verified_zero_files = []
    if len(zero_files) > 1 and include_zero_byte:
        for p, mtime_ns in zero_files:
            try:
                cur_sz, cur_mtime_ns = _stat_signature(p)
                if cur_sz == 0 and cur_mtime_ns == mtime_ns:
                    verified_zero_files.append((p, mtime_ns))
                else:
                    changed_during_scan_count += 1
            except (PermissionError, OSError) as e:
                unverified_hash_files_count += 1
                scan_errors.append(
                    {
                        "path": p,
                        "stage": "zero_byte_verify",
                        "error_type": type(e).__name__,
                        "message": str(e),
                    }
                )
        if len(verified_zero_files) > 1:
            full_hash_groups[(0, EMPTY_FILE_SHA256)].extend(verified_zero_files)

    # Önbelleği güncelle
    try:
        with open(cache_path, "w", encoding="utf-8") as f_c:
            json.dump(hash_cache, f_c)
    except Exception:
        pass

    print(f"Hash doğrulama tamamlandı ({time.time() - t_hash_start:.2f}s)", flush=True)

    # Process duplicates
    duplicates = []
    total_wasted = 0
    group_idx = 1

    for (sz, fh), items in full_hash_groups.items():
        if len(items) > 1:
            wasted = sz * (len(items) - 1)
            total_wasted += wasted
            file_entries = []
            drives = set()

            for p, mtime_ns in items:
                drv = p[:2].upper()
                drives.add(drv)
                try:
                    mtime_sec = mtime_ns / 1e9 if mtime_ns else os.path.getmtime(p)
                    mtime_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(mtime_sec))
                except Exception:
                    mtime_str = "-"
                file_entries.append(
                    {
                        "path": p,
                        "filename": os.path.basename(p),
                        "directory": os.path.dirname(p),
                        "folder": os.path.dirname(p),
                        "drive": drv,
                        "modified": mtime_str,
                        "mtime_ns": mtime_ns,
                        "extension": os.path.splitext(p)[1].lower() or "uzantısız",
                    }
                )

            file_entries.sort(key=lambda x: x["path"])
            duplicates.append(
                {
                    "group_id": group_idx,
                    "hash": fh,
                    "size_bytes": sz,
                    "size_formatted": format_size(sz),
                    "count": len(items),
                    "wasted_bytes": wasted,
                    "wasted_formatted": format_size(wasted),
                    "is_zero_byte": sz == 0,
                    "is_cross_drive": len(drives) > 1,
                    "drives": sorted(list(drives)),
                    "files": file_entries,
                }
            )
            group_idx += 1

    # Sort duplicates by wasted space descending, then count descending
    duplicates.sort(key=lambda x: (x["wasted_bytes"], x["count"]), reverse=True)
    for idx, g in enumerate(duplicates, 1):
        g["group_id"] = idx

    elapsed = round(time.time() - start_time, 2)
    cross_groups = [g for g in duplicates if g["is_cross_drive"]]
    only_d = [g for g in duplicates if g["drives"] == ["D:"]]
    only_e = [g for g in duplicates if g["drives"] == ["E:"]]
    large_groups = [g for g in duplicates if g["size_bytes"] >= 10 * 1024 * 1024]
    zero_groups = [g for g in duplicates if g.get("is_zero_byte")]
    drives_title = format_drives_title(target_drives)
    report_title = f"{drives_title} Kopya Dosya Raporu"

    dir_error_count = sum(
        1 for e in scan_errors if e["stage"] in ("root_dir_scan", "subtree_dir_scan", "drive_check", "branch_worker")
    )
    file_error_count = sum(
        1 for e in scan_errors if e["stage"] in ("root_entry_stat", "subtree_file_stat")
    )
    total_errors_count = len(scan_errors)
    scan_status = "COMPLETE" if total_errors_count == 0 else "PARTIAL_WITH_ERRORS"

    summary = {
        "report_title": report_title,
        "drives_title": drives_title,
        "scan_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "elapsed_seconds": elapsed,
        "scanned_drives": target_drives,
        "scan_status": scan_status,
        "is_complete_scan": total_errors_count == 0,
        "total_errors_count": total_errors_count,
        "skipped_unreadable_dirs_count": dir_error_count,
        "skipped_unreadable_files_count": file_error_count,
        "unverified_hash_files_count": unverified_hash_files_count,
        "changed_during_scan_count": changed_during_scan_count,
        "scan_errors": scan_errors[:200],
        "total_files_scanned": total_files,
        "total_bytes_scanned": total_bytes,
        "total_size_scanned_formatted": format_size(total_bytes),
        "zero_byte_files_count": len(zero_files),
        "zero_byte_groups_count": len(zero_groups),
        "zero_byte_included": include_zero_byte,
        "duplicate_groups_count": len(duplicates),
        "duplicate_files_count": sum(g["count"] for g in duplicates),
        "total_wasted_bytes": total_wasted,
        "total_wasted_formatted": format_size(total_wasted),
        "cross_drive_groups_count": len(cross_groups),
        "cross_drive_wasted_formatted": format_size(sum(g["wasted_bytes"] for g in cross_groups)),
        "only_d_groups_count": len(only_d),
        "only_e_groups_count": len(only_e),
        "large_groups_count": len(large_groups),
    }

    # Save JSON
    json_path = out_dir / "duplicate_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "duplicates": duplicates}, f, ensure_ascii=False, indent=2)
    print(f"✓ JSON rapor kaydedildi: {json_path}", flush=True)

    # Generate Markdown
    md_path = out_dir / "duplicate_report.md"
    generate_md(summary, duplicates, md_path)
    print(f"✓ Markdown rapor kaydedildi: {md_path}", flush=True)

    # Generate HTML Report Bundle
    report_dir = out_dir / "rapor_kopya"
    html_path = out_dir / "duplicate_report.html"
    generate_report_bundle(summary, duplicates, report_dir, html_path)
    print(f"✓ Hızlı & Lazy-Loaded Rapor Klasörü oluşturuldu: {report_dir / 'index.html'}", flush=True)
    print(f"✓ HTML rapor yönlendirmesi kaydedildi: {html_path}", flush=True)

    print(f"\nİşlem Tamamlandı! Durum: {scan_status} | Toplam Süre: {elapsed} sn", flush=True)
    if total_errors_count > 0:
        print(
            f"⚠️ UYARI: Tarama sırasında {total_errors_count} erişim/doğrulama hatası kaydedildi "
            f"(Klasör: {dir_error_count}, Dosya: {file_error_count}, TOCTOU Değişen: {changed_during_scan_count}).",
            flush=True,
        )
    print(f"Bulunan Kopya Grup Sayısı: {len(duplicates)} adet", flush=True)
    print(f"Kurtarılabilir Alan (İsraf): {format_size(total_wasted)}", flush=True)


def generate_md(s, duplicates, md_path):
    report_title = s.get("report_title", "Kopya Dosya Analiz Raporu")
    scan_status = s.get("scan_status", "COMPLETE")
    status_text = (
        "Eksiksiz Tamamlandı (Hatasız)"
        if scan_status == "COMPLETE"
        else f"Kısmi Tarama ({s.get('total_errors_count', 0)} Erişim/Doğrulama Uyarısı)"
    )
    lines = [
        f"# {report_title}\n",
        f"- **Tarama Durumu:** **{status_text}**",
        f"- **Tarama Tarihi:** {s['scan_date']}",
        f"- **Tarama Süresi:** {s['elapsed_seconds']} saniye",
        f"- **Taranan Dizinler:** {', '.join(s.get('scanned_drives', []))}",
        f"- **Taranan Toplam Dosya:** {s['total_files_scanned']:,} dosya ({s['total_size_scanned_formatted']})",
        f"- **Sıfır Baytlık (0 B) Dosya Sayısı:** {s.get('zero_byte_files_count', 0):,} adet ({'Kopya gruplarına dahil edildi' if s.get('zero_byte_included', True) else 'Hariç tutuldu'})",
        f"- **Toplam Kopya Dosya Grubu:** {s['duplicate_groups_count']}",
        f"- **Toplam Kopya Dosya Sayısı:** {s['duplicate_files_count']}",
        f"- **Kurtarılabilir Toplam Alan (İsraf):** **{s['total_wasted_formatted']}**",
    ]
    if s.get("total_errors_count", 0) > 0:
        lines.append(
            f"- **Erişilemeyen Klasör / Dosya:** {s.get('skipped_unreadable_dirs_count', 0)} klasör, "
            f"{s.get('skipped_unreadable_files_count', 0)} dosya"
        )
        lines.append(
            f"- **Tarama Sırasında Değişen (TOCTOU) / Doğrulanamayan:** "
            f"{s.get('changed_during_scan_count', 0)} değişen, {s.get('unverified_hash_files_count', 0)} okunamayan"
        )
    if s.get("cross_drive_groups_count", 0) > 0:
        lines.append(
            f"- **Çapraz Disk Kopyaları:** {s['cross_drive_groups_count']} grup ({s['cross_drive_wasted_formatted']})"
        )

    all_drives = sorted(list(set(d for g in duplicates for d in g.get("drives", []))))
    for drv in all_drives:
        cnt = len([g for g in duplicates if g.get("drives") == [drv]])
        lines.append(f"- **Yalnızca {drv} Diskinde Bulunan Kopyalar:** {cnt} grup")
    lines.append("")
    lines.append("## 🏆 En Fazla Alan İsrafına Neden Olan İlk 20 Kopya\n")
    lines.append("| No | Dosya Adı | Tekil Boyut | Kopya Sayısı | Boşa Harcanan Alan | Diskler | SHA-256 (Kısa) |")
    lines.append("| :--- | :--- | :--- | :--- | :--- | :--- | :--- |")
    for idx, g in enumerate(duplicates[:20], 1):
        name = g["files"][0]["filename"]
        drives = ", ".join(g["drives"])
        hash_short = g["hash"][:12] + "..."
        lines.append(
            f"| {idx} | `{name}` | {g['size_formatted']} | {g['count']} | **{g['wasted_formatted']}** | {drives} | `{hash_short}` |"
        )

    if s.get("scan_errors"):
        lines.append("\n## ⚠️ Erişilemeyen veya Tarama Sırasında Değişen Öğeler (İlk 30)\n")
        lines.append("| Aşama | Tür | Yol | Açıklama |")
        lines.append("| :--- | :--- | :--- | :--- |")
        for err in s["scan_errors"][:30]:
            lines.append(
                f"| `{err.get('stage')}` | `{err.get('error_type')}` | `{err.get('path')}` | {err.get('message')} |"
            )

    lines.append("\n## 📂 Detaylı Kopya Dosya Yolları (İlk 30 Grup)\n")
    for idx, g in enumerate(duplicates[:30], 1):
        name = g["files"][0]["filename"]
        lines.append(
            f"### {idx}. `{name}` — {g['size_formatted']} × {g['count']} adet (**{g['wasted_formatted']} boşa**)"
        )
        lines.append(f"> SHA-256: `{g['hash']}`\n")
        for f in g["files"]:
            lines.append(f"- `[{f['drive']}]` `{f['path']}` *(Tarih: {f['modified']})*")
        lines.append("")

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


def generate_report_bundle(s, duplicates, report_dir, html_path):
    report_dir = Path(report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)

    dups_json = json.dumps(duplicates, ensure_ascii=False)
    summary_json = json.dumps(s, ensure_ascii=False)
    data_js_content = f"window.SUMMARY_DATA = {summary_json};\nwindow.DUPLICATE_DATA = {dups_json};\n"
    with open(report_dir / "data.js", "w", encoding="utf-8") as f:
        f.write(data_js_content)

    tpl_dir = Path(__file__).parent / "templates" / "kopya_raporu"
    css_src = tpl_dir / "style.css"
    js_src = tpl_dir / "app.js"

    if css_src.exists():
        with open(css_src, "r", encoding="utf-8") as f_in, open(
            report_dir / "style.css", "w", encoding="utf-8"
        ) as f_out:
            f_out.write(f_in.read())
    if js_src.exists():
        with open(js_src, "r", encoding="utf-8") as f_in, open(
            report_dir / "app.js", "w", encoding="utf-8"
        ) as f_out:
            f_out.write(f_in.read())

    all_drives = sorted(list(set(d for g in duplicates for d in g.get("drives", []))))
    filter_btns = []
    if s.get("cross_drive_groups_count", 0) > 0:
        cross_lbl = "Hem D hem E" if set(all_drives) == {"D:", "E:"} else "Çapraz Diskler"
        filter_btns.append(
            f'<button class="filter-btn" data-filter="cross">{cross_lbl} ({s["cross_drive_groups_count"]})</button>'
        )
    for drv in all_drives:
        cnt = len([g for g in duplicates if g.get("drives") == [drv]])
        drv_key = drv.replace(":", "").lower()
        filter_btns.append(
            f'<button class="filter-btn" data-filter="{drv_key}">Sadece {drv} ({cnt})</button>'
        )
    if s.get("zero_byte_groups_count", 0) > 0:
        filter_btns.append(
            f'<button class="filter-btn" data-filter="zero">0 Bayt Boş ({s["zero_byte_groups_count"]})</button>'
        )
    dynamic_filters_html = "\n        ".join(filter_btns)

    report_title = s.get("report_title", "Kopya Dosya Analiz Raporu")
    scan_status_banner = ""
    if s.get("scan_status") == "PARTIAL_WITH_ERRORS":
        scan_status_banner = f"""
    <div class="advice-section" style="border-color: rgba(245, 158, 11, 0.45); background: rgba(245, 158, 11, 0.1);">
      <div class="advice-title" style="color: #fbbf24;">
        <span>⚠️</span> Kısmi Tarama Uyarısı ({s.get('total_errors_count', 0)} Erişim veya Doğrulama Hatası)
      </div>
      <p style="font-size: 0.85rem; color: #fde68a;">
        Tarama sırasında <strong>{s.get('skipped_unreadable_dirs_count', 0)}</strong> klasör ve
        <strong>{s.get('skipped_unreadable_files_count', 0)}</strong> dosya yetki/erişim hatası nedeniyle atlandı;
        <strong>{s.get('changed_during_scan_count', 0)}</strong> dosya ise tarama esnasında değiştiği (TOCTOU) için kopya grubuna dahil edilmedi.
      </p>
    </div>"""

    index_html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{report_title} | Disk Analiz 360 & Arşiv 360</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div class="toast" id="toast">✓ İşlem tamamlandı!</div>

  <div class="container">
    <header>
      <div class="header-left">
        <h1>{report_title}</h1>
        <p>SHA-256 Hash + TOCTOU Bütünlük Doğrulamalı Mükerrer Dosya ve Alan Kurtarma Analizi</p>
      </div>
      <div class="header-badge">
        <span>🕒 {s['scan_date']}</span> • <span>⚡ {s['elapsed_seconds']} sn</span> •
        <span>{ '✅ Eksiksiz Tarama' if s.get('scan_status') == 'COMPLETE' else '⚠️ Kısmi Tarama' }</span>
      </div>
    </header>
    {scan_status_banner}
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Kurtarılabilir Alan (İsraf)</div>
        <div class="stat-value highlight-danger">{s['total_wasted_formatted']}</div>
        <div class="stat-sub">Kopyalar temizlendiğinde açılacak yer</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Kopya Dosya Grubu</div>
        <div class="stat-value highlight-accent">{s['duplicate_groups_count']}</div>
        <div class="stat-sub">Toplam {s['duplicate_files_count']} mükerrer dosya ({s.get('zero_byte_files_count', 0)} adet 0B)</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Çapraz / Farklı Disk Kopyaları</div>
        <div class="stat-value highlight-warning">{s['cross_drive_groups_count']} grup</div>
        <div class="stat-sub">{s['cross_drive_wasted_formatted']} ortak alan israfı</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Taranan Toplam Boyut</div>
        <div class="stat-value highlight-success">{s['total_size_scanned_formatted']}</div>
        <div class="stat-sub">{s['total_files_scanned']:,} dosya incelendi</div>
      </div>
    </div>

    <div class="batch-toolbar">
      <div class="batch-title">
        <span>⚡</span> Akıllı Silme Seçimi:
      </div>
      <div class="batch-btn-group">
        <button class="batch-btn primary" onclick="autoSelectKeepFirst()">
          ✨ İlkini Tut, Kalanları Seç (Önerilen)
        </button>
        <button class="batch-btn" onclick="autoSelectKeepNewest()">
          🕒 En Yeniyi Tut, Eskileri Seç
        </button>
        <button class="batch-btn" onclick="autoSelectKeepOldest()">
          📁 En Eskiyi Tut, Yenileri Seç
        </button>
        <button class="batch-btn" onclick="clearAllSelections()">
          ❌ Seçimleri Temizle
        </button>
        <button class="batch-btn" id="btnViewToggle" onclick="toggleViewMode()">
          🌳 Ağaç Görünümü (Aktif)
        </button>
      </div>
    </div>

    <div class="controls">
      <div class="search-box">
        <span class="search-icon">🔍</span>
        <input type="text" id="searchInput" placeholder="Dosya adı, yol, uzantı (.mp4, .pdf) veya SHA-256 ara...">
      </div>
      <div class="filter-group">
        <span class="filter-match-count" id="filterMatchCount">{s['duplicate_groups_count']} grup</span>
        <button class="filter-btn active" data-filter="all">Tümü ({s['duplicate_groups_count']})</button>
        {dynamic_filters_html}
        <button class="filter-btn" data-filter="large">Büyükler (>10MB) ({s['large_groups_count']})</button>
      </div>
    </div>

    <div class="groups-list" id="groupsList"></div>

    <div class="load-more-wrap">
      <div id="sentinel">
        <div class="sentinel-spinner"></div>
      </div>
      <p id="renderedCountText" style="color:var(--text-muted); font-size:0.85rem; margin-bottom:0.75rem;"></p>
      <button class="btn-load-more" id="loadMoreBtn" style="display:none;">Daha Fazla Göster</button>
    </div>
  </div>

  <div class="sticky-script-bar" id="scriptBar">
    <div class="bar-summary">
      <div class="bar-stat">
        <span class="bar-stat-lbl">Silinecek Kopya</span>
        <span class="bar-stat-val red" id="selCount">0 dosya</span>
      </div>
      <div class="bar-stat">
        <span class="bar-stat-lbl">Açılacak Alan</span>
        <span class="bar-stat-val green" id="selSize">0 B</span>
      </div>
      <label class="safe-mode-wrap">
        <input type="checkbox" id="safeModeChbox" checked onchange="updateScriptStats()">
        <span>🛡️ Güvenli Mod (Çakışmasız _SILINECEK_KOPYALAR karantinasına taşı)</span>
      </label>
    </div>

    <div class="platform-selector">
      <button class="plat-tab active" data-plat="powershell" onclick="setPlatform('powershell')">
        <span>🟦 PowerShell (.ps1)</span>
      </button>
      <button class="plat-tab" data-plat="cmd" onclick="setPlatform('cmd')">
        <span>⬛ Windows CMD (.bat)</span>
      </button>
      <button class="plat-tab" data-plat="bash" onclick="setPlatform('bash')">
        <span>🍏 macOS / Linux (.sh)</span>
      </button>
    </div>

    <div class="bar-actions">
      <button class="btn-act btn-preview" onclick="openPreviewModal()">👁️ Önizle</button>
      <button class="btn-act btn-copy-all" onclick="copyScriptToClipboard()">📋 Komutları Kopyala</button>
      <button class="btn-act btn-download" onclick="downloadScript()">💾 Betiği İndir</button>
    </div>
  </div>

  <div class="modal-overlay" id="previewModal">
    <div class="modal-box">
      <div class="modal-head">
        <h3 id="modalTitle">PowerShell Temizleme Betiği Önizleme</h3>
        <button class="modal-close" onclick="closePreviewModal()">&times;</button>
      </div>
      <div class="modal-body">
        <div class="code-block" id="modalCode"></div>
      </div>
      <div class="modal-head" style="border-top:1px solid var(--card-border); border-bottom:none; justify-content:flex-end; gap:0.5rem;">
        <button class="btn-act btn-preview" onclick="closePreviewModal()">Kapat</button>
        <button class="btn-act btn-copy-all" onclick="copyScriptToClipboard()">📋 Kopyala</button>
        <button class="btn-act btn-download" onclick="downloadScript()">💾 İndir</button>
      </div>
    </div>
  </div>

  <script src="data.js"></script>
  <script src="app.js"></script>
</body>
</html>
"""
    with open(report_dir / "index.html", "w", encoding="utf-8") as f:
        f.write(index_html)

    redirect_html = """<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=rapor_kopya/index.html">
  <script>window.location.replace("rapor_kopya/index.html");</script>
  <title>Rapor Yönlendirmesi</title>
</head>
<body></body>
</html>
"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(redirect_html)


def generate_html(s, duplicates, html_path):
    report_dir = Path(html_path).parent / "rapor_kopya"
    generate_report_bundle(s, duplicates, report_dir, html_path)


if __name__ == "__main__":
    main()
