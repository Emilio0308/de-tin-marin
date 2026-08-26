/**
 * Pure helpers for catalog list pagination contracts (unit-tested).
 * Runtime pagination lives in repositories / SQL RPCs.
 */

export function productListRange(
  page: number,
  pageSize: number,
): {
  from: number;
  to: number;
} {
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function orderRowsByIds<T extends { id: string }>(
  rows: T[],
  ids: string[],
): T[] {
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids
    .map((id) => byId.get(id))
    .filter((row): row is T => row !== undefined);
}

export function parseCatalogListRpcPayload(raw: unknown): {
  ids: string[];
  total: number;
} {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return { ids: [], total: 0 };
  }

  const record = raw as Record<string, unknown>;
  const total =
    typeof record.total === "number" ? record.total : Number(record.total ?? 0);

  const idsRaw = record.ids;
  const ids = Array.isArray(idsRaw)
    ? idsRaw.filter((id): id is string => typeof id === "string")
    : [];

  return {
    ids,
    total: Number.isFinite(total) ? total : 0,
  };
}
