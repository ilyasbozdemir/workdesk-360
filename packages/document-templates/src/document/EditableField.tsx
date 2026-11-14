import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useLayoutEffect,
} from "react";
import { useTemplateEdit } from "./TemplateEditContext";

export const FIELD_SOURCE_INFO: Record<string, string> = {
  evrakSayisi:
    "ℹ️ Kurum DETSİS Kodu + SDP Kodu + Dosya Numarasından otomatik üretilir. İsterseniz buradan elle değiştirebilirsiniz.",
  tarih:
    "ℹ️ Varsayılanı dosya tarihidir. Tıklayarak veya takvimden değiştirebilirsiniz.",
  onayaSunulanTarih:
    "ℹ️ Varsayılanı dosya tarihidir. Tıklayarak veya takvimden değiştirebilirsiniz.",
  onayTarihi:
    "ℹ️ Varsayılanı onay tarihidir. Tıklayarak veya takvimden değiştirebilirsiniz.",
  dosyaTarihi: "ℹ️ Dosya Açılış / Oluşturulma Tarihi alanından çekilir.",
  hazirlayanPersonelAdi:
    "ℹ️ Dosya Detayı -> Hazırlayan Personel ayarından çekilir. 'Personel Seç' menüsünden de değiştirebilirsiniz.",
  hazirlayanPersonelUnvan: "ℹ️ Seçilen Hazırlayan Personelin unvanıdır.",
  talepEdenPersonelAdi:
    "ℹ️ Dosya Detayı -> Talep Eden / Hazırlayan Personel ayarından çekilir. 'Personel Seç' menüsünden de değiştirebilirsiniz.",
  talepEdenPersonelUnvan: "ℹ️ Seçilen Talep Eden Personelin unvanıdır.",
  onaylayanPersonelAdi:
    "ℹ️ Dosya Detayı -> Onaylayan Personel (Harcama Yetkilisi) ayarından çekilir. 'Personel Seç' menüsünden de değiştirebilirsiniz.",
  onaylayanPersonelUnvan: "ℹ️ Seçilen Onaylayan Personelin unvanıdır.",
  ihtiyacYeri:
    "ℹ️ Dosya Detayı -> İhtiyaç Yeri veya Kurum Ayarları -> Harcama Birimi alanından çekilir.",
  gerekce: "ℹ️ Dosya Detayı -> İşin Açıklaması / Gerekçesi alanından çekilir.",
  aciklama: "ℹ️ Dosya Detayı -> İşin Açıklaması alanından çekilir.",
  isinAciklamasi: "ℹ️ Dosya Detayı -> İşin Açıklaması alanından çekilir.",
  isAdi: "ℹ️ Dosya Detayı -> Konu / İşin Adı alanından çekilir.",
  dosyaKonusu: "ℹ️ Dosya Detayı -> Konu alanından çekilir.",
  sunulacakMakamAdi:
    "ℹ️ Kurum Ayarları -> Sunulacak Makam Adı alanından çekilir.",
  maddeNo: "ℹ️ İhale / Doğrudan Temin Usulü (Örn: 22/d) alanından çekilir.",
  harcamaYetkilisiAdi:
    "ℹ️ Kurum veya Birim Harcama Yetkilisinin adıdır.",
  harcamaYetkilisiUnvan:
    "ℹ️ Harcama Yetkilisinin resmî unvanıdır.",
  gerceklestirmeGorevlisiAdi:
    "ℹ️ Birim Gerçekleştirme Görevlisinin adıdır.",
  gerceklestirmeGorevlisiUnvan:
    "ℹ️ Gerçekleştirme Görevlisinin unvanıdır.",
  mudurluk: "ℹ️ Dosyanın ait olduğu Harcama Birimi / Müdürlük adıdır.",
  harcamaBirimi: "ℹ️ Kurum bütçesindeki Harcama Birimidir.",
  kurumAdi: "ℹ️ Kurum Ayarları -> Kurum Adı alanından çekilir.",
  kurumUst: "ℹ️ Kurum Ayarları -> Üst Kurum (Bakanlık / Valilik) alanından çekilir.",
  teminNo: "ℹ️ Doğrudan temin takip numarasıdır (Örn: 2026/1).",
  dosyaNo: "ℹ️ Dosya kayıt ve arşiv numarasıdır.",
  butceYili: "ℹ️ Dosyanın bütçe ve işlem yılıdır.",
  ihaleSekli: "ℹ️ Alım usulü ve kanun dayanağı maddesidir (4734 Sayılı KİK).",
  alimUsulu: "ℹ️ Alım yöntemidir (Doğrudan Temin / Pazarlık vb.).",
  isinSuresi: "ℹ️ İşin tamamlanma veya malın teslim süresidir.",
  teslimYeri: "ℹ️ Malın teslim edileceği veya işin ifa edileceği yerdir.",
  yaklasikMaliyet: "ℹ️ Yaklaşık Maliyet Cetvelinde hesaplanan KDV hariç toplam tutardır.",
  yaklasikMaliyetYaziyla: "ℹ️ Yaklaşık maliyet tutarının Türkçe metinle yazılış şeklidir.",
  teklifTutari: "ℹ️ İlgili firmanın teklif ettiği toplam bedeldir.",
  sozlesmeBedeli: "ℹ️ Yüklenici ile akdedilen sözleşme bedelidir.",
  muayeneTarihi: "ℹ️ Muayene ve Kabul Komisyonunun inceleme tarihidir.",
  kararTarihi: "ℹ️ İhale / Doğrudan Temin onay ve karar tarihidir.",
  faturaNo: "ℹ️ Yüklenici tarafından düzenlenen fatura numarasıdır.",
  faturaTarihi: "ℹ️ Faturanın düzenleme tarihidir.",
  altNotlar:
    "ℹ️ Belge alt notları ve uyarılarıdır. Tıklayarak düzenleyebilirsiniz.",
  ekler: "ℹ️ Belgeye eklenen teknik şartname ve ek bilgisidir.",
  tasinirTarihi: "ℹ️ Taşınır Kayıt Yetkilisi görüş tarihidir.",
};

const SINGLE_LINE_FIELD_NAMES = new Set([
  "tarih",
  "belgetarihi",
  "onaytarihi",
  "olurtarihi",
  "dosyatarihi",
  "tasinirtarihi",
  "onayasulanantarih",
  "evraksayisi",
  "sayi",
  "kod",
  "maddeno",
  "vergino",
  "tckimlikno",
  "telefon",
  "faks",
  "eposta",
  "geneltoplam",
  "kdv",
  "toplam",
  "fiyat",
  "birimfiyat",
  "tutar",
]);

export interface EditableFieldProps {
  name?: string;
  value?: string;
  onChange?: (newValue: string) => void;
  placeholder?: string;
  multiline?: boolean;
  options?: string[];
  selectOptions?: string[];
  style?: React.CSSProperties;
  className?: string;
  isEditing?: boolean;
  title?: string;
}

/**
 * DOM düğümünden temiz, normalize edilmiş düz metin çıkarır.
 * Satır sonlarını (\n) ve paragrafları korur, gereksiz HTML etiketlerini ve fantom satır sonlarını temizler.
 */
export function extractCleanText(el: HTMLElement): string {
  let text = el.innerText;
  if (text === undefined || text === null) {
    text = el.textContent || "";
  }
  // CRLF ve CR karakterlerini standart LF (\n) karakterine çevir
  text = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // Bölünemez boşlukları standart boşluğa çevir
  text = text.replace(/\u00a0/g, " ");

  // Chromium contentEditable boş kaldığında arkasında tek bir '\n' bırakabilir
  if (text === "\n") {
    text = "";
  }
  return text;
}

/**
 * DOM düğümünün metin içeriğini güvenli biçimde günceller.
 */
export function setElementText(el: HTMLElement, text: string) {
  el.innerText = text;
}

export function EditableField({
  name,
  value = "",
  onChange,
  placeholder = "......",
  multiline,
  options,
  selectOptions,
  style = {},
  className = "",
  isEditing,
  title,
}: EditableFieldProps) {
  const context = useTemplateEdit();
  const [isFocused, setIsFocused] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const availableOptions = options || selectOptions;
  const activeEditing = isEditing !== undefined ? isEditing : context.isEditing;
  const activeOnChange =
    onChange ||
    (name && context.onFieldChange
      ? (val: string) => context.onFieldChange!(name, val)
      : undefined);

  const safeValue =
    value === "[]" || value === '[""]' ? "" : value === undefined || value === null ? "" : String(value);

  // Tek satırlı / çok satırlı alan tespiti
  const isExplicitSingle =
    multiline === false ||
    (multiline === undefined &&
      Boolean(name && SINGLE_LINE_FIELD_NAMES.has(name.toLowerCase())));
  const allowMultiline = multiline === true || !isExplicitSingle;

  // DOM referansı ve odak durumu takibi
  const elementRef = useRef<HTMLSpanElement | null>(null);
  const isFocusedRef = useRef(false);
  const lastReportedValueRef = useRef(safeValue);

  // Dışarıdan gelen veri değişikliklerini (şablon değişimi, veritabanından yenileme)
  // kullanıcı aktif olarak yazmıyorken DOM'a senkronize et
  useEffect(() => {
    if (!isFocusedRef.current && elementRef.current) {
      const currentDomText = extractCleanText(elementRef.current);
      if (currentDomText !== safeValue) {
        setElementText(elementRef.current, safeValue);
      }
    }
    lastReportedValueRef.current = safeValue;
  }, [safeValue]);

  // İlk renderda veya DOM düğümü bağlandığında metni yerleştir
  const setRef = useCallback(
    (node: HTMLSpanElement | null) => {
      elementRef.current = node;
      if (node && !isFocusedRef.current) {
        const currentDomText = extractCleanText(node);
        if (currentDomText !== lastReportedValueRef.current) {
          setElementText(node, lastReportedValueRef.current);
        }
      }
    },
    []
  );

  // Salt okunur (PDF derleme veya önizleme modu kapalı) durumu
  if (!activeEditing || !activeOnChange) {
    return (
      <span
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
          ...style,
        }}
        className={className}
        data-field-name={name}
      >
        {safeValue}
      </span>
    );
  }

  const tooltipText =
    title ||
    (name ? FIELD_SOURCE_INFO[name] : undefined) ||
    `ℹ️ Tıklayarak '${placeholder || name || "alanı"}' doğrudan düzenleyebilirsiniz.`;

  // Dropdown seçenekli alan
  if (availableOptions && availableOptions.length > 0) {
    return (
      <select
        value={safeValue}
        onChange={(e) => activeOnChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={tooltipText}
        data-field-name={name}
        style={{
          cursor: "pointer",
          backgroundColor: isHovered ? "#f1f5f9" : "#ffffff",
          border: isFocused ? "1.5px solid #2563eb" : "1px dashed #94a3b8",
          borderRadius: "3px",
          padding: "2px 4px",
          display: "inline-block",
          fontFamily: "inherit",
          fontSize: "inherit",
          fontWeight: "inherit",
          color: "#000000",
          outline: "none",
          verticalAlign: "baseline",
          boxSizing: "border-box",
          maxWidth: "100%",
          ...style,
        }}
        className={className}
      >
        {safeValue && !availableOptions.includes(safeValue) && (
          <option value={safeValue}>{safeValue}</option>
        )}
        {availableOptions.map((opt, i) => (
          <option key={i} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  // Kullanıcı klavye ve girdi olayları
  const handleInput = () => {
    if (!elementRef.current) return;
    const clean = extractCleanText(elementRef.current);
    lastReportedValueRef.current = clean;
    if (elementRef.current) {
      elementRef.current.dataset.empty = clean.trim() === "" ? "true" : "false";
    }
    activeOnChange(clean);
  };

  const handleFocus = () => {
    isFocusedRef.current = true;
    setIsFocused(true);
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    setIsFocused(false);
    if (elementRef.current) {
      const clean = extractCleanText(elementRef.current);
      lastReportedValueRef.current = clean;
      if (clean !== safeValue) {
        activeOnChange(clean);
      }
      if (!clean) {
        elementRef.current.innerHTML = "";
        elementRef.current.dataset.empty = "true";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      if (allowMultiline) {
        e.preventDefault();
        let inserted = false;
        try {
          // Tarayıcının yerel Undo/Redo geçmişine entegre satır sonu ekleme
          inserted = document.execCommand("insertLineBreak");
        } catch {
          inserted = false;
        }
        if (!inserted) {
          const selection = window.getSelection();
          if (selection && selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            range.deleteContents();
            const br = document.createElement("br");
            range.insertNode(br);
            range.setStartAfter(br);
            range.setEndAfter(br);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
          }
        }
        handleInput();
      } else {
        // Tek satırlı alanlarda Enter düzenlemeyi tamamlayıp odağı bırakır
        e.preventDefault();
        e.currentTarget.blur();
      }
    } else if (e.key === "Escape") {
      e.currentTarget.blur();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLSpanElement>) => {
    e.preventDefault();
    // Güvenlik ve stil bütünlüğü: Dışarıdan kopyalanan zengin HTML'i değil, saf metni al
    const text = e.clipboardData.getData("text/plain");
    if (text) {
      let inserted = false;
      try {
        inserted = document.execCommand("insertText", false, text);
      } catch {
        inserted = false;
      }
      if (!inserted) {
        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
          const range = selection.getRangeAt(0);
          range.deleteContents();
          const textNode = document.createTextNode(text);
          range.insertNode(textNode);
          range.setStartAfter(textNode);
          range.collapse(false);
          selection.removeAllRanges();
          selection.addRange(range);
        }
      }
      handleInput();
    }
  };

  const isEmpty = !safeValue || safeValue.trim() === "";

  // Word benzeri doğrudan belge düzenleme stilleri
  const baseStyle: React.CSSProperties = {
    display: multiline ? "block" : "inline-block",
    width: multiline ? "100%" : undefined,
    minWidth: multiline ? undefined : isEmpty ? "48px" : "16px",
    minHeight: multiline ? "1.4em" : undefined,
    whiteSpace: "pre-wrap",
    wordBreak: "break-word",
    backgroundColor: isFocused
      ? "#eff6ff"
      : isHovered
      ? "#f8fafc"
      : "transparent",
    border: "none",
    borderBottom: isFocused
      ? "2px solid #2563eb"
      : isHovered
      ? "1.5px dashed #475569"
      : "1px dashed #cbd5e1",
    borderRadius: isFocused ? "2px 2px 0 0" : "0",
    padding: multiline ? "3px 4px" : "0 2px",
    margin: "0",
    outline: "none",
    fontFamily: "inherit",
    fontSize: "inherit",
    fontWeight: "inherit",
    lineHeight: "inherit",
    textAlign: "inherit",
    color: "#000000",
    verticalAlign: "baseline",
    transition: "background-color 0.15s ease, border-color 0.15s ease",
    boxSizing: "border-box",
    cursor: "text",
    ...style,
  };

  return (
    <>
      <style>{`
        .temin-word-field:focus {
          outline: none !important;
        }
        .temin-word-field[data-empty="true"]:not(:focus)::before,
        .temin-word-field[data-empty="true"]:empty::before {
          content: attr(data-placeholder);
          color: #94a3b8;
          font-style: italic;
          pointer-events: none;
          display: inline-block;
        }
      `}</style>
      <span
        ref={setRef}
        data-editable-field="true"
        data-field-name={name}
        data-empty={isEmpty ? "true" : "false"}
        data-placeholder={placeholder}
        contentEditable={true}
        suppressContentEditableWarning={true}
        onInput={handleInput}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        title={tooltipText}
        style={baseStyle}
        className={`temin-word-field ${className}`.trim()}
      />
    </>
  );
}
