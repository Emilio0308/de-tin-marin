import "server-only";

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import type { OrderCreatedNotifyInput } from "../types";
import {
  BRAND,
  buildCtaButtonHtml,
  buildLinesRowsHtml,
  buildLinesText,
  buildLogoHeaderHtml,
} from "./email-brand";
import { escapeHtml, formatMoney, renderTemplate } from "./render";

const templatesDir = dirname(fileURLToPath(import.meta.url));

const customerHtmlTemplate = readFileSync(
  join(templatesDir, "order-customer.html"),
  "utf8",
);
const adminHtmlTemplate = readFileSync(
  join(templatesDir, "order-admin.html"),
  "utf8",
);

export type BuiltEmail = {
  subject: string;
  html: string;
  text: string;
};

function customerDisplayName(
  contact: OrderCreatedNotifyInput["contact"],
): string {
  return `${contact.name} ${contact.lastName}`.trim();
}

function fulfillmentMethodLabel(
  method: OrderCreatedNotifyInput["fulfillment"]["method"],
): string {
  return method === "pickup" ? "Recojo" : "Entrega a domicilio";
}

function fulfillmentSummaryText(input: OrderCreatedNotifyInput): string {
  const summary = input.fulfillment.summary?.trim();
  if (summary) return summary;
  return input.fulfillment.method === "pickup"
    ? "Recojo en tienda"
    : "Dirección no indicada";
}

function discountRowHtml(
  discountTotal: number,
  currencyCode: string,
  mutedColor: string,
): string {
  if (discountTotal <= 0) return "";
  return `<tr>
  <td style="padding:4px 0;color:${mutedColor}">Descuento</td>
  <td style="padding:4px 0;text-align:right;color:${mutedColor}">−${escapeHtml(formatMoney(discountTotal, currencyCode))}</td>
</tr>`;
}

function resolveCustomerPrimaryUrl(
  input: OrderCreatedNotifyInput,
): { href: string; label: string } | null {
  const confirmation = input.customerConfirmationUrl?.trim();
  if (confirmation) {
    return { href: confirmation, label: "Ver mi pedido" };
  }
  const lookup = input.customerLookupUrl?.trim();
  if (lookup) {
    return { href: lookup, label: "Ver mi pedido" };
  }
  return null;
}

export function buildCustomerOrderEmail(
  input: OrderCreatedNotifyInput,
): BuiltEmail {
  const fullName = customerDisplayName(input.contact);
  const firstName = input.contact.name.trim() || fullName;
  const currency = input.currencyCode;
  const totalFormatted = formatMoney(input.total, currency);
  const primary = resolveCustomerPrimaryUrl(input);
  const lookup = input.customerLookupUrl?.trim() || "";

  const primaryCtaHtml = primary
    ? `<div style="margin:8px 0 12px">${buildCtaButtonHtml(primary.href, primary.label)}</div>`
    : "";

  let secondaryLinkHtml = "";
  if (lookup && primary && lookup !== primary.href) {
    secondaryLinkHtml = `<p style="margin:0;font-size:13px"><a href="${escapeHtml(lookup)}" style="color:${BRAND.secondary};font-weight:600;text-decoration:underline">Abrir Mis pedidos</a></p>`;
  } else if (lookup && !primary) {
    secondaryLinkHtml = `<p style="margin:8px 0 0;font-size:13px"><a href="${escapeHtml(lookup)}" style="color:${BRAND.secondary};font-weight:600;text-decoration:underline">Abrir Mis pedidos</a></p>`;
  }

  const html = renderTemplate(customerHtmlTemplate, {
    logoHeaderHtml: buildLogoHeaderHtml(input.brandLogoUrl),
    customerFirstName: escapeHtml(firstName),
    orderNumber: escapeHtml(input.orderNumber),
    statusLabel: escapeHtml(input.statusLabel),
    linesRowsHtml: buildLinesRowsHtml(input.lines, currency),
    subtotalFormatted: escapeHtml(formatMoney(input.subtotal, currency)),
    shippingFormatted: escapeHtml(formatMoney(input.shippingTotal, currency)),
    discountRowHtml: discountRowHtml(
      input.discountTotal,
      currency,
      BRAND.onSurfaceVariant,
    ),
    totalFormatted: escapeHtml(totalFormatted),
    fulfillmentMethodLabel: escapeHtml(
      fulfillmentMethodLabel(input.fulfillment.method),
    ),
    fulfillmentSummary: escapeHtml(fulfillmentSummaryText(input)),
    primaryCtaHtml,
    secondaryLinkHtml,
  });

  const textLines = [
    `Hola ${firstName},`,
    "",
    `Recibimos tu pedido ${input.orderNumber}. Estado: ${input.statusLabel}.`,
    "",
    "Resumen:",
    buildLinesText(input.lines, currency),
    "",
    `Subtotal: ${formatMoney(input.subtotal, currency)}`,
    `Envío: ${formatMoney(input.shippingTotal, currency)}`,
  ];
  if (input.discountTotal > 0) {
    textLines.push(`Descuento: −${formatMoney(input.discountTotal, currency)}`);
  }
  textLines.push(
    `Total: ${totalFormatted}`,
    "",
    `${fulfillmentMethodLabel(input.fulfillment.method)}: ${fulfillmentSummaryText(input)}`,
  );
  if (primary) {
    textLines.push("", `Ver pedido: ${primary.href}`);
  }
  if (lookup && lookup !== primary?.href) {
    textLines.push(`Mis pedidos: ${lookup}`);
  }
  textLines.push("", "Gracias por elegir De Tin Marín.");

  return {
    subject: `Pedido recibido ${input.orderNumber} — De Tin Marín`,
    html,
    text: textLines.join("\n"),
  };
}

export function buildAdminOrderEmail(
  input: OrderCreatedNotifyInput,
): BuiltEmail {
  const name = customerDisplayName(input.contact);
  const currency = input.currencyCode;
  const totalFormatted = formatMoney(input.total, currency);
  const sourceLabel =
    input.source === "ecommerce" ? "Tienda (ecommerce)" : "Admin";
  const adminUrl = input.adminOrderUrl?.trim() || "";

  const primaryCtaHtml = adminUrl
    ? `<div style="margin:0 0 8px">${buildCtaButtonHtml(adminUrl, "Abrir orden en admin")}</div>`
    : "";

  const secondaryLinkHtml = adminUrl
    ? `<p style="margin:14px 0 0;font-size:12px;color:#5a4046;word-break:break-all">URL: <a href="${escapeHtml(adminUrl)}" style="color:${BRAND.primary}">${escapeHtml(adminUrl)}</a></p>`
    : "";

  const html = renderTemplate(adminHtmlTemplate, {
    orderNumber: escapeHtml(input.orderNumber),
    statusLabel: escapeHtml(input.statusLabel),
    sourceLabel: escapeHtml(sourceLabel),
    totalFormatted: escapeHtml(totalFormatted),
    primaryCtaHtml,
    customerName: escapeHtml(name),
    customerEmail: escapeHtml(input.contact.email),
    customerPhone: escapeHtml(input.contact.phone),
    fulfillmentMethodLabel: escapeHtml(
      fulfillmentMethodLabel(input.fulfillment.method),
    ),
    fulfillmentSummary: escapeHtml(fulfillmentSummaryText(input)),
    linesRowsHtml: buildLinesRowsHtml(input.lines, currency),
    subtotalFormatted: escapeHtml(formatMoney(input.subtotal, currency)),
    shippingFormatted: escapeHtml(formatMoney(input.shippingTotal, currency)),
    discountRowHtml: discountRowHtml(input.discountTotal, currency, "#e1bec5"),
    secondaryLinkHtml,
  });

  const textLines = [
    `Nueva orden ${input.orderNumber}`,
    `Origen: ${sourceLabel}`,
    `Estado: ${input.statusLabel}`,
    `Total: ${totalFormatted}`,
    "",
    `Cliente: ${name}`,
    `Email: ${input.contact.email}`,
    `Teléfono: ${input.contact.phone}`,
    "",
    `${fulfillmentMethodLabel(input.fulfillment.method)}: ${fulfillmentSummaryText(input)}`,
    "",
    "Líneas:",
    buildLinesText(input.lines, currency),
    "",
    `Subtotal: ${formatMoney(input.subtotal, currency)}`,
    `Envío: ${formatMoney(input.shippingTotal, currency)}`,
  ];
  if (input.discountTotal > 0) {
    textLines.push(`Descuento: −${formatMoney(input.discountTotal, currency)}`);
  }
  if (adminUrl) {
    textLines.push("", `Admin: ${adminUrl}`);
  }

  return {
    subject: `Nueva orden ${input.orderNumber} — De Tin Marín`,
    html,
    text: textLines.join("\n"),
  };
}
