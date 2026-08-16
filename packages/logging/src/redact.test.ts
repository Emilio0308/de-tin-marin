import { describe, expect, it } from "vitest";
import { isDeniedMetaKey, safeMeta } from "./redact";

describe("safeMeta", () => {
  it("redacts denied keys", () => {
    const result = safeMeta({
      orderId: "ord-1",
      contact: { email: "a@b.c", name: "Ada" },
      mapPin: { lat: 1, lng: 2 },
      uploadUrl: "https://s3.example/signed",
      lineCount: 3,
    });

    expect(result).toEqual({
      orderId: "ord-1",
      contact: "[Redacted]",
      mapPin: "[Redacted]",
      uploadUrl: "[Redacted]",
      lineCount: 3,
    });
  });

  it("returns undefined for empty input", () => {
    expect(safeMeta(undefined)).toBeUndefined();
  });

  it("exposes deny list helper", () => {
    expect(isDeniedMetaKey("email")).toBe(true);
    expect(isDeniedMetaKey("orderNumber")).toBe(false);
  });
});
