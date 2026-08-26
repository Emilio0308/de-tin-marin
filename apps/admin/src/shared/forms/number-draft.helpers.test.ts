import { describe, expect, it } from "vitest";
import {
  commitDecimalDraft,
  commitIntegerDraft,
  sanitizeDecimalDraft,
  sanitizeIntegerDraft,
  toDecimalDraft,
  toIntegerDraft,
} from "./number-draft.helpers";

describe("number-draft.helpers", () => {
  describe("toIntegerDraft / toDecimalDraft", () => {
    it("formats finite numbers and empty for nullish", () => {
      expect(toIntegerDraft(4)).toBe("4");
      expect(toIntegerDraft(4.9)).toBe("4");
      expect(toIntegerDraft(null)).toBe("");
      expect(toDecimalDraft(4.5)).toBe("4.5");
      expect(toDecimalDraft(undefined)).toBe("");
    });
  });

  describe("sanitizeIntegerDraft", () => {
    it("keeps digits and allows empty", () => {
      expect(sanitizeIntegerDraft("")).toBe("");
      expect(sanitizeIntegerDraft("04")).toBe("04");
      expect(sanitizeIntegerDraft("1a2")).toBe("12");
      expect(sanitizeIntegerDraft("12.3")).toBe("123");
    });
  });

  describe("sanitizeDecimalDraft", () => {
    it("allows one dot and trailing dot while typing", () => {
      expect(sanitizeDecimalDraft("")).toBe("");
      expect(sanitizeDecimalDraft("12.")).toBe("12.");
      expect(sanitizeDecimalDraft("12.3.4")).toBe("12.34");
      expect(sanitizeDecimalDraft("a1b.2c")).toBe("1.2");
    });
  });

  describe("commitIntegerDraft", () => {
    it("uses fallback for empty and clamps", () => {
      expect(commitIntegerDraft("", { fallback: 0 })).toBe(0);
      expect(commitIntegerDraft("4", { fallback: 0 })).toBe(4);
      expect(commitIntegerDraft("1", { min: 2, fallback: 2 })).toBe(2);
      expect(commitIntegerDraft("99", { max: 10, fallback: 0 })).toBe(10);
    });
  });

  describe("commitDecimalDraft", () => {
    it("uses fallback for empty/incomplete and rounds money", () => {
      expect(commitDecimalDraft("", { fallback: 0 })).toBe(0);
      expect(commitDecimalDraft(".", { fallback: 0 })).toBe(0);
      expect(commitDecimalDraft("4.5", { fallback: 0 })).toBe(4.5);
      expect(commitDecimalDraft("1.239", { fallback: 0 })).toBe(1.24);
      expect(
        commitDecimalDraft("1.239", { fallback: 0, roundMoneyValue: false }),
      ).toBe(1.239);
    });
  });
});
