/**
 * TÜRKÇE DİL BİLGİSİ VE METİN YARDIMCILARI
 */

/**
 * İsmin yönelme durumuna (-e / -a / -ye / -ya) göre kesme işaretli ek üretir.
 * Örnek: "İlyas Bozdemir" -> "’e", "Mustafa" -> "’ya", "Ahmet" -> "’e", "Ali" -> "’ye"
 */
export function getDativeSuffix(name?: string): string {
  if (!name || typeof name !== "string") return "’a";
  const trimmed = name.split("(")[0].trim();
  if (!trimmed || trimmed.includes(".")) return "’a";

  const vowels = "aıoueiöüAIOUEİÖÜ";
  const backVowels = "aıouAIOU";

  let lastVowel = "";
  for (let i = trimmed.length - 1; i >= 0; i--) {
    const char = trimmed[i];
    if (vowels.includes(char)) {
      lastVowel = char;
      break;
    }
  }

  if (!lastVowel) return "’a";

  const lastChar = trimmed[trimmed.length - 1];
  const endsWithVowel = vowels.includes(lastChar);
  const isBack = backVowels.includes(lastVowel);

  if (isBack) {
    return endsWithVowel ? "’ya" : "’a";
  } else {
    return endsWithVowel ? "’ye" : "’e";
  }
}

/**
 * Kurum / Birim adının tamlayan (ilgi/iyelik) ekini (-in / -ın / -un / -ün / -nin / -nın vb.) türetir.
 * Örnek: "Müdürlüğü" -> "Müdürlüğünün", "Başkanlığı" -> "Başkanlığının"
 */
export function toPossessiveSuffix(str: string, fallback: string = "Kurumumuzun"): string {
  if (!str) return fallback;
  const trimmed = str.trim();
  const lower = trimmed.toLowerCase();
  if (
    lower.endsWith("n") ||
    lower.endsWith("in") ||
    lower.endsWith("ın") ||
    lower.endsWith("un") ||
    lower.endsWith("ün")
  ) {
    return trimmed;
  }
  if (lower.endsWith("miz") || lower.endsWith("müz")) return `${trimmed}in`;
  if (lower.endsWith("mız") || lower.endsWith("muz")) return `${trimmed}ın`;
  if (
    lower.endsWith("si") ||
    lower.endsWith("su") ||
    lower.endsWith("sü") ||
    lower.endsWith("sı")
  ) {
    return `${trimmed}nin`;
  }
  if (lower.endsWith("i") || lower.endsWith("ü")) return `${trimmed}nin`;
  if (lower.endsWith("ı") || lower.endsWith("u")) return `${trimmed}nun`;
  return `${trimmed}in`;
}

/**
 * Kurum / Birim adının bulunma hal ekini (-de / -da / -te / -ta / -nde / -nda) türetir.
 * Örnek: "Müdürlüğümüz" -> "Müdürlüğümüzde", "Belediyemiz" -> "Belediyemizde",
 * "Bakanlığımız" -> "Bakanlığımızda", "Fen İşleri Müdürlüğü" -> "Fen İşleri Müdürlüğünde"
 */
export function toLocativeSuffix(str: string, fallback: string = "İdaremizde"): string {
  if (!str) return fallback;
  const trimmed = str.trim();
  if (!trimmed || trimmed === "[]") return fallback;
  const lower = trimmed.toLowerCase();

  // Zaten bulunma ekiyle bitiyorsa (-de, -da, -te, -ta)
  if (
    lower.endsWith("de") ||
    lower.endsWith("da") ||
    lower.endsWith("te") ||
    lower.endsWith("ta")
  ) {
    return trimmed;
  }

  // 1. Çoğul iyelikli bitişler (-miz, -müz, -mız, -muz)
  if (lower.endsWith("miz") || lower.endsWith("müz")) return `${trimmed}de`;
  if (lower.endsWith("mız") || lower.endsWith("muz")) return `${trimmed}da`;

  // 3. Tekil iyelikli bitişler (-si, -su, -sü, -sı veya -i, -ı, -u, -ü)
  // Türkçe kuralı: 3. şahıs iyelik ekinden sonra gelen bulunma hali 'n' kaynaştırma harfi alır (-nde, -nda)
  if (
    lower.endsWith("si") ||
    lower.endsWith("sü") ||
    lower.endsWith("i") ||
    lower.endsWith("ü")
  ) {
    return `${trimmed}nde`;
  }
  if (
    lower.endsWith("su") ||
    lower.endsWith("sı") ||
    lower.endsWith("ı") ||
    lower.endsWith("u")
  ) {
    return `${trimmed}nda`;
  }

  // Sert ünsüzle bitiyorsa (f, s, t, k, ç, ş, h, p) -> -te / -ta
  const fstkcshp = "fstkçşhpFSTKÇŞHP";
  const lastChar = trimmed[trimmed.length - 1];
  const isHardConsonant = fstkcshp.includes(lastChar);

  // Son sesli harfe göre kalınlık/incelik
  const vowels = "aıoueiöüAIOUEİÖÜ";
  const backVowels = "aıouAIOU";
  let lastVowel = "";
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (vowels.includes(trimmed[i])) {
      lastVowel = trimmed[i];
      break;
    }
  }

  const isBack = backVowels.includes(lastVowel);
  if (isHardConsonant) {
    return isBack ? `${trimmed}ta` : `${trimmed}te`;
  }
  return isBack ? `${trimmed}da` : `${trimmed}de`;
}

/**
 * Sayısal veya metinsel tutarı Türk Lirası para birimi formatına (1.250,50) dönüştürür.
 */
export function formatCurrency(
  val: any,
  fallback = "-",
  includeSymbol = false
): string {
  if (val === undefined || val === null || val === "") return fallback;
  const suffix = includeSymbol ? " ₺" : "";

  if (typeof val === "number") {
    if (isNaN(val)) return fallback;
    return (
      val.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + suffix
    );
  }

  const str = String(val).trim();
  if (str.endsWith("₺")) {
    return includeSymbol ? str : str.replace("₺", "").trim();
  }

  const clean = str.replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
  const num = parseFloat(clean);
  if (!isNaN(num) && clean !== "") {
    return (
      num.toLocaleString("tr-TR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + suffix
    );
  }
  return str + suffix;
}

/**
 * Tutarı Türkçe para formatına (1.234,56 veya 0,00) dönüştürür.
 */
export function formatMoney(val: any): string {
  if (val === undefined || val === null || val === "") return "0,00";
  if (typeof val === "number") {
    return isNaN(val)
      ? "0,00"
      : val.toLocaleString("tr-TR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  }
  const str = String(val).trim();
  if (!str || str === "-") return str;

  // If already formatted like 1.234,56
  if (/^\d{1,3}(\.\d{3})*,\d{2}$/.test(str)) {
    return str;
  }
  // If formatted like 1234,56 without thousand separator dots
  if (/^\d+,\d{2}$/.test(str)) {
    const [intPart, decPart] = str.split(",");
    return Number(intPart).toLocaleString("tr-TR") + "," + decPart;
  }

  // Raw numeric strings like "1234.56" or "1234"
  const cleanStr = str.replace(/[^0-9.,-]/g, "");
  if (!cleanStr) return str;

  let num: number;
  if (cleanStr.includes(",") && !cleanStr.includes(".")) {
    num = parseFloat(cleanStr.replace(",", "."));
  } else if (cleanStr.includes(".") && cleanStr.includes(",")) {
    num = parseFloat(cleanStr.replace(/\./g, "").replace(",", "."));
  } else {
    num = parseFloat(cleanStr);
  }

  if (!isNaN(num)) {
    return num.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  return str;
}

/**
 * GG.AA.YYYY formatındaki Türkçe tarihi ISO YYYY-MM-DD formatına dönüştürür.
 */
export function toIsoDate(trDateStr?: string | null): string {
  if (!trDateStr) return new Date().toISOString().split("T")[0];
  const clean = String(trDateStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    return clean.split("T")[0].split(" ")[0];
  }
  if (/^\d{2}\.\d{2}\.\d{4}/.test(clean)) {
    const [d, m, y] = clean.substring(0, 10).split(".");
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  try {
    const dt = new Date(clean);
    if (!isNaN(dt.getTime())) {
      return dt.toISOString().split("T")[0];
    }
  } catch {}
  return new Date().toISOString().split("T")[0];
}

/**
 * Tarihi Türkçe GG.AA.YYYY (resmi yazışma mevzuatına uygun) formatına dönüştürür.
 * Yıl-ay-gün (YYYY-MM-DD) veya ISO formatlarını kesinlikle Türk resmi formatına çevirir.
 */
export function toTrDate(isoOrStr?: any): string {
  if (!isoOrStr) return "";
  if (isoOrStr instanceof Date) {
    if (isNaN(isoOrStr.getTime())) return "";
    const d = String(isoOrStr.getDate()).padStart(2, "0");
    const m = String(isoOrStr.getMonth() + 1).padStart(2, "0");
    const y = isoOrStr.getFullYear();
    return `${d}.${m}.${y}`;
  }
  const clean = String(isoOrStr).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
    const datePart = clean.split("T")[0].split(" ")[0];
    const [y, m, d] = datePart.split("-");
    if (y && m && d) {
      return `${d.padStart(2, "0")}.${m.padStart(2, "0")}.${y}`;
    }
  }
  if (/^\d{2}\.\d{2}\.\d{4}/.test(clean)) {
    return clean.substring(0, 10);
  }
  try {
    const dt = new Date(clean);
    if (!isNaN(dt.getTime())) {
      const d = String(dt.getDate()).padStart(2, "0");
      const m = String(dt.getMonth() + 1).padStart(2, "0");
      const y = dt.getFullYear();
      return `${d}.${m}.${y}`;
    }
  } catch {}
  return clean;
}

export const formatDateTR = toTrDate;

/**
 * Unvan metnini parantez içine alır (örneğin: "Mühendis" -> "(Mühendis)").
 * Zaten parantez içindeyse tekrar eklemez.
 */
export function formatUnvan(unvan?: string): string {
  if (!unvan || !unvan.trim()) return "";
  const trimmed = unvan.trim();
  if (trimmed.startsWith("(") && trimmed.endsWith(")")) {
    return trimmed;
  }
  return `(${trimmed})`;
}


/**
 * Personel Ad ve Soyadını temizler, olası çift isim ve parantezli unvan tekrarlarını giderir.
 * Örnekler:
 * - "Ahmet Yılmaz (Ahmet Yılmaz)" -> "Ahmet Yılmaz"
 * - "Ahmet Yılmaz (Mühendis)" -> "Ahmet Yılmaz"
 * - "Ahmet Yılmaz Ahmet Yılmaz" -> "Ahmet Yılmaz"
 * - "Ali Veli Kaya Ali Veli Kaya" -> "Ali Veli Kaya"
 * - "Mehmet Demir / Mehmet Demir" -> "Mehmet Demir"
 * - "Ahmet Yılmaz Yılmaz" -> "Ahmet Yılmaz"
 */
export function cleanPersonelName(name?: string | null): string {
  if (!name || typeof name !== "string") return "";
  let cleaned = name.trim();

  // 1. Parantez içi temizliği: parantez içini kaldır
  if (cleaned.includes("(")) {
    cleaned = cleaned.split("(")[0].trim();
  }

  // 2. Çoklu boşlukları teke indir
  cleaned = cleaned.replace(/\s+/g, " ");

  // 3. / veya - ile ayrılmış çift isim tekrarı: "Ahmet Yılmaz / Ahmet Yılmaz"
  if (cleaned.includes("/") || cleaned.includes(" - ")) {
    const parts = cleaned.split(/[/]|(\s+-\s+)/).filter(Boolean).map((p) => p.trim());
    if (parts.length >= 2 && parts[0].toLowerCase() === parts[parts.length - 1].toLowerCase()) {
      cleaned = parts[0];
    }
  }

  // 4. Birebir çift tekrarlanan isimler:
  // "Ahmet Yılmaz Ahmet Yılmaz" -> 4 kelime -> 2 + 2 eşit -> "Ahmet Yılmaz"
  // "Ali Veli Ali Veli" -> 4 kelime -> 2 + 2 eşit -> "Ali Veli"
  // "Ali Ali" -> 2 kelime -> 1 + 1 eşit -> "Ali"
  const words = cleaned.split(" ").filter(Boolean);
  if (words.length >= 2 && words.length % 2 === 0) {
    const half = words.length / 2;
    const firstHalf = words.slice(0, half).join(" ");
    const secondHalf = words.slice(half).join(" ");
    if (firstHalf.localeCompare(secondHalf, "tr", { sensitivity: "accent" }) === 0) {
      cleaned = firstHalf;
    }
  } else if (words.length >= 3) {
    // Son kelime (soyad) iki kere tekrarlanmışsa: "Ahmet Yılmaz Yılmaz"
    const lastWord = words[words.length - 1];
    const prevWord = words[words.length - 2];
    if (lastWord.toLowerCase() === prevWord.toLowerCase()) {
      cleaned = words.slice(0, -1).join(" ");
    }
  }

  return cleaned.trim();
}
