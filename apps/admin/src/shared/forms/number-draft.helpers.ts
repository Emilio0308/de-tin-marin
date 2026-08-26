import { roundMoney } from "@de-tin-marin/shared/prices";

export type CommitNumberDraftOptions = {
  min?: number;
  max?: number;
  fallback: number;
};

export function toIntegerDraft(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }
  return String(Math.trunc(value));
}

export function toDecimalDraft(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) {
    return "";
  }
  return String(value);
}

/** Solo dígitos; permite `""`. */
export function sanitizeIntegerDraft(raw: string): string {
  return raw.replace(/\D/g, "");
}

/**
 * Dígitos + un solo `.`; permite `""` y trailing `.` mientras se escribe.
 * Rechaza signos y letras.
 */
export function sanitizeDecimalDraft(raw: string): string {
  const cleaned = raw.replace(/[^\d.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot === -1) return cleaned;
  const before = cleaned.slice(0, firstDot + 1);
  const after = cleaned.slice(firstDot + 1).replace(/\./g, "");
  return before + after;
}

function clamp(value: number, min?: number, max?: number): number {
  let next = value;
  if (min !== undefined) next = Math.max(min, next);
  if (max !== undefined) next = Math.min(max, next);
  return next;
}

export function commitIntegerDraft(
  raw: string,
  options: CommitNumberDraftOptions,
): number {
  const trimmed = raw.trim();
  if (trimmed === "") return options.fallback;
  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isFinite(parsed)) return options.fallback;
  return clamp(parsed, options.min, options.max);
}

export function commitDecimalDraft(
  raw: string,
  options: CommitNumberDraftOptions & { roundMoneyValue?: boolean },
): number {
  const trimmed = raw.trim();
  if (trimmed === "" || trimmed === ".") return options.fallback;
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) return options.fallback;
  const rounded =
    options.roundMoneyValue === false ? parsed : roundMoney(parsed);
  return clamp(rounded, options.min, options.max);
}
