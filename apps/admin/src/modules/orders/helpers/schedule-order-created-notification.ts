import "server-only";

import { after } from "next/server";

import { DEFAULT_BRAND_LOGO_URL } from "@de-tin-marin/notifications/types";
import { notifyOrderCreated } from "@de-tin-marin/notifications/notify-order-created";
import { parseExtraEmails } from "@de-tin-marin/notifications/recipients";
import { resolveSmtpConfig } from "@de-tin-marin/notifications/smtp-config";
import type { OrderCreatedNotifyInput } from "@de-tin-marin/notifications/types";

import { env } from "@/config/env";
import {
  logServerError,
  logServerInfo,
  logServerWarn,
} from "@/shared/errors/server-error";

function buildSmtpFromEnv() {
  return resolveSmtpConfig({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    user: env.SMTP_USER,
    pass: env.SMTP_PASS,
    from: env.SMTP_FROM,
    replyTo: env.SMTP_REPLY_TO,
  });
}

function buildAdminOrderUrl(orderId: string): string | null {
  const base = env.ORDER_ADMIN_APP_BASE_URL?.replace(/\/$/, "");
  if (!base) return null;
  return `${base}/orders/${orderId}`;
}

/**
 * Programa el envío post-respuesta (solo admin destinatarios).
 * Nunca bloquea ni falla create order.
 */
export function scheduleOrderCreatedNotification(
  input: Omit<
    OrderCreatedNotifyInput,
    | "extraAdminEmails"
    | "customerLookupUrl"
    | "customerConfirmationUrl"
    | "adminOrderUrl"
    | "brandLogoUrl"
    | "source"
  > & {
    adminEmail: string;
  },
): void {
  const payload: OrderCreatedNotifyInput = {
    ...input,
    source: "admin",
    extraAdminEmails: parseExtraEmails(env.ORDER_NOTIFY_EXTRA_EMAILS),
    brandLogoUrl: DEFAULT_BRAND_LOGO_URL,
    customerLookupUrl: null,
    customerConfirmationUrl: null,
    adminOrderUrl: buildAdminOrderUrl(input.orderId),
  };

  after(() => {
    void (async () => {
      const smtp = buildSmtpFromEnv();
      if (!smtp) {
        logServerWarn(
          "scheduleOrderCreatedNotification",
          "SMTP_NOT_CONFIGURED",
          {
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
            source: payload.source,
          },
        );
      }

      const result = await notifyOrderCreated(smtp, payload);
      if (!result.ok) {
        logServerError("scheduleOrderCreatedNotification", {
          message: "NOTIFY_FAILED",
          orderId: payload.orderId,
          orderNumber: payload.orderNumber,
          source: payload.source,
          sent: result.sent,
          error: result.error,
        });
        return;
      }

      logServerInfo("scheduleOrderCreatedNotification", "notified", {
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        source: payload.source,
        sent: result.sent,
        skipped: result.skipped,
      });
    })().catch((error: unknown) => {
      logServerError("scheduleOrderCreatedNotification", {
        message: "NOTIFY_UNEXPECTED",
        orderId: payload.orderId,
        orderNumber: payload.orderNumber,
        source: payload.source,
        error: error instanceof Error ? error.message : "unknown",
      });
    });
  });
}
