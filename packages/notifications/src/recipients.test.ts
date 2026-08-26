import { describe, expect, it } from "vitest";

import {
  parseExtraEmails,
  resolveAdminRecipients,
  resolveNotifyTargets,
} from "./recipients";

describe("parseExtraEmails", () => {
  it("devuelve vacío si ausente o blank", () => {
    expect(parseExtraEmails(undefined)).toEqual([]);
    expect(parseExtraEmails(null)).toEqual([]);
    expect(parseExtraEmails("  ")).toEqual([]);
  });

  it("parsea comma/semicolon y dedupea case-insensitive", () => {
    expect(
      parseExtraEmails("a@example.com, b@example.com; A@example.com"),
    ).toEqual(["a@example.com", "b@example.com"]);
  });

  it("ignora emails inválidos", () => {
    expect(parseExtraEmails("no-email, ok@test.com")).toEqual(["ok@test.com"]);
  });
});

describe("resolveAdminRecipients", () => {
  it("incluye primary + extras sin duplicados", () => {
    expect(
      resolveAdminRecipients("admin@shop.com", [
        "erivasruiz03@gmail.com",
        "Admin@shop.com",
      ]),
    ).toEqual(["admin@shop.com", "erivasruiz03@gmail.com"]);
  });
});

describe("resolveNotifyTargets", () => {
  it("ecommerce envía a cliente y admin", () => {
    expect(
      resolveNotifyTargets({
        source: "ecommerce",
        customerEmail: "cliente@example.com",
        adminEmail: "admin@shop.com",
        extraAdminEmails: ["extra@shop.com"],
      }),
    ).toEqual({
      customerEmail: "cliente@example.com",
      adminEmails: ["admin@shop.com", "extra@shop.com"],
    });
  });

  it("admin solo envía a admin", () => {
    expect(
      resolveNotifyTargets({
        source: "admin",
        customerEmail: "cliente@example.com",
        adminEmail: "admin@shop.com",
      }),
    ).toEqual({
      customerEmail: null,
      adminEmails: ["admin@shop.com"],
    });
  });
});
