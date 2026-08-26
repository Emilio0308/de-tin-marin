import "server-only";

import type { SmtpConfig } from "./types";

/**
 * Construye config SMTP solo si están todos los campos requeridos.
 * Si falta alguno → `null` (skip envío; no tumbar create order).
 */
export function resolveSmtpConfig(input: {
  host?: string | undefined;
  port?: number | undefined;
  user?: string | undefined;
  pass?: string | undefined;
  from?: string | undefined;
  replyTo?: string | undefined;
}): SmtpConfig | null {
  const host = input.host?.trim();
  const user = input.user?.trim();
  const pass = input.pass?.trim();
  const from = input.from?.trim();
  const replyTo = input.replyTo?.trim();
  const port = input.port;

  if (
    !host ||
    !user ||
    !pass ||
    !from ||
    port == null ||
    !Number.isFinite(port)
  ) {
    return null;
  }

  if (port <= 0 || port > 65535) {
    return null;
  }

  return {
    host,
    port,
    user,
    pass,
    from,
    ...(replyTo ? { replyTo } : {}),
  };
}
