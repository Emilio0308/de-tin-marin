import { describe, expect, it } from "vitest";
import { summarizeActionInput, summarizeActionResult } from "./summarize";

describe("summarizeActionResult", () => {
  it("summarizes array data with districts", () => {
    expect(
      summarizeActionResult({
        ok: true,
        data: [
          { id: "1", district: "Piura", fee: 8 },
          { id: "2", district: "Castilla", fee: 10 },
        ],
      }),
    ).toEqual({
      ok: true,
      itemCount: 2,
      districts: ["Piura", "Castilla"],
      districtCount: 2,
    });
  });

  it("summarizes object data ids", () => {
    expect(
      summarizeActionResult({
        ok: true,
        data: { id: "o1", orderNumber: "DTM-1", total: 12 },
      }),
    ).toMatchObject({
      ok: true,
      id: "o1",
      orderNumber: "DTM-1",
      total: 12,
    });
  });

  it("summarizes business errors", () => {
    expect(summarizeActionResult({ ok: false, error: "VALIDATION" })).toEqual({
      ok: false,
      errorCode: "VALIDATION",
    });
  });
});

describe("summarizeActionInput", () => {
  it("summarizes keys and district without dumping PII bags", () => {
    expect(
      summarizeActionInput({
        district: "Piura",
        mapPin: { lat: 1, lng: 2 },
        contact: { email: "a@b.c" },
        lines: [{ type: "product" }],
      }),
    ).toEqual({
      inputKeys: ["district", "mapPin", "contact", "lines"],
      inputKeyCount: 4,
      lineCount: 1,
      district: "Piura",
      hasDistrict: true,
      hasMapPin: true,
    });
  });
});
