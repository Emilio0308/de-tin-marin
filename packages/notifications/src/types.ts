import "server-only";

export type OrderNotifySource = "ecommerce" | "admin";

export type OrderNotifyContact = {
  name: string;
  lastName: string;
  email: string;
  phone: string;
};

export type OrderNotifyLineComponent = {
  label: string;
  quantityLabel: string;
};

export type OrderNotifyLine = {
  kind: "product" | "pack" | "bundle";
  label: string;
  quantityLabel: string;
  lineTotal: number;
  /** Componentes de sorpresa (bundle) o combo (pack). */
  components?: OrderNotifyLineComponent[];
  /** Extra (ej. envase de sorpresa). */
  footnote?: string | null;
};

export type OrderNotifyFulfillment = {
  method: "delivery" | "pickup" | "pickup_point";
  /** Resumen legible (dirección, punto de recojo o recojo en tienda). */
  summary: string | null;
};

/** Logo CDN de marca (CloudFront). */
export const DEFAULT_BRAND_LOGO_URL =
  "https://d39gr6lavcwxvl.cloudfront.net/hero/9e797fa4-960f-458f-9187-a87eacb5be01.png";

export type OrderCreatedNotifyInput = {
  source: OrderNotifySource;
  orderId: string;
  orderNumber: string;
  total: number;
  currencyCode: string;
  subtotal: number;
  shippingTotal: number;
  discountTotal: number;
  statusLabel: string;
  contact: OrderNotifyContact;
  lines: OrderNotifyLine[];
  fulfillment: OrderNotifyFulfillment;
  adminEmail: string;
  extraAdminEmails?: string[];
  /** Logo absoluto; por defecto CDN de marca. */
  brandLogoUrl?: string | null;
  /** Mis pedidos con orderNumber + email. */
  customerLookupUrl?: string | null;
  /** Confirmación post-checkout. */
  customerConfirmationUrl?: string | null;
  /** Detalle en admin. */
  adminOrderUrl?: string | null;
};

export type SmtpConfig = {
  host: string;
  port: number;
  user: string;
  pass: string;
  from: string;
  /** Si está, Reply-To dirige respuestas aquí (p. ej. correo de tienda). */
  replyTo?: string;
};

export type NotifyOrderCreatedResult =
  | { ok: true; sent: number; skipped: boolean }
  | { ok: false; error: string; sent: number };
