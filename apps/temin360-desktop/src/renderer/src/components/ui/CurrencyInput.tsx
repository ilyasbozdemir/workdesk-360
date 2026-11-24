import React, { useEffect, useState } from "react";
import { cn } from "../../utils/cn";

export interface CurrencyInputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> {
  value: number | string | undefined | null;
  onChange: (value: number) => void;
  currencySymbol?: string;
  fractionDigits?: number;
  allowNegative?: boolean;
}

/**
 * Standardized Turkish Currency Input (tr-TR)
 * - Uses dot (.) as thousands separator and comma (,) as decimal separator
 * - Consistent with Teklif Giriş Tablosu & Karşılaştırma Matrisi (BidPriceInput)
 * - Automatically formats with 2 decimal fraction digits on blur
 * - Right-aligned with font-mono and standard ₺ symbol
 */
export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  currencySymbol = "₺",
  fractionDigits = 2,
  allowNegative = false,
  className,
  disabled,
  placeholder = "0,00",
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [tempValue, setTempValue] = useState("");

  const numValue = typeof value === "number" ? value : Number(value) || 0;

  useEffect(() => {
    if (!isFocused) {
      if (
        numValue === 0 &&
        (value === "" || value === undefined || value === null)
      ) {
        setTempValue("");
      } else {
        setTempValue(
          numValue.toLocaleString("tr-TR", {
            minimumFractionDigits: fractionDigits,
            maximumFractionDigits: fractionDigits,
          }),
        );
      }
    }
  }, [numValue, isFocused, fractionDigits, value]);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    if (numValue === 0) {
      setTempValue("");
    } else {
      const hasFractions = numValue % 1 !== 0;
      setTempValue(
        hasFractions
          ? numValue.toFixed(fractionDigits).replace(".", ",")
          : numValue.toString(),
      );
    }
    setTimeout(() => {
      e.target.select();
    }, 10);
    rest.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    const raw = tempValue.trim();
    if (!raw) {
      onChange(0);
    } else {
      // 1.250,50 -> 1250.50
      const cleanValue = raw.replace(/\./g, "").replace(",", ".");
      const parsed = parseFloat(cleanValue);
      onChange(isNaN(parsed) ? 0 : Number(parsed.toFixed(fractionDigits)));
    }
    rest.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const regex = allowNegative ? /^-?[0-9.,]*$/ : /^[0-9.,]*$/;
    if (regex.test(val) || val === "") {
      setTempValue(val);
    }
  };

  const displayValue = isFocused
    ? tempValue
    : numValue === 0 && (value === "" || value === undefined || value === null)
    ? ""
    : numValue.toLocaleString("tr-TR", {
      minimumFractionDigits: fractionDigits,
      maximumFractionDigits: fractionDigits,
    });

  return (
    <div className="relative flex items-center w-full">
      <input
        type="text"
        inputMode="decimal"
        value={displayValue}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        className={cn(
          "w-full text-right font-mono text-xs px-3 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-semibold text-slate-800 dark:text-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all",
          currencySymbol ? "pr-7" : "",
          className,
        )}
        {...rest}
      />
      {currencySymbol && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 pointer-events-none select-none font-sans">
          {currencySymbol}
        </span>
      )}
    </div>
  );
};

export default CurrencyInput;
