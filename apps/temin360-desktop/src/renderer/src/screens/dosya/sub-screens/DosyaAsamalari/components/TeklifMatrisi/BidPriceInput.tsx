import React, { useEffect, useState } from "react";
import { BidPriceInputProps } from "./types";

export const BidPriceInput: React.FC<BidPriceInputProps> = ({
  initialValue,
  onChange,
  isLowest,
  isExcelStyle,
  onKeyDown,
  inputRef,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    if (!isFocused) {
      setTempValue(
        initialValue === 0 ? "" : initialValue.toString().replace(".", ","),
      );
    }
  }, [initialValue, isFocused]);

  const handleBlur = () => {
    setIsFocused(false);
    const trimmed = tempValue.trim();
    if (!trimmed) {
      // Eğer kullanıcı açıkça sildiyse veya sıfırladıysa 0 gönder
      onChange("0");
      return;
    }
    const cleanValue = trimmed.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleanValue);
    if (isNaN(parsed) || parsed < 0) {
      // Geçersiz format girilmişse eski geçerli değere geri dön, veritabanını bozma
      setTempValue(
        initialValue === 0 ? "" : initialValue.toString().replace(".", ","),
      );
      return;
    }
    onChange(cleanValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setTempValue(
      initialValue === 0 ? "" : initialValue.toString().replace(".", ","),
    );
  };

  const displayValue = isFocused
    ? tempValue
    : initialValue === 0
    ? ""
    : initialValue.toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  if (isExcelStyle) {
    return (
      <input
        ref={inputRef}
        title="Fiyat Gir"
        type="text"
        value={displayValue}
        placeholder="0,00"
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={onKeyDown}
        onChange={(e) => {
          const val = e.target.value;
          if (/^[0-9.,]*$/.test(val) || val === "") {
            setTempValue(val);
          }
        }}
        {...restProps}
        className={`w-full text-right text-xs font-mono bg-transparent border-0 focus:bg-blue-50/50 dark:focus:bg-blue-955/20 outline-none pl-6 pr-2.5 py-2.5 transition-all ${
          isLowest
            ? "font-bold text-emerald-700 dark:text-emerald-450"
            : "text-slate-800 dark:text-slate-200"
        }`}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      title="Fiyat Gir"
      type="text"
      value={displayValue}
      placeholder="0,00"
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={onKeyDown}
      onChange={(e) => {
        const val = e.target.value;
        if (/^[0-9.,]*$/.test(val) || val === "") {
          setTempValue(val);
        }
      }}
      {...restProps}
      className={`w-full text-right text-xs font-mono rounded-lg border ${
        isLowest
          ? "border-emerald-400 dark:border-emerald-600 bg-emerald-50/30 focus:ring-emerald-500 focus:border-emerald-500 font-bold text-emerald-700 dark:text-emerald-400"
          : "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-800 dark:text-slate-200 focus:ring-primary focus:border-primary"
      } pl-6 pr-2.5 py-1.5 focus:outline-none focus:ring-2 transition-all`}
    />
  );
};
