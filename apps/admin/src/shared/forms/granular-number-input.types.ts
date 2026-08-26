import type { InputHTMLAttributes } from "react";

export type GranularNumberMode = "integer" | "decimal";

export type GranularNumberInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value" | "onChange" | "onBlur" | "inputMode" | "min" | "max"
> & {
  value: number | null;
  onValueChange: (value: number | null) => void;
  mode: GranularNumberMode;
  min?: number;
  max?: number;
  /** Cuando true, vacío propaga `null` (campo opcional). */
  allowEmpty?: boolean;
  /** Fallback al blur si el draft está vacío y `allowEmpty` es false. */
  emptyFallback?: number;
  /** Redondeo money en mode decimal (default true). */
  roundMoneyValue?: boolean;
};
