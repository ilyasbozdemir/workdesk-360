import React, { useEffect, useState } from "react";
import { BidPriceInputProps } from "./types";

export const BidPriceInput: React.FC<BidPriceInputProps> = ({
  initialValue,
  onChange,
  isLowest,
  isExcelStyle,
  onKeyDown,
  onFocus,
  onBlur,
  inputRef,
  ...restProps
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [tempValue, setTempValue] = useState("");

  useEffect(() => {
    if (!isFocused) {
      setTempValue(
        initialValue === 0
          ? ""
          : initialValue.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      );
    }
  }, [initialValue, isFocused]);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    onBlur?.(e);
    const trimmed = tempValue.trim();
    if (!trimmed) {
      onChange("0");
      return;
    }
    const cleanValue = trimmed.replace(/\./g, "").replace(",", ".");
    const parsed = parseFloat(cleanValue);
    if (isNaN(parsed) || parsed < 0) {
      setTempValue(
        initialValue === 0
          ? ""
          : initialValue.toLocaleString("tr-TR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }),
      );
      return;
    }
    onChange(cleanValue);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    // Odaklanınca kullanıcının düzenlemesi için ham temiz formatı göster:
    // Örneğin 1.500,00 ₺ yerine doğrudan "1500" veya küsurat varsa "1500,50"
    if (initialValue === 0) {
      setTempValue("");
    } else {
      const hasFractions = initialValue % 1 !== 0;
      setTempValue(
        hasFractions
          ? initialValue.toFixed(2).replace(".", ",")
          : initialValue.toString(),
      );
    }
    // Kullanıcı tıkladığında tüm metni otomatik seçsin (hızlı yazım için)
    setTimeout(() => {
      e.target.select();
    }, 10);
    onFocus?.(e);
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
