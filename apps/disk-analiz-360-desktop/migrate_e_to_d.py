import os
import sys
import shutil
import hashlib
import time
import json
import re
from pathlib import Path

MAX_PATH_LIMIT = 220  # Safe limit well below Windows 260 MAX_PATH

EXCLUDE_DIRS = {
    "$recycle.bin",
    "system volume information",
    "found.000",
    "found.001",
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

def to_extended_path(p):
    """Adds \\?\\ prefix on Windows to support paths up to 32,767 chars."""
    p_str = os.path.abspath(p)
    if not p_str.startswith("\\\\?\\"):
        return "\\\\?\\" + p_str
    return p_str

def clean_name(name, max_len=45):
    """Cleans up redundant spaces, punctuation, and trims length safely."""
    # Remove unwanted special chars for filesystem safety
    cleaned = re.sub(r'[\\/*?:"<>|]', '_', name)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip('. ')
    if len(cleaned) > max_len:
        cleaned = cleaned[:max_len].strip('. ')
    return cleaned or "isimsiz"

def sanitize_destination_path(source_rel_path, target_root, max_allowed=MAX_PATH_LIMIT):
    """
    Intelligently shortens folder names and/or file name if the total path exceeds max_allowed.
    Returns: (final_path, was_shortened, list_of_changes)
    """
    parts = Path(source_rel_path).parts
    if not parts:
        return target_root, False, []

    # parts[:-1] are dirs, parts[-1] is filename
    dir_parts = list(parts[:-1])
    filename = parts[-1]
    name_stem, ext = os.path.splitext(filename)

    changes = []
    
    # Try normal join first
    candidate = os.path.join(target_root, *dir_parts, filename)
    if len(candidate) <= max_allowed:
        return candidate, False, changes

    # Step 1: Clean and trim overly long directory parts (>35 chars)
    new_dir_parts = []
    for d in dir_parts:
        if len(d) > 35:
            trimmed = clean_name(d, max_len=35)
            if trimmed != d:
                changes.append(f"Klasör kısaltıldı: '{d}' -> '{trimmed}'")
            new_dir_parts.append(trimmed)
        else:
            new_dir_parts.append(clean_name(d, max_len=35))

    candidate = os.path.join(target_root, *new_dir_parts, filename)
    if len(candidate) <= max_allowed:
        return candidate, True, changes

    # Step 2: If still too long, aggressively shorten dir parts (>20 chars)
    new_dir_parts_aggr = []
    for d in new_dir_parts:
        if len(d) > 20:
            trimmed = clean_name(d, max_len=20)
            changes.append(f"Klasör kompaktlaştırıldı: '{d}' -> '{trimmed}'")
            new_dir_parts_aggr.append(trimmed)
        else:
            new_dir_parts_aggr.append(d)

    candidate = os.path.join(target_root, *new_dir_parts_aggr, filename)
    if len(candidate) <= max_allowed:
        return candidate, True, changes

    # Step 3: If still too long, shorten the filename stem
    dir_prefix = os.path.join(target_root, *new_dir_parts_aggr)
    remaining_space = max_allowed - len(dir_prefix) - 1 - len(ext) - 8  # 8 chars for hash suffix
    if remaining_space < 10:
        remaining_space = 10
    
    stem_hash = hashlib.md5(filename.encode('utf-8', errors='ignore')).hexdigest()[:6]
    shortened_filename = f"{name_stem[:remaining_space]}_{stem_hash}{ext}"
    changes.append(f"Dosya adı kısaltıldı: '{filename}' -> '{shortened_filename}'")
    
    final_path = os.path.join(dir_prefix, shortened_filename)
    return final_path, True, changes

def plan_migration(source_drive="E:\\", target_dir="D:\\E_ARSIV"):
    print(f"=== E -> D GÜVENLİ VE AKILLI AKTARIM PLANI ===")
    print(f"Kaynak Disk: {source_drive}")
    print(f"Hedef Klasör: {target_dir}")
    print(f"Maksimum Güvenli Yol Uzunluğu: {MAX_PATH_LIMIT} karakter (Windows 260 limit koruması)\n")

    t0 = time.time()
    all_items = []
    shortened_items = []
    total_bytes = 0
    skipped_system = 0

    for root, dirs, files in os.walk(source_drive):
        dirs[:] = [d for d in dirs if d.lower() not in EXCLUDE_DIRS and not d.startswith("$")]
        
        for f in files:
            f_lower = f.lower()
            if f_lower in EXCLUDE_FILES or f.startswith("~$"):
                skipped_system += 1
                continue
            
            src_path = os.path.join(root, f)
            try:
                rel_path = os.path.relpath(src_path, source_drive)
                file_size = os.path.getsize(src_path)
            except (PermissionError, OSError):
                continue

            total_bytes += file_size
            dest_path, was_shortened, changes = sanitize_destination_path(rel_path, target_dir, MAX_PATH_LIMIT)
            
            item_info = {
                "source": src_path,
                "relative_source": rel_path,
                "destination": dest_path,
                "source_len": len(src_path),
                "dest_len": len(dest_path),
                "was_shortened": was_shortened,
                "changes": changes,
                "size_bytes": file_size
            }
            all_items.append(item_info)
            if was_shortened:
                shortened_items.append(item_info)

    elapsed = round(time.time() - t0, 2)
    print(f"İnceleme bitti ({elapsed} sn):")
    print(f"- Toplam Taşınacak Dosya: {len(all_items)} adet ({total_bytes / (1024**3):.2f} GB)")
    print(f"- Otomatik Kısaltılan / Düzenlenen Uzun Yollar: {len(shortened_items)} adet")
    print(f"- 220+ karakteri aşan hedef yol sayısı: {len([x for x in all_items if x['dest_len'] > MAX_PATH_LIMIT])} (SIFIR olmalı)")

    # Save migration plan
    plan_data = {
        "source_drive": source_drive,
        "target_dir": target_dir,
        "max_path_limit": MAX_PATH_LIMIT,
        "total_files": len(all_items),
        "total_bytes": total_bytes,
        "total_gb": round(total_bytes / (1024**3), 2),
        "shortened_count": len(shortened_items),
        "shortened_samples": shortened_items[:100],
        "all_items": all_items
    }

    out_dir = Path(__file__).parent.resolve()
    plan_json = out_dir / "migration_plan.json"
    with open(plan_json, "w", encoding="utf-8") as f:
        json.dump(plan_data, f, ensure_ascii=False, indent=2)
    print(f"Plan JSON kaydedildi: {plan_json}")

    # Generate Plan HTML
    generate_migration_html(plan_data, out_dir / "migration_plan.html")

def generate_migration_html(plan, html_path):
    items_json = json.dumps(plan["shortened_samples"], ensure_ascii=False)
    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>E -> D Taşıma & Yol Uzunluğu Optimizasyon Planı</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    body {{
      font-family: 'Plus Jakarta Sans', sans-serif;
      background: #0b0f19;
      color: #f3f4f6;
      padding: 2rem;
      line-height: 1.6;
    }}
    .container {{ max-width: 1300px; margin: 0 auto; }}
    h1 {{ font-size: 2rem; color: #fff; margin-bottom: 0.5rem; }}
    .stats {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin: 2rem 0; }}
    .card {{ background: #131b2e; border: 1px solid rgba(255,255,255,0.08); padding: 1.25rem; border-radius: 12px; }}
    .card-title {{ font-size: 0.8rem; color: #9ca3af; text-transform: uppercase; font-weight: 600; }}
    .card-val {{ font-size: 1.8rem; font-weight: 800; color: #38bdf8; margin-top: 0.25rem; }}
    .table-container {{ background: #131b2e; border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; overflow: hidden; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 0.85rem; }}
    th, td {{ padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }}
    th {{ background: rgba(0,0,0,0.3); color: #9ca3af; font-weight: 600; }}
    .path-code {{ font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; word-break: break-all; }}
    .badge {{ display: inline-block; padding: 0.2rem 0.5rem; border-radius: 6px; font-weight: 700; font-size: 0.75rem; }}
    .badge-warn {{ background: rgba(245,158,11,0.2); color: #fbbf24; }}
    .badge-ok {{ background: rgba(16,185,129,0.2); color: #34d399; }}
  </style>
</head>
<body>
  <div class="container">
    <h1>E: Diskini D: Diskine Güvenli Aktarma & Yol Optimizasyon Planı</h1>
    <p>Windows 260 Karakter MAX_PATH sınırına takılan dosyalar akıllıca güvenli boyuta çekilmiştir.</p>
    
    <div class="stats">
      <div class="card">
        <div class="card-title">Toplam Dosya</div>
        <div class="card-val">{plan['total_files']} adet</div>
      </div>
      <div class="card">
        <div class="card-title">Toplam Veri</div>
        <div class="card-val">{plan['total_gb']} GB</div>
      </div>
      <div class="card">
        <div class="card-title">Kısaltılan Uzun Yollar</div>
        <div class="card-val" style="color: #fbbf24">{plan['shortened_count']} dosya</div>
      </div>
      <div class="card">
        <div class="card-title">Hedef Klasör</div>
        <div class="card-val" style="font-size: 1.2rem; color: #a5b4fc">{plan['target_dir']}</div>
      </div>
    </div>

    <h2 style="margin-bottom: 1rem;">Kısaltılan ve Düzenlenen Örnek Yollar (İlk 100)</h2>
    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th>Orijinal Kaynak (E:)</th>
            <th>Eski Uzunluk</th>
            <th>Hedef Konum (D:)</th>
            <th>Yeni Uzunluk</th>
            <th>Uygulanan Değişiklik</th>
          </tr>
        </thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    const items = {items_json};
    const tbody = document.getElementById('tableBody');
    items.forEach(it => {{
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="path-code">${{it.source}}</td>
        <td><span class="badge badge-warn">${{it.source_len}} kar.</span></td>
        <td class="path-code" style="color:#38bdf8">${{it.destination}}</td>
        <td><span class="badge badge-ok">${{it.dest_len}} kar.</span></td>
        <td style="color:#9ca3af; font-size:0.75rem">${{it.changes.join('<br>')}}</td>
      `;
      tbody.appendChild(tr);
    }});
  </script>
</body>
</html>
"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"Plan HTML kaydedildi: {html_path}")

if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "E:\\"
    dst = sys.argv[2] if len(sys.argv) > 2 else "D:\\E_ARSIV"
    plan_migration(src, dst)
