import "server-only";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const ID_KEYS = [
  "id",
  "orderId",
  "orderNumber",
  "paymentId",
  "productId",
  "bundleId",
  "packId",
  "status",
  "error",
] as const;

/**
 * Safe summary of action result for console logs (counts / ids / codes).
 * Never dumps full payloads.
 */
export function summarizeActionResult(result: {
  ok: boolean;
  error?: unknown;
  data?: unknown;
}): Record<string, unknown> {
  const summary: Record<string, unknown> = { ok: result.ok };

  if (!result.ok) {
    if ("error" in result && typeof result.error === "string") {
      summary.errorCode = result.error;
    }
    return summary;
  }

  if (!("data" in result)) {
    summary.hasData = false;
    return summary;
  }

  const data = result.data;
  if (data == null) {
    summary.data = null;
    return summary;
  }

  if (Array.isArray(data)) {
    summary.itemCount = data.length;
    const districts = data
      .map((item) =>
        isRecord(item) && typeof item.district === "string"
          ? item.district
          : null,
      )
      .filter((d): d is string => Boolean(d));
    if (districts.length > 0) {
      summary.districts = districts.slice(0, 30);
      summary.districtCount = districts.length;
    }
    const ids = data
      .map((item) =>
        isRecord(item) && typeof item.id === "string" ? item.id : null,
      )
      .filter((id): id is string => Boolean(id));
    if (ids.length > 0 && districts.length === 0) {
      summary.sampleIds = ids.slice(0, 5);
    }
    return summary;
  }

  if (isRecord(data)) {
    summary.dataKeys = Object.keys(data).slice(0, 24);
    for (const key of ID_KEYS) {
      const value = data[key];
      if (typeof value === "string" || typeof value === "number") {
        summary[key] = value;
      }
    }
    if (Array.isArray(data.items)) {
      summary.itemCount = data.items.length;
    }
    if (Array.isArray(data.lines)) {
      summary.lineCount = data.lines.length;
    }
    if (typeof data.total === "number") {
      summary.total = data.total;
    }
    if (typeof data.fee === "number") {
      summary.fee = data.fee;
    }
    if (typeof data.covered === "boolean") {
      summary.covered = data.covered;
    }
    return summary;
  }

  summary.dataType = typeof data;
  return summary;
}

/**
 * Safe summary of raw action input (shape only).
 */
export function summarizeActionInput(
  raw: unknown,
): Record<string, unknown> | undefined {
  if (raw === undefined) return undefined;
  if (raw === null) return { input: null };
  if (typeof raw !== "object") {
    return { inputType: typeof raw };
  }
  if (Array.isArray(raw)) {
    return { inputType: "array", inputLength: raw.length };
  }

  const record = raw as Record<string, unknown>;
  const keys = Object.keys(record);
  const summary: Record<string, unknown> = {
    inputKeys: keys.slice(0, 40),
    inputKeyCount: keys.length,
  };

  if (Array.isArray(record.lines)) {
    summary.lineCount = record.lines.length;
  }
  if (typeof record.district === "string") {
    summary.district = record.district;
    summary.hasDistrict = record.district.trim().length > 0;
  }
  if (record.mapPin != null) {
    summary.hasMapPin = true;
  }
  if (typeof record.id === "string") {
    summary.id = record.id;
  }
  if (typeof record.orderId === "string") {
    summary.orderId = record.orderId;
  }
  if (typeof record.page === "number") {
    summary.page = record.page;
  }
  if (typeof record.pageSize === "number") {
    summary.pageSize = record.pageSize;
  }

  return summary;
}
