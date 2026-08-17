import "server-only";

import type { OrderNotifySource } from "./types";

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Parsea `ORDER_NOTIFY_EXTRA_EMAILS` (comma/semicolon/whitespace). */
export function parseExtraEmails(raw: string | undefined | null): string[] {
  if (!raw?.trim()) return [];
  const parts = raw.split(/[,;\s]+/).map((part) => part.trim());
  const seen = new Set<string>();
  const result: string[] = [];
  for (const part of parts) {
    if (!part || !isValidEmail(part)) continue;
    const key = normalizeEmail(part);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(part.trim());
  }
  return result;
}

export function resolveAdminRecipients(
  primaryEmail: string,
  extraEmails: string[] = [],
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const candidate of [primaryEmail, ...extraEmails]) {
    const trimmed = candidate.trim();
    if (!trimmed || !isValidEmail(trimmed)) continue;
    const key = normalizeEmail(trimmed);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(trimmed);
  }

  return result;
}

export type NotifyTargets = {
  customerEmail: string | null;
  adminEmails: string[];
};

export function resolveNotifyTargets(input: {
  source: OrderNotifySource;
  customerEmail: string;
  adminEmail: string;
  extraAdminEmails?: string[];
}): NotifyTargets {
  const adminEmails = resolveAdminRecipients(
    input.adminEmail,
    input.extraAdminEmails ?? [],
  );

  if (input.source === "admin") {
    return { customerEmail: null, adminEmails };
  }

  const customer = input.customerEmail.trim();
  return {
    customerEmail: customer && isValidEmail(customer) ? customer : null,
    adminEmails,
  };
}
