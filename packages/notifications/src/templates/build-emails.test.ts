import { describe, expect, it } from "vitest";

import { buildAdminOrderEmail, buildCustomerOrderEmail } from "./build-emails";
import { escapeHtml, formatMoney, renderTemplate } from "./render";
import { DEFAULT_BRAND_LOGO_URL, type OrderCreatedNotifyInput } from "../types";

const baseInput: OrderCreatedNotifyInput = {
  source: "ecommerce",
  orderId: "11111111-1111-1111-1111-111111111111",
  orderNumber: "TM-20260816-0001",
  total: 49.5,
  currencyCode: "PEN",
  subtotal: 40,
  shippingTotal: 9.5,
  discountTotal: 0,
  statusLabel: "Pendiente de pago",
  contact: {
    name: "Ana",
    lastName: "Pérez",
    email: "ana@example.com",
    phone: "987654321",
  },
  lines: [
    {
      kind: "product",
      label: "Gomitas surtidas",
      quantityLabel: "2 present.",
      lineTotal: 10,
    },
    {
      kind: "bundle",
      label: "Sorpresa rosa",
      quantityLabel: "Sorpresa × 15",
      lineTotal: 20,
      footnote: "Incluye envase: Caja rosa",
      components: [
        {
          label: "Ositos",
          quantityLabel: "3 und./sorpresa · 45 und. total",
        },
      ],
    },
    {
      kind: "pack",
      label: "Combo fiesta",
      quantityLabel: "Combo × 1",
      lineTotal: 10,
      components: [
        {
          label: "Chicles",
          quantityLabel: "1 present. → 1 present. total",
        },
      ],
    },
  ],
  fulfillment: {
    method: "delivery",
    summary: "Ana Pérez, Av. Grau 123, Castilla, Piura, Piura",
  },
  adminEmail: "admin@shop.com",
  brandLogoUrl: DEFAULT_BRAND_LOGO_URL,
  customerLookupUrl:
    "http://localhost:3000/mis-pedidos?orderNumber=TM-20260816-0001&email=ana%40example.com",
  customerConfirmationUrl:
    "http://localhost:3000/pedido/confirmacion?orderNumber=TM-20260816-0001&email=ana%40example.com",
  adminOrderUrl:
    "http://localhost:3001/orders/11111111-1111-1111-1111-111111111111",
};

describe("render helpers", () => {
  it("escapeHtml y formatMoney PEN", () => {
    expect(escapeHtml(`a<b>&"c'`)).toBe("a&lt;b&gt;&amp;&quot;c&#39;");
    expect(formatMoney(10, "PEN")).toBe("S/ 10.00");
  });

  it("renderTemplate sustituye placeholders", () => {
    expect(renderTemplate("Hola {{name}}", { name: "Ana" })).toBe("Hola Ana");
  });
});

describe("build emails", () => {
  it("cliente incluye logo CDN, componentes de sorpresa/combo y URL", () => {
    const mail = buildCustomerOrderEmail(baseInput);
    expect(mail.subject).toContain("TM-20260816-0001");
    expect(mail.html).toContain(DEFAULT_BRAND_LOGO_URL);
    expect(mail.html).toContain("Sorpresa");
    expect(mail.html).toContain("Incluye en cada sorpresa");
    expect(mail.html).toContain("Ositos");
    expect(mail.html).toContain("Incluye en el combo");
    expect(mail.html).toContain("Chicles");
    expect(mail.html).toContain("Caja rosa");
    expect(mail.html).toContain("Ver mi pedido");
    expect(mail.text).toContain("Ositos");
    expect(mail.text).toContain("Chicles");
  });

  it("admin incluye origen, componentes y URL admin", () => {
    const mail = buildAdminOrderEmail(baseInput);
    expect(mail.html).toContain("Tienda (ecommerce)");
    expect(mail.html).toContain("Ositos");
    expect(mail.html).toContain("Abrir orden en admin");
    expect(mail.text).toContain("Combo");
  });
});
