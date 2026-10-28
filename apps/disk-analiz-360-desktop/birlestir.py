#!/usr/bin/env python3
# -*- coding: utf-8 -*-
r"""
================================================================================
BİRLEŞTİR - Windows 10/11 İçin Akıllı Disk Birleştirme ve Tekilleştirme Aracı
================================================================================
DÖNGÜ SIRASI:
  1) faz1 --dry-run                     -> Planı ve MAX_PATH kısaltmalarını incele
  2) siniflandir --dry-run              -> Konu kurallarını test et / incele
  3) faz1 --uygula                      -> E: -> D: tekil aktarım + doğrulama
  4) dogrulama_raporu.csv temiz mi bak  -> D:'de tüm E: dosyaları var mı kontrol et
  5) E:'yi elle biçimlendir / temizle   -> Script dokunmaz, kullanıcı elle yapar
  6) faz2 --uygula                      -> D: -> E: düzenli yapıyı geri aktar
  7) faz2_dogrulama.csv temiz mi bak    -> E:'deki dosyaların tam ve sağlam olduğunu teyit et
  8) Ancak bundan sonra D:\E_BIRLESTIRME silinebilir (Silme kararı kullanıcıya aittir)

Kullanım:
  Sınıflandırma Önizlemesi:
    python birlestir.py siniflandir --kaynak E:\ --hash-cache duplicate_report.html --dry-run

  Aşama 1 (Önizleme / Dry-Run):
    python birlestir.py faz1 --kaynak E:\ --hedef D:\E_BIRLESTIRME --duzen konu-tip --hash-cache duplicate_report.html

  Aşama 1 (Gerçek Aktarım):
    python birlestir.py faz1 --kaynak E:\ --hedef D:\E_BIRLESTIRME --duzen konu-tip --uygula --hash-cache duplicate_report.html

  Aşama 2 (Önizleme / Dry-Run):
    python birlestir.py faz2 --kaynak D:\E_BIRLESTIRME --hedef E:\

  Aşama 2 (Gerçek Aktarım):
    python birlestir.py faz2 --kaynak D:\E_BIRLESTIRME --hedef E:\ --uygula
================================================================================
"""

import os
import sys
import re
import csv
import time
import json
import sqlite3
import shutil
import hashlib
import argparse
import unicodedata
import ctypes
from pathlib import Path
from collections import defaultdict

# Windows konsolunda Unicode karakterlerin (emoji, ok simgesi vb.) çökmesini engelle
if hasattr(sys.stdout, 'reconfigure'):
    try: sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception: pass
if hasattr(sys.stderr, 'reconfigure'):
    try: sys.stderr.reconfigure(encoding='utf-8', errors='replace')
    except Exception: pass

# İlerleme çubuğu (tqdm varsa kullan, yoksa sade dahili sınıf)
try:
    from tqdm import tqdm
except ImportError:
    class tqdm:
        def __init__(self, iterable=None, total=None, desc="", unit="dosya", **kwargs):
            self.iterable = iterable
            self.total = total or (len(iterable) if iterable else 0)
            self.desc = desc
            self.unit = unit
            self.n = 0
            self.last_print = 0

        def __iter__(self):
            for item in self.iterable:
                yield item
                self.update(1)

        def update(self, n=1):
            self.n += n
            now = time.time()
            if now - self.last_print >= 0.5 or self.n == self.total:
                pct = (self.n / self.total * 100) if self.total else 0
                print(f"\r  {self.desc}: {self.n}/{self.total} [{pct:.1f}%] {self.unit}", end="", flush=True)
                self.last_print = now
                if self.n == self.total:
                    print("", flush=True)

        def close(self):
            pass

# ==============================================================================
# TİP VE KONU KURALLARI (KULLANICI TARAFINDAN KOLAYCA DÜZENLENEBİLİR)
# ==============================================================================

SINIFLANAMAYAN_KONU = "99_SINIFLANAMAYAN"
DIGER_TIP = "99_DİĞER"

TIP_KODLARI = {
    "01_BELGELER": [".doc", ".docx", ".pdf", ".odt", ".rtf", ".txt"],
    "02_TABLOLAR": [".xls", ".xlsx", ".xlsm", ".csv", ".ods"],
    "03_SUNUMLAR": [".ppt", ".pptx", ".odp"],
    "04_ÇİZİM_CAD_HARİTA": [".dwg", ".dxf", ".dwf", ".dgn", ".ncz", ".ncp", ".shp", ".kml", ".kmz"],
    "05_GÖRSELLER": [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff", ".webp", ".heic"],
    "06_TASARIM": [".psd", ".ai", ".cdr", ".eps", ".indd", ".svg"],
    "07_VİDEO": [".mp4", ".avi", ".mov", ".mkv", ".wmv", ".m4v"],
    "08_SES": [".mp3", ".wav", ".m4a"],
    "09_ARŞİVLER": [".zip", ".rar", ".7z", ".tar", ".gz"],
    "10_KURULUM_YAZILIM": [".exe", ".msi", ".iso"],
    DIGER_TIP: []   # Diğer her şey (bilinmeyen_uzantilar.csv'ye yazılır)
}

# Klasör adları kullanıcının mevcut arşiv düzenine göre numaralıdır (00..06 + ek konular).
# Anahtar kelimeler ASCII/küçük harf yazılır (metin_normalize ile eşleşir).
KONU_KURALLARI = {
    "00_KURUMSAL_MEDYA": [
        "logo", "kurumsal kimlik", "animasyon", "afis", "brosur", "tanitim",
        "basin", "medya", "sehit", "anma", "sosyal medya", "fotograf arsivi",
        "website", "tanitim filmi"
    ],
    "01_GENEL-YAZISMALAR": [
        "encumen", "meclis", "karar", "yazi", "yazisma", "dilekce",
        "evrak", "gelen", "giden", "talimat", "genelge", "ust yazi"
    ],
    "02_TAŞINMAZ_İŞLEMLERİ": [
        "tasinmaz", "tapu", "takyidat", "yer teslim", "satis sonrasi", "satis",
        "kiralama", "kira", "tahsis", "ecrimisil", "mulkiyet", "tescil",
        "ada", "parsel"
    ],
    "03_KAMULAŞTIRMA": [
        "kamulastirma", "istimlak", "bedel tespit", "kamu yarari",
        "kamulastirma anlasma", "anlasma tutanak"
    ],
    "04_İMAR_UYGULAMALARI": [
        "imar", "plan", "parselasyon", "18. madde", "18 madde", "3194",
        "nazim", "uygulama imar", "iskan", "yapi ruhsat", "ruhsat", "yapi denetim"
    ],
    "05_İFRAZ_TEVHİD_YOLA_TERK": [
        "ifraz", "tevhid", "yola terk", "terk", "ihdas", "cephe hatti"
    ],
    "06_İHALE_ve_ALIM_İŞLERİ": [
        "ihale", "sartname", "teknik sartname", "idari sartname",
        "sozlesme", "teklif", "yaklasik maliyet", "kesif", "metraj", "hakedis",
        "4734", "4735", "temin", "dogrudan temin", "ekap", "birim fiyat",
        "satinalma", "alim", "proforma", "sarf malzeme"
    ],
    "07_ALTYAPI_YOL_KANAL": [
        "yol", "asfalt", "kilit parke", "kaldirim", "kanalizasyon",
        "icme suyu", "su sebekesi", "yagmur suyu", "kanal", "altyapi", "imalat"
    ],
    "08_PARK_SPOR_SOSYAL_TESİS": [
        "park", "hali saha", "spor", "dugun salonu",
        "sosyal tesis", "cocuk oyun", "yesil alan", "peyzaj", "kres"
    ],
    "09_ZABİTA_DENETİM": [
        "zabita", "denetim", "tutanak", "isyeri", "ruhsat denetim"
    ],
    "10_PERSONEL_İDARİ": [
        "personel", "sekreter", "izin", "puantaj", "maas", "sgk"
    ],
    "11_KİŞİSEL_DİĞER": [
        "osym", "sorular", "kisisel"
    ],
    SINIFLANAMAYAN_KONU: []   # Hiçbirine uymayanlar veya çelişkili olanlar
}

GURULTU_KLASORLERI = {
    "yedek", "yedekler", "eski", "eski-pc", "backup", "kopya", "copy",
    "yeni klasor", "new folder", "desktop", "masaustu", "belgelerim",
    "indirilenler", "downloads", "public", "clips", "diger"
}

SISTEM_KLASORLERI = {
    "$recycle.bin",
    "system volume information",
    "found.000",
    "found.001",
    "found.002",
    ".trashes",
    ".gemini",
    # Yazılım projeleri ve araç çıktıları arşiv düzenine katılmaz (E:'de olduğu gibi kalır)
    "dizin-rapor",
    "temin-360-app",
    "node_modules",
    ".git",
    "__pycache__"
}

SISTEM_DOSYALARI = {
    "pagefile.sys",
    "hiberfil.sys",
    "swapfile.sys",
    "dumpstack.log",
    "dumpstack.log.tmp",
    "boottel.dat"
}

REZERVE_ISIMLER = {
    "CON", "PRN", "AUX", "NUL",
    "COM1", "COM2", "COM3", "COM4", "COM5", "COM6", "COM7", "COM8", "COM9",
    "LPT1", "LPT2", "LPT3", "LPT4", "LPT5", "LPT6", "LPT7", "LPT8", "LPT9"
}

# ==============================================================================
# YARDIMCI FONKSİYONLAR
# ==============================================================================

def boyut_formatla(bayt):
    """Bayt cinsinden boyutu okunabilir string formatına çevirir."""
    if bayt == 0:
        return "0 B"
    birimler = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    b = float(bayt)
    while b >= 1024.0 and i < len(birimler) - 1:
        b /= 1024.0
        i += 1
    return f"{b:.2f} {birimler[i]}"

def uzun_yol_onek(yol):
    r"""Windows MAX_PATH sınırını baypas etmek için yolun başına \\?\ ekler."""
    if not yol:
        return yol
    mutlak = os.path.abspath(yol)
    if os.name == 'nt' and not mutlak.startswith("\\\\?\\"):
        if mutlak.startswith("\\\\"):
            return "\\\\?\\UNC\\" + mutlak[2:]
        return "\\\\?\\" + mutlak
    return mutlak

def get_volume_fs(surucu_yolu):
    """Windows ctypes ile sürücünün dosya sistemini (NTFS, FAT32, exFAT) döner."""
    try:
        buf = ctypes.create_unicode_buffer(261)
        kok = os.path.splitdrive(os.path.abspath(surucu_yolu))[0] + "\\"
        res = ctypes.windll.kernel32.GetVolumeInformationW(
            kok, None, 0, None, None, None, buf, 261
        )
        if res:
            return buf.value
    except Exception:
        pass
    return "Bilinmiyor"

def dosya_sha256_hesapla(dosya_yolu, blok_boyutu=1024*1024):
    """Belirtilen dosyanın SHA-256 hash değerini 1 MB'lık parçalarla hesaplar."""
    h = hashlib.sha256()
    guvenli_yol = uzun_yol_onek(dosya_yolu)
    try:
        with open(guvenli_yol, "rb") as f:
            while True:
                parca = f.read(blok_boyutu)
                if not parca:
                    break
                h.update(parca)
        return h.hexdigest()
    except (PermissionError, OSError):
        return None

def isim_temizle(isim):
    """Windows yasaklı karakterleri, nokta ve boşlukları temizler."""
    isim = unicodedata.normalize('NFC', isim)
    isim = re.sub(r'[<>:"/\\|?*]', '_', isim)
    isim = "".join(ch for ch in isim if ord(ch) >= 32)
    isim = re.sub(r'\s+', ' ', isim).rstrip('. ')
    
    kok, ext = os.path.splitext(isim)
    if kok.upper() in REZERVE_ISIMLER:
        kok = f"{kok}_dosya"
        isim = kok + ext
        
    return isim or "adsiz"

def metin_normalize(metin):
    """Türkçe küçük harf ve ASCII indirgeme normalizasyonu."""
    if not metin:
        return ""
    s = metin.replace("İ", "i").replace("I", "ı").lower()
    donusum = str.maketrans("ışğüöç", "isguoc")
    s = s.translate(donusum)
    s = re.sub(r'[^a-z0-9]', ' ', s)
    s = re.sub(r'\s+', ' ', s).strip()
    return s

def tip_belirle(dosya_yolu):
    """Dosya uzantısına göre TIP_KODU döner."""
    ext = os.path.splitext(dosya_yolu)[1].lower()
    for tip_kodu, uzantilar in TIP_KODLARI.items():
        if ext in uzantilar:
            return tip_kodu, ext
    return DIGER_TIP, ext

def gurultu_mu(parca):
    """Tarih veya gürültü klasör kontrolü."""
    norm = metin_normalize(parca)
    if not norm or norm in GURULTU_KLASORLERI:
        return True
    if re.search(r'\b\d{2}[._-]\d{2}[._-]\d{4}\b', parca) or re.search(r'\b\d{4}[._-]\d{2}[._-]\d{2}\b', parca):
        return True
    if re.match(r'^[a-zA-Z]:?$', parca):
        return True
    return False

def hazirla_konu_regexleri():
    rx = {}
    for konu, kelimeler in KONU_KURALLARI.items():
        if konu == SINIFLANAMAYAN_KONU:
            continue
        rx[konu] = [(k, re.compile(rf"\b{re.escape(metin_normalize(k))}\b")) for k in kelimeler]
    return rx

KONU_REGEX = hazirla_konu_regexleri()

def konu_puanla(dosya_grubu_yollari):
    """Tüm kopya yollarını inceleyerek puanlama yapar."""
    konu_puanlari = defaultdict(float)
    konu_kelimeleri = defaultdict(set)

    for dosya_yolu in dosya_grubu_yollari:
        parcalar = Path(dosya_yolu).parts
        if not parcalar:
            continue

        dosya_adi = parcalar[-1]
        norm_dosya_adi = metin_normalize(dosya_adi)

        # 1. Dosya adı (1 puan)
        for konu, rx_list in KONU_REGEX.items():
            for k, pat in rx_list:
                if pat.search(norm_dosya_adi):
                    konu_puanlari[konu] += 1.0
                    konu_kelimeleri[konu].add(f"{k} (dosya)")

        # 2. Klasör adları (3 puan + derinlik katsayısı)
        klasor_parcalari = parcalar[:-1]
        toplam_derinlik = len(klasor_parcalari)

        for idx, kl_adi in enumerate(klasor_parcalari):
            if gurultu_mu(kl_adi):
                continue

            norm_kl_adi = metin_normalize(kl_adi)
            derinlik_agirlik = 1.0 + (idx / max(toplam_derinlik, 1)) * 0.5
            puan_baz = 3.0 * derinlik_agirlik

            for konu, rx_list in KONU_REGEX.items():
                for k, pat in rx_list:
                    if pat.search(norm_kl_adi):
                        konu_puanlari[konu] += puan_baz
                        konu_kelimeleri[konu].add(f"{k} (klasör)")

    sirali = sorted(konu_puanlari.items(), key=lambda x: x[1], reverse=True)

    if not sirali or sirali[0][1] <= 0.0:
        return SINIFLANAMAYAN_KONU, 0.0, [], True, "Hiçbir anahtar kelime eşleşmedi"

    en_iyi_konu, en_iyi_puan = sirali[0]
    en_iyi_kelimeler = sorted(list(konu_kelimeleri[en_iyi_konu]))

    if len(sirali) > 1:
        ikinci_konu, ikinci_puan = sirali[1]
        if en_iyi_puan > 0 and ((en_iyi_puan - ikinci_puan) / en_iyi_puan) < 0.20:
            aciklama = f"Puanlar birbirine çok yakın ({en_iyi_konu}: {en_iyi_puan:.1f} vs {ikinci_konu}: {ikinci_puan:.1f})"
            adaylar = [(k, round(p, 1), sorted(list(konu_kelimeleri[k]))) for k, p in sirali[:3]]
            return SINIFLANAMAYAN_KONU, en_iyi_puan, adaylar, True, aciklama

    return en_iyi_konu, round(en_iyi_puan, 2), en_iyi_kelimeler, False, "Başarılı eşleşme"

def sec_asil_kopya(kopya_listesi):
    """Aynı hash'e sahip dosyalardan asıl kopyayı seçer."""
    ceza_kelimeleri = ["eski", "yedek", "backup", "kopya", "copy", "temp", "tmp", "trash", "gecici"]

    def puanla(dosya_bilgisi):
        yol = dosya_bilgisi["path"].lower()
        mtime = dosya_bilgisi.get("mtime", time.time())
        ceza = sum(100 for k in ceza_kelimeleri if k in yol)
        derinlik = yol.count(os.sep)
        uzunluk = len(yol)
        return (ceza, derinlik, uzunluk, mtime)

    sirali = sorted(kopya_listesi, key=puanla)
    return sirali[0]

def akilli_yol_kisalt(hedef_kok, goreli_yol, max_path=240):
    """Hedef yolun uzunluğunu hesaplar ve max_path sınırını aşıyorsa akıllıca kısaltır."""
    parcalar = Path(goreli_yol).parts
    if not parcalar:
        return hedef_kok, False, ""

    dir_parcalari = [isim_temizle(p) for p in parcalar[:-1]]
    dosya_adi = isim_temizle(parcalar[-1])
    kok_ad, uzanti = os.path.splitext(dosya_adi)

    aday = os.path.join(hedef_kok, *dir_parcalari, dosya_adi)
    if len(aday) <= max_path:
        return aday, False, ""

    nedenler = []
    
    # 1. Aşama: Uzun klasörleri kısalt
    yeni_dirs = []
    for d in dir_parcalari:
        if len(d) > 18:
            d_hash = hashlib.sha256(d.encode('utf-8')).hexdigest()[:6]
            yeni_d = f"{d[:12]}~{d_hash}"
            nedenler.append(f"Klasör kısaltıldı: '{d[:20]}...' -> '{yeni_d}'")
            yeni_dirs.append(yeni_d)
        else:
            yeni_dirs.append(d)

    aday = os.path.join(hedef_kok, *yeni_dirs, dosya_adi)
    if len(aday) <= max_path:
        return aday, True, " | ".join(nedenler)

    # 2. Aşama: Klasörleri daha agresif kısalt
    yeni_dirs_agresif = []
    for d in yeni_dirs:
        if len(d) > 10:
            d_hash = hashlib.sha256(d.encode('utf-8')).hexdigest()[:6]
            yeni_d = f"{d[:5]}~{d_hash}"
            yeni_dirs_agresif.append(yeni_d)
        else:
            yeni_dirs_agresif.append(d)

    aday = os.path.join(hedef_kok, *yeni_dirs_agresif, dosya_adi)
    if len(aday) <= max_path:
        nedenler.append("Klasörler kompaktlaştırıldı")
        return aday, True, " | ".join(nedenler)

    # 3. Aşama: Dosya adını kısalt (Uzantıyı KORU)
    dir_yolu = os.path.join(hedef_kok, *yeni_dirs_agresif)
    kalan_alan = max_path - len(dir_yolu) - 1 - len(uzanti) - 8
    if kalan_alan < 4:
        kalan_alan = 4

    f_hash = hashlib.sha256(dosya_adi.encode('utf-8')).hexdigest()[:6]
    yeni_dosya_adi = f"{kok_ad[:kalan_alan]}_{f_hash}{uzanti}"
    nedenler.append(f"Dosya adı kısaltıldı: '{dosya_adi[:20]}...' -> '{yeni_dosya_adi}'")

    nihai_yol = os.path.join(dir_yolu, yeni_dosya_adi)
    return nihai_yol, True, " | ".join(nedenler)

def hash_cache_yukle(cache_yolu):
    """duplicate_report.html veya JSON dosyasından hash önbelleğini okur."""
    if not cache_yolu or not os.path.exists(cache_yolu):
        return {}

    cache = {}
    print(f"[*] Hash cache yükleniyor: {cache_yolu}", flush=True)
    try:
        dups = []
        if cache_yolu.lower().endswith(".json"):
            with open(cache_yolu, "r", encoding="utf-8") as f:
                data = json.load(f)
                dups = data.get("duplicates", [])
        else:
            with open(cache_yolu, "r", encoding="utf-8") as f:
                icerik = f.read()
            m = re.search(r'duplicateData\s*=\s*(\[.*?\]);', icerik, re.DOTALL)
            if not m:
                m = re.search(r'const\s+duplicateData\s*=\s*(\[.*?\]);', icerik, re.DOTALL)
            if m:
                dups = json.loads(m.group(1))

        for g in dups:
            h = g.get("hash")
            sz = g.get("size_bytes", 0)
            for f in g.get("files", []):
                p = f.get("path", "")
                if p and h:
                    cache[(p.lower(), sz)] = h

        print(f"[+] Cache'den {len(cache)} adet doğrulanmış dosya hash'i yüklendi.", flush=True)
    except Exception as e:
        print(f"[-] Cache okunurken hata: {e}", flush=True)

    return cache

# ==============================================================================
# ALT KOMUT: SINIFLANDIR
# ==============================================================================

def calistir_siniflandir(args):
    kaynak = os.path.abspath(args.kaynak)
    rapor_dizin = os.path.abspath(args.rapor_dizin or os.getcwd())
    os.makedirs(rapor_dizin, exist_ok=True)

    print("="*80, flush=True)
    print(" BİRLEŞTİR - KONU & TİP AKILLI SINIFLANDIRMA MOTORU", flush=True)
    print(f" Kaynak Disk: {kaynak}", flush=True)
    print(f" Rapor Dizini: {rapor_dizin}", flush=True)
    print("="*80, flush=True)

    cache = hash_cache_yukle(args.hash_cache)

    print(f"[*] {kaynak} taranıyor...", flush=True)
    dosya_listesi = []
    boyut_gruplari = defaultdict(list)
    t0 = time.time()

    for root, dirs, files in os.walk(kaynak):
        dirs[:] = [d for d in dirs if d.lower() not in SISTEM_KLASORLERI and not d.startswith("$")]
        for f in files:
            f_low = f.lower()
            if f_low in SISTEM_DOSYALARI or f.startswith("~$") or f_low.startswith("dumpstack"):
                continue
            tam_yol = os.path.join(root, f)
            try:
                st = os.stat(uzun_yol_onek(tam_yol))
                sz = st.st_size
                mt = st.st_mtime
                dosya_listesi.append({"path": tam_yol, "rel_path": os.path.relpath(tam_yol, kaynak), "size": sz, "mtime": mt})
                boyut_gruplari[sz].append(tam_yol)
            except (PermissionError, OSError):
                pass

    print(f"[+] Taranan toplam dosya: {len(dosya_listesi)} adet ({time.time()-t0:.2f} sn)", flush=True)

    hash_to_files = defaultdict(list)
    for item in dosya_listesi:
        p = item["path"]
        sz = item["size"]
        h = cache.get((p.lower(), sz))
        if not h:
            h = f"file_{sz}_{hashlib.md5(p.encode('utf-8', errors='ignore')).hexdigest()[:8]}"
        item["sha256"] = h
        hash_to_files[h].append(item)

    print("[*] Konu ve Tip puanlama algoritmaları çalıştırılıyor...", flush=True)
    siniflandirma_sonuclari = {}
    konu_ozet = defaultdict(lambda: {"dosya_sayisi": 0, "bayt": 0, "ornekler": []})
    gerekce_kayitlari = []
    elle_kontrol_kayitlari = []
    bilinmeyen_uzanti_kayitlari = defaultdict(int)

    for h, kopyalar in hash_to_files.items():
        asil = sec_asil_kopya(kopyalar)
        tum_yollar = [k["path"] for k in kopyalar]

        konu, puan, detay, elle_kontrol, aciklama = konu_puanla(tum_yollar)
        tip, ext = tip_belirle(asil["path"])
        if tip == DIGER_TIP:
            bilinmeyen_uzanti_kayitlari[ext] += 1

        if isinstance(detay, list):
            if detay and isinstance(detay[0], tuple):
                eslesenler_str = "; ".join(f"{k}: {p}p ({', '.join(w)})" for k, p, w in detay)
            else:
                eslesenler_str = ", ".join(str(x) for x in detay)
        else:
            eslesenler_str = str(detay)

        konu_ozet[konu]["dosya_sayisi"] += 1
        konu_ozet[konu]["bayt"] += asil["size"]
        if len(konu_ozet[konu]["ornekler"]) < 20:
            konu_ozet[konu]["ornekler"].append({
                "dosya": os.path.basename(asil["path"]),
                "yol": asil["path"],
                "tip": tip,
                "puan": puan,
                "eslesenler": eslesenler_str
            })

        entry = {
            "sha256": h,
            "asil_yol": asil["path"],
            "rel_path": asil["rel_path"],
            "boyut": asil["size"],
            "boyut_okunabilir": boyut_formatla(asil["size"]),
            "konu": konu,
            "tip": tip,
            "puan": puan,
            "elle_kontrol": elle_kontrol,
            "aciklama": aciklama,
            "eslesen_kelimeler": eslesenler_str,
            "tum_yollar": tum_yollar
        }
        siniflandirma_sonuclari[h] = entry

        gerekce_kayitlari.append({
            "dosya": asil["path"],
            "konu": konu,
            "tip": tip,
            "puan": puan,
            "eslesen_kelimeler": eslesenler_str,
            "elle_kontrol": "EVET" if elle_kontrol else "HAYIR",
            "kopya_adedi": len(kopyalar)
        })

        if elle_kontrol:
            elle_kontrol_kayitlari.append({
                "dosya": asil["path"],
                "konu": konu,
                "puan": puan,
                "aciklama": aciklama,
                "aday_puanlari": eslesenler_str
            })

    # Raporları Kaydet
    sinif_json = os.path.join(rapor_dizin, "siniflandirma.json")
    with open(sinif_json, "w", encoding="utf-8") as f:
        json.dump(siniflandirma_sonuclari, f, ensure_ascii=False, indent=2)
    print(f"[+] Sınıflandırma JSON kaydedildi: {sinif_json}", flush=True)

    gerekce_csv = os.path.join(rapor_dizin, "siniflandirma_gerekce.csv")
    with open(gerekce_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["dosya", "konu", "tip", "puan", "eslesen_kelimeler", "elle_kontrol", "kopya_adedi"])
        writer.writeheader()
        writer.writerows(gerekce_kayitlari)
    print(f"[+] Gerekçe CSV kaydedildi: {gerekce_csv}", flush=True)

    elle_csv = os.path.join(rapor_dizin, "elle_kontrol.csv")
    with open(elle_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["dosya", "konu", "puan", "aciklama", "aday_puanlari"])
        writer.writeheader()
        writer.writerows(elle_kontrol_kayitlari)
    print(f"[+] Elle Kontrol CSV kaydedildi ({len(elle_kontrol_kayitlari)} dosya): {elle_csv}", flush=True)

    if bilinmeyen_uzanti_kayitlari:
        bilinmeyen_csv = os.path.join(rapor_dizin, "bilinmeyen_uzantilar.csv")
        with open(bilinmeyen_csv, "w", newline="", encoding="utf-8-sig") as f:
            writer = csv.writer(f)
            writer.writerow(["uzanti", "dosya_adedi"])
            for ext, count in sorted(bilinmeyen_uzanti_kayitlari.items(), key=lambda x: x[1], reverse=True):
                writer.writerow([ext or "(uzantisiz)", count])
        print(f"[+] Bilinmeyen Uzantılar CSV kaydedildi: {bilinmeyen_csv}", flush=True)

    html_rapor = os.path.join(rapor_dizin, "siniflandirma_raporu.html")
    generate_classification_html(siniflandirma_sonuclari, konu_ozet, html_rapor)
    print(f"[+] İnteraktif HTML Raporu kaydedildi: {html_rapor}", flush=True)

    print("\n" + "="*80, flush=True)
    print(" [OZET] KONU BAZINDA DAGILIM TABLOSU", flush=True)
    print("="*80, flush=True)
    print(f"{'Konu Kodu':<30} | {'Dosya Adedi':<12} | {'Toplam Boyut':<14}", flush=True)
    print("-" * 62, flush=True)
    toplam_f = 0
    toplam_b = 0
    for k in sorted(KONU_KURALLARI.keys()):
        inf = konu_ozet[k]
        toplam_f += inf["dosya_sayisi"]
        toplam_b += inf["bayt"]
        print(f"{k:<30} | {inf['dosya_sayisi']:<12} | {boyut_formatla(inf['bayt']):<14}", flush=True)
    print("-" * 62, flush=True)
    print(f"{'TOPLAM':<30} | {toplam_f:<12} | {boyut_formatla(toplam_b):<14}", flush=True)
    print("="*80, flush=True)

    print("\n[ORNEKLER] HER KONUDAN 20'SER ORNEK DOSYA LISTESI:", flush=True)
    for k in sorted(KONU_KURALLARI.keys()):
        ornekler = konu_ozet[k]["ornekler"]
        if not ornekler:
            continue
        print(f"\n--- [{k}] (Toplam {konu_ozet[k]['dosya_sayisi']} dosya, ilk {len(ornekler)} ornek) ---", flush=True)
        for idx, ex in enumerate(ornekler, 1):
            eslesme = ex['eslesenler']
            if isinstance(eslesme, list):
                eslesme = ", ".join(eslesme[:4])
            dosya_temiz = str(ex['dosya'])[:45]
            print(f"  {idx:2d}. [{ex['tip']}] {dosya_temiz:<45} (Puan: {ex['puan']}, Neden: {eslesme})", flush=True)

# ==============================================================================
# İNDEKS DOSYALARI ÜRETİCİ (00_INDEKS.html & indeks.csv)
# ==============================================================================

def generate_index_files(plan_kayitlari, d_kok, e_kok, out_dir):
    """
    00_INDEKS.html ve indeks.csv dosyalarını üretir.
    Dosyaların Orijinal E: yolu, D: konumu ve yeni E: konumu haritalanır.
    """
    indeks_csv = os.path.join(out_dir, "indeks.csv")
    csv_rows = []

    for p in plan_kayitlari:
        d_path = p["hedef_yol"]
        rel = os.path.relpath(d_path, d_kok)
        e_path = os.path.join(e_kok, rel)

        csv_rows.append({
            "orijinal_e_yolu": p["kaynak_yol"],
            "d_konumu": d_path,
            "yeni_e_konumu": e_path,
            "konu": p["konu"],
            "tip": p["tip"],
            "boyut_bayt": p["boyut_bayt"],
            "boyut_okunabilir": p["boyut_okunabilir"],
            "sha256": p["sha256"]
        })

    with open(indeks_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["orijinal_e_yolu", "d_konumu", "yeni_e_konumu", "konu", "tip", "boyut_bayt", "boyut_okunabilir", "sha256"])
        writer.writeheader()
        writer.writerows(csv_rows)

    # 00_INDEKS.html
    html_path = os.path.join(out_dir, "00_INDEKS.html")
    rows_json = json.dumps(csv_rows[:1000], ensure_ascii=False)  # UI performansı için örnekler
    toplam_adet = len(csv_rows)
    toplam_boyut = sum(r["boyut_bayt"] for r in csv_rows)

    # --- Konu / Tip sayıları (tüm dosyalar üzerinden) ---
    konu_say = defaultdict(lambda: [0, 0])
    tip_say = defaultdict(lambda: [0, 0])
    matris = defaultdict(int)
    for r in csv_rows:
        konu_say[r["konu"]][0] += 1
        konu_say[r["konu"]][1] += r["boyut_bayt"]
        tip_say[r["tip"]][0] += 1
        tip_say[r["tip"]][1] += r["boyut_bayt"]
        matris[(r["konu"], r["tip"])] += 1

    konular_sirali = sorted(konu_say.keys())
    tipler_sirali = sorted(tip_say.keys())

    def _satirlar(sozluk):
        out = []
        for ad in sorted(sozluk.keys()):
            adet, bayt = sozluk[ad]
            yuzde = (adet / toplam_adet * 100) if toplam_adet else 0
            out.append(
                f'<tr><td><b>{ad}</b></td><td class="num">{adet}</td>'
                f'<td class="num">{boyut_formatla(bayt)}</td>'
                f'<td><div class="bar"><span style="width:{yuzde:.1f}%"></span></div></td>'
                f'<td class="num">%{yuzde:.1f}</td></tr>'
            )
        return "".join(out)

    konu_satirlari = _satirlar(konu_say)
    tip_satirlari = _satirlar(tip_say)

    matris_baslik = "<th>Konu \\ Tip</th>" + "".join(f'<th class="num">{t}</th>' for t in tipler_sirali) + '<th class="num">TOPLAM</th>'
    matris_govde = ""
    for k in konular_sirali:
        hucreler = "".join(
            f'<td class="num">{matris[(k, t)] or ""}</td>' for t in tipler_sirali
        )
        matris_govde += f'<tr><td><b>{k}</b></td>{hucreler}<td class="num"><b>{konu_say[k][0]}</b></td></tr>'
    alt_toplam = "".join(f'<td class="num"><b>{tip_say[t][0]}</b></td>' for t in tipler_sirali)
    matris_govde += f'<tr class="total"><td><b>TOPLAM</b></td>{alt_toplam}<td class="num"><b>{toplam_adet}</b></td></tr>'

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Arşiv İndeksi - {e_kok}</title>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #0b0f19; --card-bg: rgba(18, 24, 38, 0.95); --card-border: rgba(255, 255, 255, 0.08);
      --primary: #6366f1; --accent: #06b6d4; --text: #f3f4f6; --text-muted: #9ca3af;
    }}
    body {{ font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text); padding: 2rem; }}
    .container {{ max-width: 1500px; margin: 0 auto; }}
    h1 {{ font-size: 2.2rem; color: #fff; margin-bottom: 0.5rem; }}
    .badge {{ display: inline-block; padding: 0.2rem 0.5rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }}
    .badge-konu {{ background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }}
    .badge-tip {{ background: rgba(6, 182, 212, 0.2); color: #67e8f9; }}
    table {{ width: 100%; border-collapse: collapse; margin-top: 1.5rem; font-size: 0.85rem; background: var(--card-bg); border-radius: 12px; overflow: hidden; }}
    th, td {{ padding: 0.8rem 1rem; text-align: left; border-bottom: 1px solid rgba(255,255,255,0.05); }}
    th {{ background: rgba(0,0,0,0.3); color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; }}
    .path-mono {{ font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; word-break: break-all; }}
    .ozet-grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-top: 1.5rem; }}
    @media (max-width: 1000px) {{ .ozet-grid {{ grid-template-columns: 1fr; }} }}
    .num {{ text-align: right; font-variant-numeric: tabular-nums; }}
    .bar {{ background: rgba(255,255,255,0.06); border-radius: 6px; height: 8px; min-width: 120px; overflow: hidden; }}
    .bar span {{ display: block; height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); }}
    .matris-wrap {{ overflow-x: auto; }}
    tr.total td {{ background: rgba(99,102,241,0.12); }}
    h2 {{ margin: 2rem 0 0.2rem; font-size: 1.2rem; }}
    input {{ width: 100%; padding: 0.7rem 1rem; border-radius: 8px; border: 1px solid var(--card-border); background: #131b2e; color: #fff; margin-top: 1rem; }}
  </style>
</head>
<body>
  <div class="container">
    <h1>Düzenli Arşiv İndeksi ({toplam_adet} Dosya - {boyut_formatla(toplam_boyut)})</h1>
    <p style="color:var(--text-muted)">Bu indeks dosyası hem D: hem E: diskindeki dosya yollarını göstermektedir.</p>

    <div class="ozet-grid">
      <div>
        <h2>Konulara Göre ({len(konu_say)} klasör)</h2>
        <table><thead><tr><th>Konu Klasörü</th><th class="num">Dosya</th><th class="num">Boyut</th><th>Oran</th><th class="num">%</th></tr></thead>
        <tbody>{konu_satirlari}</tbody></table>
      </div>
      <div>
        <h2>Türlere Göre ({len(tip_say)} tür)</h2>
        <table><thead><tr><th>Tür Klasörü</th><th class="num">Dosya</th><th class="num">Boyut</th><th>Oran</th><th class="num">%</th></tr></thead>
        <tbody>{tip_satirlari}</tbody></table>
      </div>
    </div>

    <h2>Konu × Tür Dağılımı (dosya adedi)</h2>
    <div class="matris-wrap"><table><thead><tr>{matris_baslik}</tr></thead><tbody>{matris_govde}</tbody></table></div>

    <h2>Dosya Listesi</h2>
    <input type="text" id="searchInput" placeholder="Dosya adı, konu, tip veya yol ara...">
    <table>
      <thead>
        <tr>
          <th>Yeni E: Konumu</th>
          <th>D: Arşiv Konumu</th>
          <th>Konu</th>
          <th>Tip</th>
          <th>Boyut</th>
        </tr>
      </thead>
      <tbody id="tbody"></tbody>
    </table>
  </div>
  <script>
    const data = {rows_json};
    function render(q = '') {{
      const tb = document.getElementById('tbody');
      tb.innerHTML = '';
      const filtered = data.filter(d => !q || d.yeni_e_konumu.toLowerCase().includes(q) || d.konu.toLowerCase().includes(q) || d.tip.toLowerCase().includes(q));
      filtered.slice(0, 500).forEach(d => {{
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="path-mono" style="color:#38bdf8">${{d.yeni_e_konumu}}</td>
          <td class="path-mono" style="color:#9ca3af">${{d.d_konumu}}</td>
          <td><span class="badge badge-konu">${{d.konu}}</span></td>
          <td><span class="badge badge-tip">${{d.tip}}</span></td>
          <td>${{d.boyut_okunabilir}}</td>
        `;
        tb.appendChild(tr);
      }});
    }}
    document.getElementById('searchInput').oninput = (e) => render(e.target.value.toLowerCase().trim());
    render();
  </script>
</body>
</html>
"""
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(html)

    return indeks_csv, html_path

# ==============================================================================
# AŞAMA 1: FAZ 1 (KONU + TİP HİYERARŞİSİ İLE AKTARIM)
# ==============================================================================

def calistir_faz1(args):
    kaynak = os.path.abspath(args.kaynak)
    hedef = os.path.abspath(args.hedef)
    uygula = args.uygula
    max_path = args.max_path
    duzen = args.duzen
    rapor_dizin = os.path.abspath(args.rapor_dizin or os.getcwd())

    os.makedirs(rapor_dizin, exist_ok=True)
    os.makedirs(hedef, exist_ok=True)

    print("="*80, flush=True)
    print(" BİRLEŞTİR - AŞAMA 1: E: -> D: TEKİL AKTARIM (KONU + TİP)", flush=True)
    print(f" Mod: {'GERÇEK AKTARIM (--uygula)' if uygula else 'GÜVENLİ ÖNİZLEME (--dry-run)'}", flush=True)
    print(f" Kaynak Disk: {kaynak}", flush=True)
    print(f" Hedef Konum: {hedef}", flush=True)
    print(f" Dizin Düzeni: {duzen.upper()} (<{duzen.replace('-', '> <')}>)", flush=True)
    print(f" Maksimum Yol Sınırı: {max_path} karakter", flush=True)
    print("="*80, flush=True)

    toplam, kullanilan, hedef_bos = shutil.disk_usage(hedef)
    print(f"[*] Hedef sürücü boş alan: {boyut_formatla(hedef_bos)}", flush=True)

    sinif_json_path = os.path.join(rapor_dizin, "siniflandirma.json")
    if not os.path.exists(sinif_json_path):
        print("[!] 'siniflandirma.json' bulunamadı. Otomatik sınıflandırma başlatılıyor...", flush=True)
        calistir_siniflandir(args)

    with open(sinif_json_path, "r", encoding="utf-8") as f:
        sinif_haritasi = json.load(f)

    plan_kayitlari = []
    yol_esleme_kayitlari = []
    kullanilan_hedef_yollar = set()
    toplam_aktarilacak_bayt = 0
    kisaltilan_sayisi = 0

    for h, item in sinif_haritasi.items():
        src = item["asil_yol"]
        rel = item["rel_path"]
        sz = item["boyut"]
        konu = item["konu"]
        tip = item["tip"]

        toplam_aktarilacak_bayt += sz

        if duzen == "tip-konu":
            hedef_alt_kok = os.path.join(hedef, tip, konu)
        else:
            hedef_alt_kok = os.path.join(hedef, konu, tip)

        dest, kisaltildi, neden = akilli_yol_kisalt(hedef_alt_kok, rel, max_path=max_path)

        dest_low = dest.lower()
        if dest_low in kullanilan_hedef_yollar:
            kok, ext = os.path.splitext(dest)
            sayac = 2
            while f"{kok}_{sayac}{ext}".lower() in kullanilan_hedef_yollar:
                sayac += 1
            dest = f"{kok}_{sayac}{ext}"
            kisaltildi = True
            neden += f" | Çakışma önlendi (ek: _{sayac})"

        kullanilan_hedef_yollar.add(dest.lower())

        if kisaltildi:
            kisaltilan_sayisi += 1
            yol_esleme_kayitlari.append({
                "orijinal_yol": src,
                "yeni_yol": dest,
                "neden": neden,
                "sha256": h
            })

        plan_kayitlari.append({
            "kaynak_yol": src,
            "hedef_yol": dest,
            "konu": konu,
            "tip": tip,
            "boyut_bayt": sz,
            "boyut_okunabilir": boyut_formatla(sz),
            "sha256": h,
            "kisaltildi": "EVET" if kisaltildi else "HAYIR",
            "yol_uzunlugu": len(dest)
        })

    plan_csv = os.path.join(rapor_dizin, "plan.csv")
    with open(plan_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["kaynak_yol", "hedef_yol", "konu", "tip", "boyut_bayt", "boyut_okunabilir", "sha256", "kisaltildi", "yol_uzunlugu"])
        writer.writeheader()
        writer.writerows(plan_kayitlari)

    yol_csv = os.path.join(rapor_dizin, "yol_esleme.csv")
    with open(yol_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["orijinal_yol", "yeni_yol", "neden", "sha256"])
        writer.writeheader()
        writer.writerows(yol_esleme_kayitlari)

    ozet_txt = os.path.join(rapor_dizin, "ozet.txt")
    with open(ozet_txt, "w", encoding="utf-8") as f:
        f.write("=== BİRLEŞTİR - ÇALIŞMA ÖZETİ ===\n")
        f.write(f"Tarih: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"Mod: {'GERÇEK AKTARIM (--uygula)' if uygula else 'GÜVENLİ ÖNİZLEME (--dry-run)'}\n")
        f.write(f"Dizin Düzeni: {duzen}\n")
        f.write(f"Kaynak: {kaynak}\n")
        f.write(f"Hedef: {hedef}\n")
        f.write(f"Maksimum Yol Sınırı: {max_path} karakter\n")
        f.write(f"Aktarılacak Tekil Dosya: {len(plan_kayitlari)} adet ({boyut_formatla(toplam_aktarilacak_bayt)})\n")
        f.write(f"Kısaltılan Uzun Yol Sayısı: {kisaltilan_sayisi} adet\n")
        f.write(f"Hedef Sürücüde Kalan Boş Alan: {boyut_formatla(hedef_bos)}\n\n")
        f.write("DÖNGÜ SIRASI:\n")
        f.write("  1) faz1 --dry-run -> planı incele\n")
        f.write("  2) siniflandir --dry-run -> kuralları düzelt\n")
        f.write("  3) faz1 --uygula\n")
        f.write("  4) dogrulama_raporu.csv temiz mi bak\n")
        f.write("  5) E:'yi elle biçimlendir/temizle (script dokunmaz)\n")
        f.write("  6) faz2 --uygula\n")
        f.write("  7) faz2_dogrulama.csv temiz mi bak\n")
        f.write("  8) ancak bundan sonra D:\\E_BIRLESTIRME silinebilir\n")

    if not uygula:
        print("\n" + "="*80, flush=True)
        print(" GÜVENLİ ÖNİZLEME (DRY-RUN) TAMAMLANDI", flush=True)
        print("="*80, flush=True)
        print(f"Aktarılacak Tekil Dosya: {len(plan_kayitlari)} adet ({boyut_formatla(toplam_aktarilacak_bayt)})", flush=True)
        print(f"Kısaltılan Uzun Yol Sayısı: {kisaltilan_sayisi} adet", flush=True)
        print(f"Maksimum Yol Sınırını Aşan: 0 adet (Tüm yollar < {max_path} karakter)", flush=True)
        print(f"\nRapor Dosyaları:", flush=True)
        print(f"  - Plan Listesi: {plan_csv}", flush=True)
        print(f"  - Kısaltılan Yol Haritası: {yol_csv}", flush=True)
        print(f"  - Genel Özet: {ozet_txt}", flush=True)
        print(f"\nGerçek kopyalama işlemini başlatmak için:", flush=True)
        print(f"  python birlestir.py faz1 --kaynak {kaynak} --hedef {hedef} --duzen {duzen} --uygula", flush=True)
        print("="*80, flush=True)
        return

    # Gerçek Aktarım (--uygula)
    db_yolu = os.path.join(rapor_dizin, "durum.db")
    conn = sqlite3.connect(db_yolu)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS aktarim_durumu (
        sha256 TEXT PRIMARY KEY,
        kaynak_yol TEXT,
        hedef_yol TEXT,
        boyut INTEGER,
        mtime REAL,
        durum TEXT,
        hata TEXT,
        tarih TEXT
    )
    """)
    conn.commit()

    print("\n[*] Gerçek aktarım başlatılıyor (.part geçici dosya + hash doğrulamalı)...", flush=True)
    kopyalanan_kayitlari = []
    hata_kayitlari = []

    pbar = tqdm(plan_kayitlari, desc="Kopyalanıyor", unit="dosya")
    for item in pbar:
        src = item["kaynak_yol"]
        dest = item["hedef_yol"]
        sz = item["boyut_bayt"]
        h_beklenen = item["sha256"]
        
        try: mt = os.path.getmtime(uzun_yol_onek(src))
        except: mt = time.time()

        cursor.execute("SELECT durum FROM aktarim_durumu WHERE kaynak_yol = ? AND durum = 'TAMAMLANDI'", (src,))
        row = cursor.fetchone()
        if row and os.path.exists(uzun_yol_onek(dest)):
            kopyalanan_kayitlari.append({"kaynak": src, "hedef": dest, "boyut": sz, "sha256": h_beklenen, "durum": "ONCEDEN_TAMAMLANMIS"})
            continue

        part_dest = dest + ".part"
        guvenli_dest_dir = uzun_yol_onek(os.path.dirname(dest))
        os.makedirs(guvenli_dest_dir, exist_ok=True)

        guvenli_src = uzun_yol_onek(src)
        guvenli_part = uzun_yol_onek(part_dest)
        guvenli_final = uzun_yol_onek(dest)

        h_yeni = hashlib.sha256()
        try:
            with open(guvenli_src, "rb") as f_in, open(guvenli_part, "wb") as f_out:
                while True:
                    buf = f_in.read(1024*1024)
                    if not buf:
                        break
                    f_out.write(buf)
                    h_yeni.update(buf)

            nihai_hash = h_yeni.hexdigest()

            if not h_beklenen.startswith("file_") and not h_beklenen.startswith("unique_") and not h_beklenen.startswith("err_") and nihai_hash != h_beklenen:
                if os.path.exists(guvenli_part):
                    os.remove(guvenli_part)
                hata_msj = "Hash doğrulama uyuşmazlığı"
                hata_kayitlari.append({"kaynak": src, "hedef": dest, "hata": hata_msj})
                cursor.execute("INSERT OR REPLACE INTO aktarim_durumu VALUES (?, ?, ?, ?, ?, 'HATA', ?, datetime('now', 'localtime'))",
                               (nihai_hash, src, dest, sz, mt, hata_msj))
                conn.commit()
            else:
                os.utime(guvenli_part, (mt, mt))
                if os.path.exists(guvenli_final):
                    os.remove(guvenli_final)
                os.rename(guvenli_part, guvenli_final)

                cursor.execute("INSERT OR REPLACE INTO aktarim_durumu VALUES (?, ?, ?, ?, ?, 'TAMAMLANDI', '', datetime('now', 'localtime'))",
                               (nihai_hash, src, dest, sz, mt))
                conn.commit()

                kopyalanan_kayitlari.append({"kaynak": src, "hedef": dest, "boyut": sz, "sha256": nihai_hash, "durum": "BASARILI"})
        except Exception as e:
            if os.path.exists(guvenli_part):
                try: os.remove(guvenli_part)
                except: pass
            hata_kayitlari.append({"kaynak": src, "hedef": dest, "hata": str(e)})
            cursor.execute("INSERT OR REPLACE INTO aktarim_durumu VALUES (?, ?, ?, ?, ?, 'HATA', ?, datetime('now', 'localtime'))",
                           (h_beklenen, src, dest, sz, mt, str(e)))
            conn.commit()

    conn.close()

    # Kopyalananlar ve Hatalar CSV
    kop_csv = os.path.join(rapor_dizin, "kopyalanan.csv")
    with open(kop_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["kaynak", "hedef", "boyut", "sha256", "durum"])
        writer.writeheader()
        writer.writerows(kopyalanan_kayitlari)

    hata_csv = os.path.join(rapor_dizin, "hatalar.csv")
    with open(hata_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["kaynak", "hedef", "hata"])
        writer.writeheader()
        writer.writerows(hata_kayitlari)

    # 1. Aşama Doğrulama Raporu (dogrulama_raporu.csv)
    print("\n[*] E: -> D: Doğrulama Raporu üretiliyor...", flush=True)
    d_hash_map = {}
    d_toplam_boyut = 0
    d_dosya_sayisi = 0

    for root, dirs, files in os.walk(hedef):
        for f in files:
            p = os.path.join(root, f)
            sz = os.path.getsize(uzun_yol_onek(p))
            h = dosya_sha256_hesapla(p)
            if h:
                d_hash_map[h] = p
                d_toplam_boyut += sz
                d_dosya_sayisi += 1

    dogrulama_kayitlari = []
    eksik_sayisi = 0

    for item in plan_kayitlari:
        src = item["kaynak_yol"]
        h = dosya_sha256_hesapla(src)
        karsilik = d_hash_map.get(h)
        if karsilik:
            dogrulama_kayitlari.append({"e_dosyasi": src, "d_karsiligi": karsilik, "sha256": h, "durum": "DOGRULANDI"})
        else:
            eksik_sayisi += 1
            dogrulama_kayitlari.append({"e_dosyasi": src, "d_karsiligi": "YOK", "sha256": h or "HESAPLANAMADI", "durum": "EKSIK"})

    dog_csv = os.path.join(rapor_dizin, "dogrulama_raporu.csv")
    with open(dog_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["e_dosyasi", "d_karsiligi", "sha256", "durum"])
        writer.writeheader()
        writer.writerows(dogrulama_kayitlari)

    # Faz 1 Sonuç JSON (faz1_sonuc.json - Aşama 2 ön koşul kontrolü için)
    faz1_sonuc = {
        "tamamlanma_tarihi": time.strftime('%Y-%m-%d %H:%M:%S'),
        "kaynak": kaynak,
        "hedef": hedef,
        "dosya_sayisi": d_dosya_sayisi,
        "toplam_boyut": d_toplam_boyut,
        "toplam_boyut_okunabilir": boyut_formatla(d_toplam_boyut),
        "eksik_sayisi": eksik_sayisi,
        "tum_dogrulandi": (eksik_sayisi == 0)
    }
    faz1_json_path = os.path.join(rapor_dizin, "faz1_sonuc.json")
    with open(faz1_json_path, "w", encoding="utf-8") as f:
        json.dump(faz1_sonuc, f, ensure_ascii=False, indent=2)

    # İndeks Dosyalarını Oluştur (00_INDEKS.html & indeks.csv)
    indeks_csv, indeks_html = generate_index_files(plan_kayitlari, hedef, kaynak, rapor_dizin)
    # D:'deki hedefin köküne de kopyala
    try:
        shutil.copy2(indeks_csv, os.path.join(hedef, "indeks.csv"))
        shutil.copy2(indeks_html, os.path.join(hedef, "00_INDEKS.html"))
    except Exception:
        pass

    print("\n" + "="*80, flush=True)
    print(" AŞAMA 1 BAŞARIYLA TAMAMLANDI!", flush=True)
    print("="*80, flush=True)
    print(f"[+] Başarıyla Aktarılan: {len(kopyalanan_kayitlari)} dosya", flush=True)
    print(f"[-] Hata Alan Dosya: {len(hata_kayitlari)} dosya", flush=True)
    print(f"[+] Doğrulama Raporu: {dog_csv} ({'Eksiksiz Teyit Edildi' if eksik_sayisi == 0 else f'{eksik_sayisi} EKSIK'})", flush=True)
    print(f"[+] Faz 1 Sonuç Kartı: {faz1_json_path}", flush=True)
    print(f"[+] İndeks Dosyaları: {indeks_html} ve {indeks_csv}", flush=True)
    print("="*80, flush=True)

# ==============================================================================
# AŞAMA 2: FAZ 2 (D: -> E: GERİ AKTARIM)
# ==============================================================================

def calistir_faz2(args):
    kaynak = os.path.abspath(args.kaynak)  # D:\E_BIRLESTIRME
    hedef = os.path.abspath(args.hedef)    # E:\
    uygula = args.uygula
    bos_degil_onay = args.bos_degil_onay
    max_path = args.max_path
    rapor_dizin = os.path.abspath(args.rapor_dizin or os.getcwd())

    print("="*80, flush=True)
    print(" BİRLEŞTİR - AŞAMA 2: D: -> E: DÜZENLİ GERİ AKTARIM", flush=True)
    print(f" Mod: {'GERÇEK AKTARIM (--uygula)' if uygula else 'GÜVENLİ ÖNİZLEME (--dry-run)'}", flush=True)
    print(f" Kaynak Arşiv (D:): {kaynak}", flush=True)
    print(f" Hedef Sürücü (E:): {hedef}", flush=True)
    print("="*80, flush=True)

    # --------------------------------------------------------------------------
    # ÖN KOŞUL KONTROLLERİ (Biri bile başarısız olursa durur)
    # --------------------------------------------------------------------------

    # ÖN KOŞUL 1: dogrulama_raporu.csv mevcut mu ve eksiksiz mi?
    dog_csv_path = os.path.join(rapor_dizin, "dogrulama_raporu.csv")
    if not os.path.exists(dog_csv_path):
        print(f"[!] HATA (Ön Koşul 1): '{dog_csv_path}' bulunamadı!", flush=True)
        print("    Aşama 2'ye geçmeden önce Aşama 1'in (--uygula) başarıyla tamamlanması ve", flush=True)
        print("    doğrulama raporunun üretilmiş olması şarttır.", flush=True)
        sys.exit(1)

    with open(dog_csv_path, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        hatali_satirlar = [r for r in reader if r.get("durum") != "DOGRULANDI" or r.get("d_karsiligi") == "YOK"]

    if hatali_satirlar:
        print(f"[!] HATA (Ön Koşul 1): 'dogrulama_raporu.csv' içinde {len(hatali_satirlar)} adet eksik/uyuşmayan dosya var!", flush=True)
        print("    Tüm dosyalar D:'ye eksiksiz aktarılmadan Aşama 2 başlatılamaz.", flush=True)
        sys.exit(1)

    print("[+] [Ön Koşul 1 Başarılı]: 'dogrulama_raporu.csv' temiz ve tüm dosyalar teyitli.", flush=True)

    # ÖN KOŞUL 2: faz1_sonuc.json ile D:\E_BIRLESTIRME birebir uyuşuyor mu?
    faz1_json_path = os.path.join(rapor_dizin, "faz1_sonuc.json")
    if not os.path.exists(faz1_json_path):
        print(f"[!] HATA (Ön Koşul 2): '{faz1_json_path}' bulunamadı!", flush=True)
        sys.exit(1)

    with open(faz1_json_path, "r", encoding="utf-8") as f:
        faz1_data = json.load(f)

    # Kaynak D:\E_BIRLESTIRME dizinini tara ve say
    d_mevcut_dosyalar = []
    d_mevcut_boyut = 0
    for root, dirs, files in os.walk(kaynak):
        for f in files:
            # indeks dosyalarını kontrol boyutundan hariç tut
            if f in {"00_INDEKS.html", "indeks.csv"}:
                continue
            p = os.path.join(root, f)
            try:
                sz = os.path.getsize(uzun_yol_onek(p))
                d_mevcut_boyut += sz
                d_mevcut_dosyalar.append((p, sz))
            except Exception:
                pass

    beklenen_sayi = faz1_data.get("dosya_sayisi")
    beklenen_boyut = faz1_data.get("toplam_boyut")

    # Tolerans kontrolü (dosya sayısı ve toplam boyut birebir eşit olmalı)
    if len(d_mevcut_dosyalar) != beklenen_sayi or d_mevcut_boyut != beklenen_boyut:
        print(f"[!] HATA (Ön Koşul 2): {kaynak} içindeki dosya sayısı veya toplam boyut 'faz1_sonuc.json' ile uyuşmuyor!", flush=True)
        print(f"    Beklenen Dosya Sayısı: {beklenen_sayi} | Mevcut: {len(d_mevcut_dosyalar)}", flush=True)
        print(f"    Beklenen Toplam Boyut: {beklenen_boyut} ({boyut_formatla(beklenen_boyut)}) | Mevcut: {d_mevcut_boyut} ({boyut_formatla(d_mevcut_boyut)})", flush=True)
        print("    Aradan dosya silinmiş veya eklenmiş olabilir. Lütfen arşivi kontrol edin.", flush=True)
        sys.exit(1)

    print(f"[+] [Ön Koşul 2 Başarılı]: D:'deki arşiv bütünlüğü doğrulandı ({len(d_mevcut_dosyalar)} dosya, {boyut_formatla(d_mevcut_boyut)}).", flush=True)

    # ÖN KOŞUL 3: E: hedefi boş mu? (Sistem klasörleri hariç)
    e_mevcut_dosya_sayisi = 0
    for root, dirs, files in os.walk(hedef):
        dirs[:] = [d for d in dirs if d.lower() not in SISTEM_KLASORLERI and not d.startswith("$")]
        for f in files:
            f_low = f.lower()
            if f_low in SISTEM_DOSYALARI or f.startswith("~$") or f_low.startswith("dumpstack"):
                continue
            e_mevcut_dosya_sayisi += 1

    if e_mevcut_dosya_sayisi > 0:
        if not bos_degil_onay:
            print(f"[!] HATA (Ön Koşul 3): Hedef sürücü ({hedef}) boş değil! (İçinde {e_mevcut_dosya_sayisi} dosya tespit edildi)", flush=True)
            print("    Aşama 2 gereği E: sürücüsünün temiz veya elle biçimlendirilmiş olması beklenmektedir.", flush=True)
            print("    Eğer mevcut dosyaları koruyarak aktarmak istiyorsanız '--bos-degil-onay' parametresini ekleyiniz.", flush=True)
            print("    (Script hiçbir koşulda E:'deki mevcut bir dosyayı ezmez veya silmez).", flush=True)
            sys.exit(1)
        else:
            print(f"[!] UYARI: Hedef sürücüde {e_mevcut_dosya_sayisi} dosya mevcut ancak '--bos-degil-onay' verildi. Devam ediliyor...", flush=True)
    else:
        print(f"[+] [Ön Koşul 3 Başarılı]: Hedef sürücü ({hedef}) tertemiz ve boş.", flush=True)

    # ÖN KOŞUL 4: Dosya sistemi ve boş alan yeterli mi?
    fs_type = get_volume_fs(hedef)
    toplam_e, kullanilan_e, bos_e = shutil.disk_usage(hedef)
    print(f"[*] Hedef Dosya Sistemi: {fs_type} | Boş Alan: {boyut_formatla(bos_e)}", flush=True)

    gereken_alan = d_mevcut_boyut + (1024 * 1024 * 1024)  # 1 GB güvenlik payı
    if bos_e < gereken_alan:
        print(f"[!] HATA (Ön Koşul 4): {hedef} sürücüsünde yeterli boş alan yok!", flush=True)
        print(f"    Gereken Alan: {boyut_formatla(gereken_alan)}", flush=True)
        print(f"    Mevcut Boş:   {boyut_formatla(bos_e)}", flush=True)
        sys.exit(1)

    # FAT32 4 GB sınır kontrolü
    if fs_type.upper() == "FAT32":
        dort_gb_asanlar = [p for p, sz in d_mevcut_dosyalar if sz >= 4294967295]
        if dort_gb_asanlar:
            print(f"[!] HATA (Ön Koşul 4): {hedef} sürücüsü FAT32 formatında ve 4 GB'tan büyük {len(dort_gb_asanlar)} dosya var!", flush=True)
            print(f"    Örnek: {dort_gb_asanlar[0]} ({boyut_formatla(os.path.getsize(uzun_yol_onek(dort_gb_asanlar[0])) )})", flush=True)
            print("    FAT32 tek bir dosyada 4 GB'tan büyüğünü desteklemez.", flush=True)
            print(f"    Lütfen {hedef} sürücüsünü exFAT veya NTFS formatında biçimlendiriniz.", flush=True)
            sys.exit(1)
        else:
            print(f"[*] Bilgi: {hedef} sürücüsü FAT32 ancak tüm dosyalar 4 GB'ın altında olduğundan aktarım yapılabilir.", flush=True)

    print("[+] [Ön Koşul 4 Başarılı]: Dosya sistemi ve boş alan gereksinimleri karşılandı.", flush=True)

    # --------------------------------------------------------------------------
    # AKTARIM PLANI & GERÇEKLEŞTİRME
    # --------------------------------------------------------------------------

    faz2_plan = []
    for p, sz in d_mevcut_dosyalar:
        rel = os.path.relpath(p, kaynak)
        dest = os.path.join(hedef, rel)
        if len(dest) > max_path:
            print(f"[!] UYARI: Hedef yol uzunluğu {len(dest)} > {max_path}: {dest}", flush=True)
        faz2_plan.append({"kaynak": p, "hedef": dest, "boyut": sz, "rel": rel})

    if not uygula:
        print("\n" + "="*80, flush=True)
        print(" GÜVENLİ ÖNİZLEME (FAZ 2 DRY-RUN) TAMAMLANDI", flush=True)
        print("="*80, flush=True)
        print(f"D:'den E:'ye Aktarılacak Dosya: {len(faz2_plan)} adet ({boyut_formatla(d_mevcut_boyut)})", flush=True)
        print(f"Hedef Yapı: {hedef}<KONU_KODU>\\<TIP_KODU>\\<dosya_yolu>", flush=True)
        print(f"Tüm ön koşullar eksiksiz başarıyla doğrulandı.", flush=True)
        print(f"\nGerçek aktarımı başlatmak için:")
        print(f"  python birlestir.py faz2 --kaynak {kaynak} --hedef {hedef} --uygula", flush=True)
        print("="*80, flush=True)
        return

    # GERÇEK AKTARIM
    db_yolu = os.path.join(rapor_dizin, "durum_faz2.db")
    conn = sqlite3.connect(db_yolu)
    cursor = conn.cursor()
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS aktarim_faz2 (
        kaynak_yol TEXT PRIMARY KEY,
        hedef_yol TEXT,
        boyut INTEGER,
        sha256 TEXT,
        durum TEXT,
        tarih TEXT
    )
    """)
    conn.commit()

    print("\n[*] D: -> E: Düzenli aktarım başlatılıyor (.part geçici dosya + hash doğrulamalı)...", flush=True)
    pbar = tqdm(faz2_plan, desc="E'ye Aktarılıyor", unit="dosya")
    kopyalananlar = 0
    hatalar = []

    for item in pbar:
        src = item["kaynak"]
        dest = item["hedef"]
        sz = item["boyut"]

        try: mt = os.path.getmtime(uzun_yol_onek(src))
        except: mt = time.time()

        cursor.execute("SELECT durum FROM aktarim_faz2 WHERE kaynak_yol = ? AND durum = 'TAMAMLANDI'", (src,))
        row = cursor.fetchone()
        if row and os.path.exists(uzun_yol_onek(dest)):
            continue

        # Hedefte dosya zaten varsa ve bos_degil_onay verilmişse ezme
        if os.path.exists(uzun_yol_onek(dest)):
            continue

        part_dest = dest + ".part"
        guvenli_dest_dir = uzun_yol_onek(os.path.dirname(dest))
        os.makedirs(guvenli_dest_dir, exist_ok=True)

        guvenli_src = uzun_yol_onek(src)
        guvenli_part = uzun_yol_onek(part_dest)
        guvenli_final = uzun_yol_onek(dest)

        h_src = hashlib.sha256()
        h_dest = hashlib.sha256()

        try:
            with open(guvenli_src, "rb") as f_in, open(guvenli_part, "wb") as f_out:
                while True:
                    buf = f_in.read(1024*1024)
                    if not buf:
                        break
                    f_out.write(buf)
                    h_src.update(buf)
                    h_dest.update(buf)

            # Anlık eşzamanlı hash doğrulaması
            sha_kaynak = h_src.hexdigest()
            sha_hedef = h_dest.hexdigest()

            if sha_hedef == sha_kaynak:
                os.utime(guvenli_part, (mt, mt))
                os.rename(guvenli_part, guvenli_final)

                cursor.execute("INSERT OR REPLACE INTO aktarim_faz2 VALUES (?, ?, ?, ?, 'TAMAMLANDI', datetime('now', 'localtime'))",
                               (src, dest, sz, sha_kaynak))
                conn.commit()
                kopyalananlar += 1
            else:
                if os.path.exists(guvenli_part):
                    os.remove(guvenli_part)
                hatalar.append((src, dest, "Hash uyuşmazlığı"))
        except Exception as e:
            if os.path.exists(guvenli_part):
                try: os.remove(guvenli_part)
                except: pass
            hatalar.append((src, dest, str(e)))

    conn.close()

    # İndeks Dosyalarını E: köküne kopyala
    print("[*] 00_INDEKS.html ve indeks.csv E: köküne yerleştiriliyor...", flush=True)
    try:
        shutil.copy2(os.path.join(kaynak, "00_INDEKS.html"), os.path.join(hedef, "00_INDEKS.html"))
        shutil.copy2(os.path.join(kaynak, "indeks.csv"), os.path.join(hedef, "indeks.csv"))
    except Exception as e:
        print(f"[-] İndeks kopyalama notu: {e}", flush=True)

    # --------------------------------------------------------------------------
    # FAZ 2 SONU DOĞRULAMASI (faz2_dogrulama.csv)
    # --------------------------------------------------------------------------
    print("\n[*] Aşama 2 Doğrulama: D: ile E: baştan sona karşılaştırılıyor (SHA-256)...", flush=True)
    faz2_dogrulama_kayitlari = []
    faz2_eksik = 0

    pbar_v = tqdm(faz2_plan, desc="Doğrulanıyor", unit="dosya")
    for item in pbar_v:
        src = item["kaynak"]
        dest = item["hedef"]
        
        h_d = dosya_sha256_hesapla(src)
        h_e = dosya_sha256_hesapla(dest) if os.path.exists(uzun_yol_onek(dest)) else None

        if h_e and h_d == h_e:
            durum = "DOGRULANDI"
        else:
            durum = "EKSIK_VEYA_BOZUK"
            faz2_eksik += 1

        faz2_dogrulama_kayitlari.append({
            "d_dosyasi": src,
            "e_karsiligi": dest,
            "sha256_d": h_d,
            "sha256_e": h_e or "YOK",
            "durum": durum
        })

    faz2_csv = os.path.join(rapor_dizin, "faz2_dogrulama.csv")
    with open(faz2_csv, "w", newline="", encoding="utf-8-sig") as f:
        writer = csv.DictWriter(f, fieldnames=["d_dosyasi", "e_karsiligi", "sha256_d", "sha256_e", "durum"])
        writer.writeheader()
        writer.writerows(faz2_dogrulama_kayitlari)

    print("\n" + "="*80, flush=True)
    print(" AŞAMA 2 TAMAMLANDI!", flush=True)
    print("="*80, flush=True)
    print(f"[+] Başarıyla Yerleştirilen: {kopyalananlar} dosya", flush=True)
    print(f"[+] Karşılaştırma Raporu: {faz2_csv}", flush=True)
    if faz2_eksik == 0:
        print("[+] MÜKEMMEL: E: sürücüsündeki tüm dosyalar D: ile birebir SHA-256 eşleşti!", flush=True)
        print("    E: artık tamamen düzenli, tekil ve indeksli bir yapıya kavuştu.", flush=True)
        print(f"\n[!] DİKKAT: {kaynak} klasörü SİLİNMEMİŞTİR ve korunmaktadır.", flush=True)
        print("    Silmek tamamen sizin kararınızdır.", flush=True)
    else:
        print(f"[!] DİKKAT: {faz2_eksik} dosyada doğrulama hatası var! Lütfen {faz2_csv} dosyasını inceleyin.", flush=True)
    print("="*80, flush=True)

# ==============================================================================
# HTML RAPOR ÜRETİCİ (SINIFLANDIRMA DASHBOARD)
# ==============================================================================

def generate_classification_html(sinif_haritasi, konu_ozet, html_yolu):
    items = list(sinif_haritasi.values())
    items_json = json.dumps(items, ensure_ascii=False)
    ozet_json = json.dumps(konu_ozet, ensure_ascii=False)

    html = f"""<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>Belediye Fen İşleri - Konu & Tip Sınıflandırma Dashboard</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root {{
      --bg: #0b0f19; --card-bg: rgba(18, 24, 38, 0.9); --card-border: rgba(255, 255, 255, 0.08);
      --primary: #6366f1; --accent: #06b6d4; --warning: #f59e0b; --danger: #ef4444; --success: #10b981;
      --text: #f3f4f6; --text-muted: #9ca3af;
    }}
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{
      font-family: 'Plus Jakarta Sans', sans-serif; background: var(--bg); color: var(--text);
      line-height: 1.6; padding: 2.5rem 1.5rem 5rem;
      background-image: radial-gradient(at 0% 0%, rgba(99, 102, 241, 0.15) 0px, transparent 50%),
                        radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.12) 0px, transparent 50%);
      background-attachment: fixed; min-height: 100vh;
    }}
    .container {{ max-width: 1450px; margin: 0 auto; }}
    header {{ margin-bottom: 2rem; border-bottom: 1px solid var(--card-border); padding-bottom: 1.5rem; }}
    h1 {{ font-size: 2.2rem; font-weight: 800; color: #fff; }}
    .subtitle {{ color: var(--text-muted); font-size: 0.95rem; }}
    .summary-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 2rem; }}
    .summary-card {{ background: var(--card-bg); border: 1px solid var(--card-border); padding: 1.25rem; border-radius: 14px; cursor: pointer; transition: all 0.2s; }}
    .summary-card:hover, .summary-card.active {{ border-color: var(--primary); transform: translateY(-2px); background: rgba(99, 102, 241, 0.1); }}
    .card-title {{ font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }}
    .card-val {{ font-size: 1.6rem; font-weight: 800; color: #fff; margin: 0.25rem 0; }}
    .card-sub {{ font-size: 0.8rem; color: var(--accent); }}
    .controls {{ display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; background: var(--card-bg); border: 1px solid var(--card-border); padding: 1.2rem; border-radius: 14px; }}
    .search-box {{ flex: 1; min-width: 280px; }}
    .search-box input {{ width: 100%; background: rgba(11, 15, 25, 0.8); border: 1px solid var(--card-border); padding: 0.65rem 1rem; border-radius: 8px; color: #fff; font-size: 0.9rem; outline: none; }}
    .select-group {{ display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; }}
    select {{ background: rgba(11, 15, 25, 0.8); border: 1px solid var(--card-border); color: #fff; padding: 0.6rem 0.9rem; border-radius: 8px; outline: none; font-size: 0.85rem; }}
    .btn-filter {{ background: rgba(255, 255, 255, 0.05); border: 1px solid var(--card-border); color: var(--text-muted); padding: 0.6rem 1rem; border-radius: 8px; font-size: 0.85rem; font-weight: 600; cursor: pointer; transition: all 0.2s; }}
    .btn-filter.active {{ background: var(--danger); border-color: var(--danger); color: #fff; }}
    .table-container {{ background: var(--card-bg); border: 1px solid var(--card-border); border-radius: 16px; overflow: hidden; }}
    table {{ width: 100%; border-collapse: collapse; font-size: 0.85rem; }}
    th, td {{ padding: 0.85rem 1.1rem; text-align: left; border-bottom: 1px solid rgba(255, 255, 255, 0.05); }}
    th {{ background: rgba(0, 0, 0, 0.35); color: var(--text-muted); font-weight: 700; text-transform: uppercase; font-size: 0.75rem; }}
    tr:hover td {{ background: rgba(255, 255, 255, 0.02); }}
    .badge {{ display: inline-block; padding: 0.2rem 0.55rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }}
    .badge-konu {{ background: rgba(99, 102, 241, 0.2); color: #a5b4fc; }}
    .badge-tip {{ background: rgba(6, 182, 212, 0.2); color: #67e8f9; }}
    .badge-warn {{ background: rgba(239, 68, 68, 0.2); color: #f87171; }}
    .path-text {{ font-family: 'JetBrains Mono', monospace; font-size: 0.8rem; color: #e2e8f0; word-break: break-all; }}
    .alt-paths {{ margin-top: 0.35rem; font-size: 0.75rem; color: var(--text-muted); }}
    .score-badge {{ font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #fbbf24; }}
    .reason-text {{ font-size: 0.78rem; color: #94a3b8; }}
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>Belediye Fen İşleri Sınıflandırma Raporu</h1>
      <p class="subtitle">İçerik Hash Doğrulamalı Konu + Tip Dağılımı ve Gerekçe Analizi</p>
    </header>

    <div class="summary-grid" id="summaryGrid"></div>

    <div class="controls">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="Dosya adı, yol, gerekçe veya kelime ara...">
      </div>
      <div class="select-group">
        <select id="konuSelect"><option value="">Tüm Konular</option></select>
        <select id="tipSelect"><option value="">Tüm Tipler</option></select>
        <button class="btn-filter" id="btnElleKontrol">⚠️ Sadece Elle Kontrol Gerekenler</button>
      </div>
    </div>

    <div class="table-container">
      <table>
        <thead>
          <tr>
            <th style="width: 32%;">Dosya / Orijinal Yol</th>
            <th style="width: 15%;">Konu</th>
            <th style="width: 13%;">Tip</th>
            <th style="width: 8%;">Boyut</th>
            <th style="width: 6%;">Puan</th>
            <th style="width: 26%;">Sınıflandırma Gerekçesi</th>
          </tr>
        </thead>
        <tbody id="tableBody"></tbody>
      </table>
    </div>
  </div>

  <script>
    const allData = {items_json};
    const summaryData = {ozet_json};

    let currentKonu = '';
    let currentTip = '';
    let searchQ = '';
    let onlyManual = false;

    const grid = document.getElementById('summaryGrid');
    Object.keys(summaryData).sort().forEach(k => {{
      const d = summaryData[k];
      const card = document.createElement('div');
      card.className = 'summary-card';
      card.innerHTML = `
        <div class="card-title">${{k}}</div>
        <div class="card-val">${{d.dosya_sayisi}}</div>
        <div class="card-sub">${{formatBytes(d.bayt)}}</div>
      `;
      card.onclick = () => {{
        document.querySelectorAll('.summary-card').forEach(c => c.classList.remove('active'));
        if (currentKonu === k) {{
          currentKonu = '';
          document.getElementById('konuSelect').value = '';
        }} else {{
          currentKonu = k;
          card.classList.add('active');
          document.getElementById('konuSelect').value = k;
        }}
        render();
      }};
      grid.appendChild(card);
    }});

    const konuSel = document.getElementById('konuSelect');
    Object.keys(summaryData).sort().forEach(k => {{
      const opt = document.createElement('option');
      opt.value = k;
      opt.textContent = `${{k}} (${{summaryData[k].dosya_sayisi}})`;
      konuSel.appendChild(opt);
    }});

    const tipSel = document.getElementById('tipSelect');
    const tipCounts = {{}};
    allData.forEach(d => tipCounts[d.tip] = (tipCounts[d.tip] || 0) + 1);
    Object.keys(tipCounts).sort().forEach(t => {{
      const opt = document.createElement('option');
      opt.value = t;
      opt.textContent = `${{t}} (${{tipCounts[t]}})`;
      tipSel.appendChild(opt);
    }});

    function formatBytes(bytes) {{
      if (!bytes) return '0 B';
      const k = 1024, dm = 2, sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }}

    function render() {{
      const tbody = document.getElementById('tableBody');
      tbody.innerHTML = '';

      const filtered = allData.filter(d => {{
        if (currentKonu && d.konu !== currentKonu) return false;
        if (currentTip && d.tip !== currentTip) return false;
        if (onlyManual && !d.elle_kontrol) return false;
        if (searchQ) {{
          const q = searchQ.toLowerCase();
          return d.asil_yol.toLowerCase().includes(q) || (d.aciklama || '').toLowerCase().includes(q) || d.konu.toLowerCase().includes(q);
        }}
        return true;
      }});

      filtered.slice(0, 150).forEach(d => {{
        const tr = document.createElement('tr');
        const badgeClass = d.elle_kontrol ? 'badge-warn' : 'badge-konu';
        const altText = d.tum_yollar.length > 1 ? `<div class="alt-paths">🔗 +${{d.tum_yollar.length - 1}} kopya yolu tarandı</div>` : '';

        tr.innerHTML = `
          <td><div class="path-text">${{d.asil_yol}}</div>${{altText}}</td>
          <td><span class="badge ${{badgeClass}}">${{d.konu}}</span></td>
          <td><span class="badge badge-tip">${{d.tip}}</span></td>
          <td>${{d.boyut_okunabilir}}</td>
          <td><span class="score-badge">${{d.puan}}</span></td>
          <td class="reason-text">
            ${{d.elle_kontrol ? '<span class="badge badge-warn">⚠️ ELLE KONTROL</span> ' : ''}}
            ${{d.aciklama}}
          </td>
        `;
        tbody.appendChild(tr);
      }});
    }}

    konuSel.onchange = (e) => {{ currentKonu = e.target.value; render(); }};
    tipSel.onchange = (e) => {{ currentTip = e.target.value; render(); }};
    document.getElementById('searchInput').oninput = (e) => {{ searchQ = e.target.value.trim(); render(); }};
    
    const btnElle = document.getElementById('btnElleKontrol');
    btnElle.onclick = () => {{
      onlyManual = !onlyManual;
      btnElle.classList.toggle('active', onlyManual);
      render();
    }};

    render();
  </script>
</body>
</html>
"""
    with open(html_yolu, "w", encoding="utf-8") as f:
        f.write(html)

# ==============================================================================
# CLI VE ANA GİRİŞ NOKTASI
# ==============================================================================

def main():
    parser = argparse.ArgumentParser(
        description="Windows 10/11 İçin Akıllı Disk Birleştirme ve Tekilleştirme Aracı",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )
    subparsers = parser.add_subparsers(dest="komut", help="Çalıştırılacak Alt Komut")

    # siniflandir
    p_sinif = subparsers.add_parser("siniflandir", help="Konu ve Tip Sınıflandırması Testi ve Raporu")
    p_sinif.add_argument("--kaynak", default="E:\\", help="Kaynak sürücü (Varsayılan: E:\\)")
    p_sinif.add_argument("--hash-cache", default="duplicate_report.html", help="Hash önbelleği için dosya")
    p_sinif.add_argument("--rapor-dizin", default="", help="Rapor dizini (Varsayılan: Mevcut dizin)")
    p_sinif.add_argument("--dry-run", action="store_true", default=True, help="Önizleme modu")

    # faz1
    p_faz1 = subparsers.add_parser("faz1", help="Aşama 1: E: -> D: Tekil Aktarım (Konu + Tip)")
    p_faz1.add_argument("--kaynak", default="E:\\", help="Kaynak sürücü (Varsayılan: E:\\)")
    p_faz1.add_argument("--hedef", default="D:\\E_BIRLESTIRME", help="Hedef dizin (Varsayılan: D:\\E_BIRLESTIRME)")
    p_faz1.add_argument("--duzen", choices=["konu-tip", "tip-konu"], default="konu-tip", help="Klasör hiyerarşisi düzeni (Varsayılan: konu-tip)")
    p_faz1.add_argument("--uygula", action="store_true", help="Gerçek aktarımı başlat (verilmezse dry-run önizleme yapar)")
    p_faz1.add_argument("--max-path", type=int, default=240, help="Maksimum izin verilen yol uzunluğu (Varsayılan: 240)")
    p_faz1.add_argument("--hash-cache", default="duplicate_report.html", help="Hash önbelleği için dosya")
    p_faz1.add_argument("--rapor-dizin", default="", help="Raporların yazılacağı dizin")

    # faz2
    p_faz2 = subparsers.add_parser("faz2", help="Aşama 2: D: -> E: Düzenli Yapıyı Geri Yerleştirme")
    p_faz2.add_argument("--kaynak", default="D:\\E_BIRLESTIRME", help="Kaynak arşiv dizini (Varsayılan: D:\\E_BIRLESTIRME)")
    p_faz2.add_argument("--hedef", default="E:\\", help="Hedef sürücü (Varsayılan: E:\\)")
    p_faz2.add_argument("--uygula", action="store_true", help="Gerçek aktarımı başlat (verilmezse dry-run önizleme yapar)")
    p_faz2.add_argument("--bos-degil-onay", action="store_true", help="E: hedefi boş değilse bile devam et (ezme/silme yapılmaz)")
    p_faz2.add_argument("--max-path", type=int, default=240, help="Maksimum izin verilen yol uzunluğu (Varsayılan: 240)")
    p_faz2.add_argument("--rapor-dizin", default="", help="Raporların yazılacağı dizin")

    args = parser.parse_args()

    if args.komut == "siniflandir":
        calistir_siniflandir(args)
    elif args.komut == "faz1":
        calistir_faz1(args)
    elif args.komut == "faz2":
        calistir_faz2(args)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
