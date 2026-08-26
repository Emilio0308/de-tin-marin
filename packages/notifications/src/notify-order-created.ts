import "server-only";

import { sendMail, type SendMailFn } from "./mailer";
import { resolveNotifyTargets } from "./recipients";
import {
  buildAdminOrderEmail,
  buildCustomerOrderEmail,
} from "./templates/build-emails";
import type {
  NotifyOrderCreatedResult,
  OrderCreatedNotifyInput,
  SmtpConfig,
} from "./types";

export type NotifyOrderCreatedDeps = {
  sendMailFn?: SendMailFn;
};

/**
 * Best-effort: si `smtp` es null o falla un envío, no lanza hacia el caller
 * de create-order (el caller debe atrapar rechazos de la Promise).
 */
export async function notifyOrderCreated(
  smtp: SmtpConfig | null,
  input: OrderCreatedNotifyInput,
  deps: NotifyOrderCreatedDeps = {},
): Promise<NotifyOrderCreatedResult> {
  if (!smtp) {
    return { ok: true, sent: 0, skipped: true };
  }

  const targets = resolveNotifyTargets({
    source: input.source,
    customerEmail: input.contact.email,
    adminEmail: input.adminEmail,
    extraAdminEmails: input.extraAdminEmails,
  });

  const send = deps.sendMailFn ?? sendMail;
  let sent = 0;

  try {
    if (targets.customerEmail) {
      const customerMail = buildCustomerOrderEmail(input);
      await send(smtp, {
        to: targets.customerEmail,
        subject: customerMail.subject,
        html: customerMail.html,
        text: customerMail.text,
      });
      sent += 1;
    }

    if (targets.adminEmails.length > 0) {
      const adminMail = buildAdminOrderEmail(input);
      for (const to of targets.adminEmails) {
        await send(smtp, {
          to,
          subject: adminMail.subject,
          html: adminMail.html,
          text: adminMail.text,
        });
        sent += 1;
      }
    }

    return { ok: true, sent, skipped: false };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "notifyOrderCreated failed";
    return { ok: false, error: message, sent };
  }
}
