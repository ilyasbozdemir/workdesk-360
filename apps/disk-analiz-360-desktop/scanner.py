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
        try: _s.reconfigure(encoding="utf-8", errors="replace")
        except Exception: pass

TARGET_DRIVES = [d for d in ["C:\\","D:\\", "E:\\"] if os.path.exists(d)]

EXCLUDE_DIRS = {
    "$recycle.bin",
    "system volume information",
    "found.000",
    "found.001",
    "found.002",
    ".trashes",
    ".gemini"
}

EXCLUDE_FILES = {
    "pagefile.sys",
    "hiberfil.sys",
    "swapfile.sys",
    "dumpstack.log",
    "dumpstack.log.tmp",
    "boottel.dat"
}

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
    if all(len(d) == 2 and d[1] == ':' for d in clean):
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

def get_quick_sample_hash(filepath, file_size):
    """
    128 KB ve altındaki dosyaların TAMAMINI okuyarak KESİN tam SHA-256 hash hesaplar.
    128 KB üzeri dosyalar için baş 64KB ve son 64KB okuyarak hızlı filtreleme yapar.
    """
    try:
        with open(filepath, "rb") as f:
            h = hashlib.sha256()
            if file_size <= 131072:
                # 128 KB ve altı dosyaların TAMAMI tek seferde okunur (matematiksel tam hash)
                h.update(f.read())
                return h.hexdigest()
            # 128 KB üzeri dosyalar: Baş 64KB + Son 64KB
            head = f.read(65536)
            h.update(head)
            f.seek(file_size - 65536)
            tail = f.read(65536)
            h.update(tail)
            return h.hexdigest()
    except (PermissionError, OSError):
        return None

def get_full_hash(filepath, block_size=4*1024*1024):
    """Calculates full SHA256 in 4MB blocks."""
    h = hashlib.sha256()
    try:
        with open(filepath, "rb") as f:
            while True:
                buf = f.read(block_size)
                if not buf:
                    break
                h.update(buf)
        return h.hexdigest()
    except (PermissionError, OSError):
        return None

def scan_subtree(root_path):
    """Bir alt klasör dalını os.scandir ile hızlı ve rekürsif tarar."""
    local_size_to_files = defaultdict(list)
    local_zero_files = []
    local_count = 0
    local_bytes = 0

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
                        if entry.name.startswith("~$") or name_l in EXCLUDE_FILES or name_l.startswith("dumpstack"):
                            continue
                        if entry.is_dir(follow_symlinks=False):
                            if name_l in EXCLUDE_DIRS or entry.name.startswith("$"):
                                continue
                            stack.append(entry.path)
                        elif entry.is_file(follow_symlinks=False):
                            st = entry.stat(follow_symlinks=False)
                            sz = st.st_size
                            local_count += 1
                            local_bytes += sz
                            if sz == 0:
                                local_zero_files.append(entry.path)
                            else:
                                local_size_to_files[sz].append(entry.path)
                    except (PermissionError, OSError):
                        continue
        except (PermissionError, OSError):
            continue

    return local_size_to_files, local_zero_files, local_count, local_bytes

def discover_drive_branches(drive_path):
    """Sürücü kökündeki ana klasör dallarını ve kök dosyalarını saniyeler içinde keşfeder."""
    subdirs = []
    root_files = []
    try:
        with os.scandir(drive_path) as it:
            for entry in it:
                try:
                    name_l = entry.name.lower()
                    if name_l in EXCLUDE_DIRS or entry.name.startswith("$") or name_l in EXCLUDE_FILES:
                        continue
                    if entry.is_dir(follow_symlinks=False):
                        subdirs.append(entry.path)
                    elif entry.is_file(follow_symlinks=False):
                        st = entry.stat(follow_symlinks=False)
                        root_files.append((entry.path, st.st_size))
                except (PermissionError, OSError):
                    continue
    except (PermissionError, OSError):
        pass
    return subdirs, root_files

def main():
    start_time = time.time()
    
    target_drives = TARGET_DRIVES
    # Check for CLI arguments: python scanner.py <path1> <path2> ...
    cli_paths = [arg for arg in sys.argv[1:] if not arg.startswith("-")]
    if cli_paths:
        target_drives = cli_paths

    num_workers = min(16, (os.cpu_count() or 4) * 2)
    print(f"[1/4] Hedef dizinler paralel taranıyor ({num_workers} iş parçacığı): {', '.join(target_drives)}...", flush=True)

    size_to_files = defaultdict(list)
    total_files = 0
    total_bytes = 0
    zero_files = []

    for drive in target_drives:
        if not os.path.exists(drive):
            print(f"Uyarı: {drive} erişilemedi!", flush=True)
            continue
        print(f"  -> {drive} keşfediliyor...", flush=True)
        t_d = time.time()
        subdirs, root_files = discover_drive_branches(drive)
        print(f"     Keşfedilen ana dal: {len(subdirs)} klasör, {len(root_files)} kök dosya", flush=True)

        for p, sz in root_files:
            total_files += 1
            total_bytes += sz
            if sz == 0:
                zero_files.append(p)
            else:
                size_to_files[sz].append(p)

        # Ana klasör dallarını ThreadPoolExecutor ile paralel tara
        if subdirs:
            with ThreadPoolExecutor(max_workers=num_workers) as executor:
                future_to_dir = {executor.submit(scan_subtree, d): d for d in subdirs}
                done_branches = 0
                for future in as_completed(future_to_dir):
                    branch_dir = future_to_dir[future]
                    done_branches += 1
                    try:
                        b_sizes, b_zero, b_count, b_bytes = future.result()
                        total_files += b_count
                        total_bytes += b_bytes
                        zero_files.extend(b_zero)
                        for sz, paths in b_sizes.items():
                            size_to_files[sz].extend(paths)
                        print(f"     [{done_branches}/{len(subdirs)}] Dal tamamlandı: {os.path.basename(branch_dir)} ({b_count} dosya)", flush=True)
                    except Exception as e:
                        print(f"     Hata ({branch_dir}): {e}", flush=True)

        print(f"  -> {drive} tamamlandı: ({time.time()-t_d:.2f}s)", flush=True)

    print(f"Toplam taranan dosya: {total_files:,} ({format_size(total_bytes)})", flush=True)

    # Filter candidate sizes (aynı boyutta en az 2 dosya olanlar)
    candidates = {s: paths for s, paths in size_to_files.items() if len(paths) > 1}
    cand_count = sum(len(p) for p in candidates.values())
    print(f"[2/4] Aynı boyutta {cand_count:,} adet potansiyel kopya dosya bulundu ({len(candidates):,} farklı boyut grubu).", flush=True)

    if cand_count == 0:
        print("Mükerrer dosya adayı bulunamadı.", flush=True)
        return

    # Step 3: Quick head+tail sample hash (Paralel)
    print(f"[3/4] Hızlı örnek hash (Baş + Son 64KB) paralel kontrol ediliyor...", flush=True)
    all_cand_items = [(p, sz) for sz, paths in candidates.items() for p in paths]
    sample_hash_groups = defaultdict(list)
    processed_samples = 0
    total_samples = len(all_cand_items)
    t_sample_start = time.time()
    last_sample_print = t_sample_start

    def _calc_sample(item):
        p, sz = item
        return sz, get_quick_sample_hash(p, sz), p

    with ThreadPoolExecutor(max_workers=num_workers) as executor:
        for sz, sh, p in executor.map(_calc_sample, all_cand_items, chunksize=500):
            processed_samples += 1
            if sh:
                sample_hash_groups[(sz, sh)].append(p)
            now = time.time()
            if now - last_sample_print >= 1.0 or processed_samples == total_samples:
                pct = (processed_samples / total_samples) * 100
                speed = processed_samples / (now - t_sample_start) if (now - t_sample_start) > 0 else 0
                eta = (total_samples - processed_samples) / speed if speed > 0 else 0
                print(f"\r  Örnek Hash: %{pct:.1f} ({processed_samples:,}/{total_samples:,}) | Hız: {int(speed):,} dosya/sn | Kalan: ~{int(eta)}sn   ", end="", flush=True)
                last_sample_print = now
    print()

    potential_full = {k: paths for k, paths in sample_hash_groups.items() if len(paths) > 1}
    full_count = sum(len(p) for p in potential_full.values())
    print(f"[4/4] Birebir eşleşen {full_count:,} aday dosya için tam SHA-256 doğrulaması yapılıyor...", flush=True)

    # Checkpoint Cache Yükle (Varsa)
    out_dir = Path(__file__).parent.resolve()
    cache_path = out_dir / ".scanner_cache.json"
    hash_cache = {}
    if cache_path.exists():
        try:
            with open(cache_path, "r", encoding="utf-8") as f_c:
                hash_cache = json.load(f_c)
            print(f"  Önbellekten {len(hash_cache):,} doğrulanmış hash yüklendi.", flush=True)
        except Exception:
            hash_cache = {}

    full_hash_groups = defaultdict(list)
    files_to_hash = []
    processed = 0

    for (sz, sh), paths in potential_full.items():
        # 128 KB ve altı dosyalar için get_quick_sample_hash zaten dosyanın TAMAMINI okudu!
        # Matematiksel olarak tam SHA-256'dır, tekrar diskten okumaya gerek yoktur.
        if sz <= 131072:
            for p in paths:
                processed += 1
                full_hash_groups[(sz, sh)].append(p)
            continue

        # 128 KB üzeri dosyalar tam hash doğrulamasına alınır
        for p in paths:
            if p in hash_cache:
                processed += 1
                full_hash_groups[(sz, hash_cache[p])].append(p)
            else:
                files_to_hash.append((p, sz))

    t_hash_start = time.time()
    last_hash_print = t_hash_start
    total_to_hash = len(files_to_hash)

    def _calc_full(item):
        p, sz = item
        return p, sz, get_full_hash(p)

    if files_to_hash:
        print(f"  {total_to_hash:,} büyük dosya için çok iş parçacıklı tam SHA-256 hesaplanıyor...", flush=True)
        newly_hashed = 0
        with ThreadPoolExecutor(max_workers=num_workers) as executor:
            for p, sz, fh in executor.map(_calc_full, files_to_hash, chunksize=100):
                processed += 1
                newly_hashed += 1
                if fh:
                    full_hash_groups[(sz, fh)].append(p)
                    hash_cache[p] = fh

                now = time.time()
                if now - last_hash_print >= 1.0 or processed == full_count:
                    pct = (processed / full_count) * 100
                    speed = newly_hashed / (now - t_hash_start) if (now - t_hash_start) > 0 else 0
                    eta = (full_count - processed) / speed if speed > 0 else 0
                    print(f"\r  Tam Doğrulama: %{pct:.1f} ({processed:,}/{full_count:,}) | Hız: {int(speed):,} dosya/sn | Kalan: ~{int(eta)}sn   ", end="", flush=True)
                    last_hash_print = now
        print()

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

    for (sz, fh), paths in full_hash_groups.items():
        if len(paths) > 1:
            wasted = sz * (len(paths) - 1)
            total_wasted += wasted
            file_entries = []
            drives = set()

            for p in paths:
                drv = p[:2].upper()
                drives.add(drv)
                try:
                    mtime = os.path.getmtime(p)
                    mtime_str = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(mtime))
                except:
                    mtime_str = "-"
                file_entries.append({
                    "path": p,
                    "filename": os.path.basename(p),
                    "directory": os.path.dirname(p),
                    "drive": drv,
                    "modified": mtime_str,
                    "extension": os.path.splitext(p)[1].lower() or "uzantısız"
                })
            
            file_entries.sort(key=lambda x: x["path"])
            duplicates.append({
                "group_id": group_idx,
                "hash": fh,
                "size_bytes": sz,
                "size_formatted": format_size(sz),
                "count": len(paths),
                "wasted_bytes": wasted,
                "wasted_formatted": format_size(wasted),
                "is_cross_drive": len(drives) > 1,
                "drives": sorted(list(drives)),
                "files": file_entries
            })
            group_idx += 1

    # Sort duplicates by wasted space descending
    duplicates.sort(key=lambda x: x["wasted_bytes"], reverse=True)

    elapsed = round(time.time() - start_time, 2)
    cross_groups = [g for g in duplicates if g["is_cross_drive"]]
    only_d = [g for g in duplicates if g["drives"] == ["D:"]]
    only_e = [g for g in duplicates if g["drives"] == ["E:"]]
    large_groups = [g for g in duplicates if g["size_bytes"] >= 10 * 1024 * 1024]
    drives_title = format_drives_title(target_drives)
    report_title = f"{drives_title} Kopya Dosya Raporu"

    summary = {
        "report_title": report_title,
        "drives_title": drives_title,
        "scan_date": time.strftime("%Y-%m-%d %H:%M:%S"),
        "elapsed_seconds": elapsed,
        "scanned_drives": target_drives,
        "total_files_scanned": total_files,
        "total_bytes_scanned": total_bytes,
        "total_size_scanned_formatted": format_size(total_bytes),
        "zero_byte_files_count": len(zero_files),
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

    out_dir = Path(__file__).parent.resolve()
    
    # Save JSON
    json_path = out_dir / "duplicate_report.json"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"summary": summary, "duplicates": duplicates}, f, ensure_ascii=False, indent=2)
    print(f"✓ JSON rapor kaydedildi: {json_path}", flush=True)

    # Generate Markdown
    md_path = out_dir / "duplicate_report.md"
    generate_md(summary, duplicates, md_path)
    print(f"✓ Markdown rapor kaydedildi: {md_path}", flush=True)

    # Generate HTML Report Bundle (rapor_kopya/ with separated HTML, CSS, JS, Data + Lazy Loading)
    report_dir = out_dir / "rapor_kopya"
    html_path = out_dir / "duplicate_report.html"
    generate_report_bundle(summary, duplicates, report_dir, html_path)
    print(f"✓ Hızlı & Lazy-Loaded Rapor Klasörü oluşturuldu: {report_dir / 'index.html'}", flush=True)
    print(f"✓ HTML rapor yönlendirmesi kaydedildi: {html_path}", flush=True)

    print(f"\nİşlem Başarıyla Tamamlandı! Toplam Süre: {elapsed} sn", flush=True)
    print(f"Bulunan Kopya Grup Sayısı: {len(duplicates)} adet", flush=True)
    print(f"Kurtarılabilir Alan (İsraf): {format_size(total_wasted)}", flush=True)

def generate_md(s, duplicates, md_path):
    report_title = s.get("report_title", "Kopya Dosya Analiz Raporu")
    lines = [
        f"# {report_title}\n",
        f"- **Tarama Tarihi:** {s['scan_date']}",
        f"- **Tarama Süresi:** {s['elapsed_seconds']} saniye",
        f"- **Taranan Dizinler:** {', '.join(s.get('scanned_drives', []))}",
        f"- **Taranan Toplam Dosya:** {s['total_files_scanned']:,} dosya ({s['total_size_scanned_formatted']})",
        f"- **Toplam Kopya Dosya Grubu:** {s['duplicate_groups_count']}",
        f"- **Toplam Kopya Dosya Sayısı:** {s['duplicate_files_count']}",
        f"- **Kurtarılabilir Toplam Alan (İsraf):** **{s['total_wasted_formatted']}**",
    ]
    if s.get("cross_drive_groups_count", 0) > 0:
        lines.append(f"- **Çapraz Disk Kopyaları:** {s['cross_drive_groups_count']} grup ({s['cross_drive_wasted_formatted']})")

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
        lines.append(f"| {idx} | `{name}` | {g['size_formatted']} | {g['count']} | **{g['wasted_formatted']}** | {drives} | `{hash_short}` |")

    lines.append("\n## 📂 Detaylı Kopya Dosya Yolları (İlk 30 Grup)\n")
    for idx, g in enumerate(duplicates[:30], 1):
        name = g["files"][0]["filename"]
        lines.append(f"### {idx}. `{name}` — {g['size_formatted']} × {g['count']} adet (**{g['wasted_formatted']} boşa**)")
        lines.append(f"> SHA-256: `{g['hash']}`\n")
        for f in g["files"]:
            lines.append(f"- `[{f['drive']}]` `{f['path']}` *(Tarih: {f['modified']})*")
        lines.append("")

    with open(md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

def generate_report_bundle(s, duplicates, report_dir, html_path):
    report_dir = Path(report_dir)
    report_dir.mkdir(parents=True, exist_ok=True)
    
    # 1. Write Data.js (Instant offline file:/// loading without CORS)
    dups_json = json.dumps(duplicates, ensure_ascii=False)
    summary_json = json.dumps(s, ensure_ascii=False)
    data_js_content = f"window.SUMMARY_DATA = {summary_json};\nwindow.DUPLICATE_DATA = {dups_json};\n"
    with open(report_dir / "data.js", "w", encoding="utf-8") as f:
        f.write(data_js_content)
    
    # 2. Copy style.css and app.js from templates/kopya_raporu/
    tpl_dir = Path(__file__).parent / "templates" / "kopya_raporu"
    css_src = tpl_dir / "style.css"
    js_src = tpl_dir / "app.js"
    
    if css_src.exists():
        with open(css_src, "r", encoding="utf-8") as f_in, open(report_dir / "style.css", "w", encoding="utf-8") as f_out:
            f_out.write(f_in.read())
    if js_src.exists():
        with open(js_src, "r", encoding="utf-8") as f_in, open(report_dir / "app.js", "w", encoding="utf-8") as f_out:
            f_out.write(f_in.read())

    # 3. Dynamic Filters for HTML
    all_drives = sorted(list(set(d for g in duplicates for d in g.get("drives", []))))
    filter_btns = []
    if s.get("cross_drive_groups_count", 0) > 0:
        cross_lbl = "Hem D hem E" if set(all_drives) == {"D:", "E:"} else "Çapraz Diskler"
        filter_btns.append(f'<button class="filter-btn" data-filter="cross">{cross_lbl} ({s["cross_drive_groups_count"]})</button>')
    for drv in all_drives:
        cnt = len([g for g in duplicates if g.get("drives") == [drv]])
        drv_key = drv.replace(":", "").lower()
        filter_btns.append(f'<button class="filter-btn" data-filter="{drv_key}">Sadece {drv} ({cnt})</button>')
    dynamic_filters_html = "\n        ".join(filter_btns)

    report_title = s.get("report_title", "Kopya Dosya Analiz Raporu")

    # 4. Generate clean, lightweight index.html (<15KB)
    index_html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{report_title} | Arşiv 360</title>
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
        <p>SHA-256 Hash Bütünlüğü ile Doğrulanmış Mükerrer Dosya ve Alan Kurtarma Analizi</p>
      </div>
      <div class="header-badge">
        <span>🕒 {s['scan_date']}</span> • <span>⚡ {s['elapsed_seconds']} sn</span>
      </div>
    </header>

    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-title">Kurtarılabilir Alan (İsraf)</div>
        <div class="stat-value highlight-danger">{s['total_wasted_formatted']}</div>
        <div class="stat-sub">Kopyalar temizlendiğinde açılacak yer</div>
      </div>
      <div class="stat-card">
        <div class="stat-title">Kopya Dosya Grubu</div>
        <div class="stat-value highlight-accent">{s['duplicate_groups_count']}</div>
        <div class="stat-sub">Toplam {s['duplicate_files_count']} mükerrer dosya</div>
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

    <!-- TAVSİYELER BÖLÜMÜ -->
    <div class="advice-section">
      <div class="advice-title">
        <span>💡</span> Ne Yapmalısınız? Size Özel Temizlik & Optimizasyon Önerileri
      </div>
      <div class="advice-list">
        <div class="advice-item">
          <strong>📂 1. Klasör Düzeyinde Kopya Tespiti (Önemli!)</strong>
          <p>Raporu incelediğinizde bazı projelerin (örn. video veya proje yedek klasörleri) tüm alt klasörleriyle birlikte birden fazla yere kopyalandığını görebilirsiniz. Tek tek dosya silmek yerine bu mükerrer klasörleri tek hamlede yönetebilirsiniz.</p>
        </div>
        <div class="advice-item">
          <strong>💾 2. Çapraz Disk Senkronizasyonu</strong>
          <p>Yedek disklerdeki mükerrer kopyalarda her iki diskte de değişiklik yapıyorsanız en güncel olanı tutup diğerini güvenli karantinaya alabilirsiniz.</p>
        </div>
        <div class="advice-item">
          <strong>🛡️ 3. Güvenli Silme (Karantina Klasörü)</strong>
          <p>Dosyaları kalıcı olarak silmeden önce bir <code>_SILINECEK_KOPYALAR</code> klasörüne taşımak veri kaybı riskini tamamen ortadan kaldırır.</p>
        </div>
      </div>
    </div>

    <!-- AKILLI TOPLU SEÇİM ARAÇ ÇUBUĞU -->
    <div class="batch-toolbar">
      <div class="batch-title">
        <span>⚡</span> Akıllı Silme Seçimi:
      </div>
      <div class="batch-btn-group">
        <button class="batch-btn primary" onclick="autoSelectKeepFirst()" title="Her gruptaki ilk dosyayı saklar, geri kalan mükerrer kopyaları silmek üzere işaretler">
          ✨ İlkini Tut, Kalanları Seç (Önerilen)
        </button>
        <button class="batch-btn" onclick="autoSelectKeepNewest()" title="Her grupta en son düzenlenen dosyayı saklar, eski tarihli kopyaları siler">
          🕒 En Yeniyi Tut, Eskileri Seç
        </button>
        <button class="batch-btn" onclick="autoSelectKeepOldest()" title="En eski orijinal dosyayı saklar, sonradan kopyalananları seçer">
          📁 En Eskiyi Tut, Yenileri Seç
        </button>
        <button class="batch-btn" onclick="clearAllSelections()" title="İşaretlenen tüm dosyaları sıfırlar">
          ❌ Seçimleri Temizle
        </button>
        <button class="batch-btn" id="btnViewToggle" onclick="toggleViewMode()" title="Klasör ağacı ile tam liste arasında geçiş yap">
          🌳 Ağaç Görünümü (Aktif)
        </button>
      </div>
    </div>

    <!-- KONTROLLER -->
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

    <!-- LİSTE (LAZY LOADED) -->
    <div class="groups-list" id="groupsList"></div>

    <!-- LAZY LOADING TETİKLEYİCİSİ & LOAD MORE -->
    <div class="load-more-wrap">
      <div id="sentinel">
        <div class="sentinel-spinner"></div>
      </div>
      <p id="renderedCountText" style="color:var(--text-muted); font-size:0.85rem; margin-bottom:0.75rem;"></p>
      <button class="btn-load-more" id="loadMoreBtn" style="display:none;">Daha Fazla Göster</button>
    </div>

    <div class="footer">
      <p>Bu rapor Arşiv 360 tarafından SHA-256 hash doğrulaması ve Lazy Loading mimarisi ile üretilmiştir.</p>
    </div>
  </div>

  <!-- SABİT ALT KOMUT BETİĞİ OLUŞTURUCU ÇUBUĞU -->
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
      <label class="safe-mode-wrap" title="İşaretli dosyaları kalıcı olarak silmek yerine diskin kökündeki _SILINECEK_KOPYALAR klasörüne taşır.">
        <input type="checkbox" id="safeModeChbox" checked onchange="updateScriptStats()">
        <span>🛡️ Güvenli Mod (_SILINECEK_KOPYALAR klasörüne taşı)</span>
      </label>
    </div>

    <!-- PLATFORM SEÇİMİ -->
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
      <button class="btn-act btn-preview" onclick="openPreviewModal()">
        👁️ Önizle
      </button>
      <button class="btn-act btn-copy-all" onclick="copyScriptToClipboard()">
        📋 Komutları Kopyala
      </button>
      <button class="btn-act btn-download" onclick="downloadScript()">
        💾 Betiği İndir
      </button>
    </div>
  </div>

  <!-- MODAL: SCRIPT PREVIEW -->
  <div class="modal-overlay" id="previewModal">
    <div class="modal-box">
      <div class="modal-head">
        <h3 id="modalTitle">PowerShell Temizleme Betiği Önizleme</h3>
        <button class="modal-close" onclick="closePreviewModal()">&times;</button>
      </div>
      <div class="modal-body">
        <p style="font-size:0.85rem; color:#94a3b8; margin-bottom:1rem;">
          Aşağıdaki komutları terminalinize kopyalayıp çalıştırabilir veya doğrudan dosya olarak indirebilirsiniz:
        </p>
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

    # 5. Redirect wrapper in duplicate_report.html
    redirect_html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0; url=rapor_kopya/index.html">
  <script>window.location.replace("rapor_kopya/index.html");</script>
  <title>{report_title} | Arşiv 360</title>
</head>
<body style="font-family:'Segoe UI', sans-serif; background:#0b0f19; color:#f3f4f6; padding:3rem; text-align:center;">
  <h2>Arşiv 360 - {report_title}</h2>
  <p>Yüksek performanslı ve Lazy-Loaded rapor klasörüne yönlendiriliyorsunuz...</p>
  <p><a href="rapor_kopya/index.html" style="color:#818cf8; text-decoration:underline;">Açılmazsa buraya tıklayın (rapor_kopya/index.html)</a></p>
</body>
</html>
"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(redirect_html)

def generate_html(s, duplicates, html_path):
    report_dir = Path(html_path).parent / "rapor_kopya"
    generate_report_bundle(s, duplicates, report_dir, html_path)


if __name__ == "__main__":
    main()
