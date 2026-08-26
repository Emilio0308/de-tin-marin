import "server-only";

import type { OrderNotifyLine } from "../types";
import { DEFAULT_BRAND_LOGO_URL } from "../types";
import { escapeHtml, formatMoney } from "./render";

/** Tokens de marca (ecommerce globals.css — Vibrant Confectionery). */
export const BRAND = {
  primary: "#b60058",
  primaryContainer: "#db2670",
  onPrimary: "#ffffff",
  secondary: "#006874",
  background: "#fbf9f1",
  surface: "#ffffff",
  surfaceContainer: "#f0eee6",
  surfaceLow: "#f5f4ec",
  onSurface: "#1b1c17",
  onSurfaceVariant: "#5a4046",
  outline: "#8d6f76",
  outlineVariant: "#e1bec5",
  primaryFixed: "#ffd9e0",
  ink: "#1b1c17",
} as const;

function kindBadgeHtml(kind: OrderNotifyLine["kind"]): string {
  if (kind === "bundle") {
    return `<span style="display:inline-block;background:#ffd7f6;color:#6b3167;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;margin-right:6px">Sorpresa</span>`;
  }
  if (kind === "pack") {
    return `<span style="display:inline-block;background:#95f1ff;color:#004f57;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;margin-right:6px">Combo</span>`;
  }
  return `<span style="display:inline-block;background:#ffd9e0;color:#8f0043;font-size:10px;font-weight:700;letter-spacing:0.04em;text-transform:uppercase;padding:3px 8px;border-radius:999px;margin-right:6px">Producto</span>`;
}

function componentsHtml(line: OrderNotifyLine): string {
  const components = line.components ?? [];
  if (components.length === 0 && !line.footnote) return "";

  const items = components
    .map(
      (component) =>
        `<li style="margin:0 0 6px;padding:0;line-height:1.4"><span style="color:${BRAND.onSurface};font-weight:600">${escapeHtml(component.label)}</span><span style="color:${BRAND.onSurfaceVariant}"> — ${escapeHtml(component.quantityLabel)}</span></li>`,
    )
    .join("");

  const list =
    components.length > 0
      ? `<ul style="margin:8px 0 0;padding:0 0 0 18px;list-style:disc">${items}</ul>`
      : "";

  const footnote = line.footnote
    ? `<div style="margin-top:8px;font-size:11px;color:${BRAND.secondary};font-weight:600">${escapeHtml(line.footnote)}</div>`
    : "";

  const title =
    line.kind === "bundle"
      ? "Incluye en cada sorpresa"
      : line.kind === "pack"
        ? "Incluye en el combo"
        : "Detalle";

  return `<div style="margin-top:10px;padding:10px 12px;background:${BRAND.surfaceLow};border-radius:10px;border:1px solid ${BRAND.outlineVariant}">
  <div style="font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;color:${BRAND.secondary}">${title}</div>
  ${list}
  ${footnote}
</div>`;
}

export function buildLinesRowsHtml(
  lines: OrderNotifyLine[],
  currencyCode: string,
): string {
  if (lines.length === 0) {
    return `<tr><td colspan="2" style="padding:12px 0;font-size:14px;color:${BRAND.onSurfaceVariant}">Sin líneas</td></tr>`;
  }

  return lines
    .map((line, index) => {
      const border =
        index < lines.length - 1
          ? `border-bottom:1px solid ${BRAND.outlineVariant};`
          : "";
      return `<tr>
  <td style="padding:14px 0;${border}vertical-align:top">
    <div style="margin-bottom:4px">${kindBadgeHtml(line.kind)}</div>
    <div style="font-size:14px;font-weight:700;color:${BRAND.onSurface};line-height:1.4">${escapeHtml(line.label)}</div>
    <div style="font-size:12px;color:${BRAND.onSurfaceVariant};margin-top:2px">${escapeHtml(line.quantityLabel)}</div>
    ${componentsHtml(line)}
  </td>
  <td style="padding:14px 0;${border}vertical-align:top;text-align:right;white-space:nowrap;font-size:14px;font-weight:700;color:${BRAND.onSurface}">
    ${escapeHtml(formatMoney(line.lineTotal, currencyCode))}
  </td>
</tr>`;
    })
    .join("");
}

export function buildLinesText(
  lines: OrderNotifyLine[],
  currencyCode: string,
): string {
  if (lines.length === 0) return "(sin líneas)";
  return lines
    .map((line) => {
      const kindLabel =
        line.kind === "bundle"
          ? "Sorpresa"
          : line.kind === "pack"
            ? "Combo"
            : "Producto";
      const rows = [
        `- [${kindLabel}] ${line.label} (${line.quantityLabel}): ${formatMoney(line.lineTotal, currencyCode)}`,
      ];
      for (const component of line.components ?? []) {
        rows.push(`    · ${component.label} — ${component.quantityLabel}`);
      }
      if (line.footnote) {
        rows.push(`    · ${line.footnote}`);
      }
      return rows.join("\n");
    })
    .join("\n");
}

export function buildCtaButtonHtml(href: string, label: string): string {
  return `<a href="${escapeHtml(href)}" style="display:inline-block;background:${BRAND.primary};color:${BRAND.onPrimary};text-decoration:none;font-weight:700;font-size:14px;letter-spacing:0.02em;padding:14px 28px;border-radius:999px">${escapeHtml(label)}</a>`;
}

export function buildLogoHeaderHtml(
  logoUrl: string | null | undefined,
): string {
  const src = logoUrl?.trim() || DEFAULT_BRAND_LOGO_URL;
  return `<img src="${escapeHtml(src)}" alt="De Tin Marín — Dulces y Confitería" width="132" height="132" style="display:block;margin:0 auto;width:132px;height:132px;border:0;border-radius:50%" />`;
}
