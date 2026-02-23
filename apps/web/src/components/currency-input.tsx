"use client";

import { Input } from "./ui/input";

interface CurrencyInputProps {
  value: string;
  onChangeValue: (val: string) => void;
  placeholder?: string;
  className?: string;
}

export function CurrencyInput({ value, onChangeValue, placeholder = "$0", className }: CurrencyInputProps) {
  const displayValue = value ? `$${Number(value).toLocaleString()}` : "";

  return (
    <Input
      type="text"
      inputMode="numeric"
      placeholder={placeholder}
      value={displayValue}
      onChange={(e) => {
        const raw = e.target.value.replace(/[^0-9.]/g, "");
        onChangeValue(raw);
      }}
      className={className}
    />
  );
}
