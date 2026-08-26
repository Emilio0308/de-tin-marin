import "server-only";

const DENY_KEYS = new Set([
  "authorization",
  "cookie",
  "cookies",
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "secret",
  "secretAccessKey",
  "serviceRoleKey",
  "uploadUrl",
  "signedUrl",
  "contact",
  "email",
  "phone",
  "address",
  "deliveryAddress",
  "mapPin",
  "fulfillment",
  "shoppingCart",
  "shopping_cart",
  "raw",
  "body",
  "payload",
  "issues",
]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function redactValue(value: unknown, depth: number): unknown {
  if (depth <= 0) return "[Truncated]";
  if (value == null) return value;
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => redactValue(item, depth - 1));
  }
  if (!isPlainObject(value)) {
    if (typeof value === "bigint") return value.toString();
    if (typeof value === "symbol") return value.description ?? "symbol";
    if (typeof value === "function") return "[Function]";
    return "[Unserializable]";
  }

  const out: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (DENY_KEYS.has(key)) {
      out[key] = "[Redacted]";
      continue;
    }
    out[key] = redactValue(nested, depth - 1);
  }
  return out;
}

/** Strip PII/secrets from metadata before writing to console. */
export function safeMeta(
  fields?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!fields) return undefined;
  const redacted = redactValue(fields, 4);
  if (!isPlainObject(redacted)) return undefined;
  return redacted;
}

export function isDeniedMetaKey(key: string): boolean {
  return DENY_KEYS.has(key);
}
